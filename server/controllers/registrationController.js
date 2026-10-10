const Registration = require('../models/Registration');
const Event = require('../models/Event');
const AppError = require('../utils/AppError');
const escapeRegex = require('../utils/escapeRegex');
const { sendEmail } = require('../utils/emailService');
const generateConfirmationEmail = require('../templates/confirmationEmail');
const generateCancellationEmail = require('../templates/cancellationEmail');

// @desc    Register for an event (race-condition safe)
// @route   POST /api/events/:id/register
const registerForEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;

    const event = await Event.findById(eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.status !== 'published') {
      throw new AppError('Event is not available for registration', 400);
    }

    if (event.date < new Date()) {
      throw new AppError('Event has already passed', 400);
    }

    const existingRegistration = await Registration.findOne({
      user: userId,
      event: eventId,
    });

    if (existingRegistration && existingRegistration.status === 'confirmed') {
      throw new AppError('You are already registered for this event', 400);
    }

    // Atomic capacity check — prevents race conditions on last-spot registration
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        status: 'published',
        $expr: { $lt: ['$registeredCount', '$capacity'] },
      },
      { $inc: { registeredCount: 1 } },
      { returnDocument: 'after' }
    );

    if (!updatedEvent) {
      throw new AppError('Event is full, no spots available', 400);
    }

    let registration;
    const ticketType = req.body?.ticketType || 'standard';
    const notes = req.body?.notes || '';

    try {
      if (existingRegistration && existingRegistration.status === 'cancelled') {
        existingRegistration.status = 'confirmed';
        existingRegistration.ticketType = ticketType;
        existingRegistration.notes = notes;
        existingRegistration.registeredAt = new Date();
        registration = await existingRegistration.save();
      } else {
        registration = await Registration.create({
          user: userId,
          event: eventId,
          ticketType,
          notes,
        });
      }
    } catch (regError) {
      await Event.findOneAndUpdate(
        { _id: eventId, registeredCount: { $gt: 0 } },
        { $inc: { registeredCount: -1 } }
      );
      throw regError;
    }

    await registration.populate('event', 'title slug date time location image status organizer');

    // Fire-and-forget confirmation email
    sendEmail({
      to: req.user.email,
      subject: `Registration Confirmed — ${updatedEvent.title}`,
      html: generateConfirmationEmail({
        userName: req.user.name,
        eventTitle: updatedEvent.title,
        eventDate: updatedEvent.date,
        eventTime: updatedEvent.time || 'TBA',
        venue: updatedEvent.location?.venue || '',
        city: updatedEvent.location?.city || '',
        confirmationCode: registration.confirmationCode,
        eventSlug: updatedEvent.slug,
      }),
    }).catch((err) => console.error('Confirmation email failed:', err.message));

    res.status(201).json({
      success: true,
      data: {
        registration,
        confirmationCode: registration.confirmationCode,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel a registration
// @route   DELETE /api/registrations/:id
const cancelRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      throw new AppError('Registration not found', 404);
    }

    if (registration.user.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to cancel this registration', 403);
    }

    if (registration.status === 'cancelled') {
      throw new AppError('Registration is already cancelled', 400);
    }

    registration.status = 'cancelled';
    registration.cancelledAt = new Date();
    await registration.save();

    // Atomic decrement with floor at 0
    await Event.findOneAndUpdate(
      { _id: registration.event, registeredCount: { $gt: 0 } },
      { $inc: { registeredCount: -1 } }
    );

    const event = await Event.findById(registration.event).select(
      'title date location'
    );

    // Fire-and-forget cancellation email
    if (event) {
      sendEmail({
        to: req.user.email,
        subject: `Registration Cancelled — ${event.title}`,
        html: generateCancellationEmail({
          userName: req.user.name,
          eventTitle: event.title,
          eventDate: event.date,
          venue: event.location?.venue || '',
          city: event.location?.city || '',
        }),
      }).catch((err) => console.error('Cancellation email failed:', err.message));
    }

    res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user's registrations
// @route   GET /api/registrations/my
const getMyRegistrations = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { user: req.user._id };
    if (status && ['confirmed', 'cancelled', 'attended'].includes(status)) {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [registrations, total] = await Promise.all([
      Registration.find(filter)
        .sort({ registeredAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('event', 'title slug date location image status organizer'),
      Registration.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        registrations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get a single registration by ID
// @route   GET /api/registrations/:id
const getRegistrationById = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('event', 'title slug date time location image status organizer')
      .populate('user', 'name email avatar');

    if (!registration) {
      throw new AppError('Registration not found', 404);
    }

    const isOwner =
      registration.user._id.toString() === req.user._id.toString();
    const isAdminOrOrganizer =
      req.user.role === 'admin' ||
      registration.event.organizer?.toString() === req.user._id.toString();

    if (!isOwner && !isAdminOrOrganizer) {
      throw new AppError('Not authorized to view this registration', 403);
    }

    res.status(200).json({
      success: true,
      data: { registration },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Find registration by confirmation code
// @route   GET /api/registrations/code/:code
const getRegistrationByCode = async (req, res, next) => {
  try {
    const registration = await Registration.findOne({
      confirmationCode: req.params.code.toUpperCase(),
    })
      .populate('event', 'title slug date time location image status organizer')
      .populate('user', 'name email avatar');

    if (!registration) {
      throw new AppError('Registration not found', 404);
    }

    const isOwner =
      registration.user._id.toString() === req.user._id.toString();
    const isAdminOrOrganizer =
      req.user.role === 'admin' ||
      registration.event.organizer?.toString() === req.user._id.toString();

    if (!isOwner && !isAdminOrOrganizer) {
      throw new AppError('Not authorized to view this registration', 403);
    }

    res.status(200).json({
      success: true,
      data: { registration },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all registrations for a specific event (organizer/admin)
// @route   GET /api/events/:id/registrations
const getEventRegistrations = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const isOrganizer =
      event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      throw new AppError('Not authorized to view registrations for this event', 403);
    }

    const { status, search, page = 1, limit = 20 } = req.query;

    const filter = { event: event._id };
    if (status && ['confirmed', 'cancelled', 'attended'].includes(status)) {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    let registrationsQuery = Registration.find(filter)
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('user', 'name email phone avatar');

    const [registrations, total, confirmedCount, cancelledCount, attendedCount] =
      await Promise.all([
        registrationsQuery,
        Registration.countDocuments(filter),
        Registration.countDocuments({ event: event._id, status: 'confirmed' }),
        Registration.countDocuments({ event: event._id, status: 'cancelled' }),
        Registration.countDocuments({ event: event._id, status: 'attended' }),
      ]);

    let filteredRegistrations = registrations;
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      filteredRegistrations = registrations.filter(
        (reg) =>
          searchRegex.test(reg.user?.name) || searchRegex.test(reg.user?.email)
      );
    }

    const totalConfirmed = confirmedCount;
    const totalCancelled = cancelledCount;
    const activeRegistrations = confirmedCount + attendedCount;
    const checkInRate =
      activeRegistrations > 0
        ? Math.round((attendedCount / activeRegistrations) * 100 * 10) / 10
        : 0;
    const capacityPercentage =
      event.capacity > 0
        ? Math.round((activeRegistrations / event.capacity) * 100)
        : 0;

    res.status(200).json({
      success: true,
      data: {
        registrations: filteredRegistrations,
        stats: {
          totalConfirmed,
          totalCancelled,
          totalAttended: attendedCount,
          activeRegistrations,
          checkInRate,
          capacityPercentage,
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Check in an attendee (organizer/admin)
// @route   PUT /api/registrations/:id/check-in
const checkInAttendee = async (req, res, next) => {
  try {
    // Find by ID or confirmation code
    let registration = await Registration.findById(req.params.id).populate(
      'event',
      'organizer title'
    );

    if (!registration) {
      registration = await Registration.findOne({
        confirmationCode: req.params.id.toUpperCase(),
      }).populate('event', 'organizer title');
    }

    if (!registration) {
      throw new AppError('Registration not found', 404);
    }

    const isOrganizer =
      registration.event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      throw new AppError('Not authorized to check in attendees for this event', 403);
    }

    if (registration.status === 'attended') {
      throw new AppError('Attendee has already been checked in', 400);
    }

    if (registration.status === 'cancelled') {
      throw new AppError('Cannot check in a cancelled registration', 400);
    }

    if (registration.status !== 'confirmed') {
      throw new AppError('Only confirmed registrations can be checked in', 400);
    }

    registration.status = 'attended';
    registration.checkedInAt = new Date();
    await registration.save();

    await registration.populate('user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Attendee checked in successfully',
      data: { registration },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get event statistics (organizer/admin)
// @route   GET /api/events/:id/stats
const getEventStats = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const isOrganizer =
      event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      throw new AppError('Not authorized to view stats for this event', 403);
    }

    const [totalRegistrations, confirmedCount, cancelledCount, attendedCount] =
      await Promise.all([
        Registration.countDocuments({ event: event._id }),
        Registration.countDocuments({ event: event._id, status: 'confirmed' }),
        Registration.countDocuments({ event: event._id, status: 'cancelled' }),
        Registration.countDocuments({ event: event._id, status: 'attended' }),
      ]);

    const activeRegistrations = confirmedCount + attendedCount;
    const checkInRate =
      activeRegistrations > 0
        ? Math.round((attendedCount / activeRegistrations) * 100 * 10) / 10
        : 0;

    const capacityPercentage =
      event.capacity > 0
        ? Math.round((activeRegistrations / event.capacity) * 100)
        : 0;

    const revenueEstimate = event.price * activeRegistrations;

    res.status(200).json({
      success: true,
      data: {
        event: {
          id: event._id,
          title: event.title,
          capacity: event.capacity,
          price: event.price,
          currency: event.currency,
        },
        stats: {
          totalRegistrations,
          confirmedCount,
          cancelledCount,
          attendedCount,
          activeRegistrations,
          checkInRate,
          capacityPercentage,
          revenueEstimate,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// Helper: Escape CSV cells and protect against spreadsheet formula injection
const sanitizeCSVCell = (val) => {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  // Formula injection mitigation: prepend single quote if starting with =, +, -, @, tab, or carriage return
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
};

// @desc    Export event attendee roster as CSV (organizer/admin)
// @route   GET /api/events/:id/registrations/export
const exportEventRosterCSV = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const isOrganizer =
      event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      throw new AppError('Not authorized to export registrations for this event', 403);
    }

    const { status, search } = req.query;

    const filter = { event: event._id };
    if (status && ['confirmed', 'cancelled', 'attended'].includes(status)) {
      filter.status = status;
    }

    const [allRegistrations, confirmedCount, cancelledCount, attendedCount, totalRegistrations] =
      await Promise.all([
        Registration.find(filter)
          .sort({ registeredAt: -1 })
          .populate('user', 'name email phone role'),
        Registration.countDocuments({ event: event._id, status: 'confirmed' }),
        Registration.countDocuments({ event: event._id, status: 'cancelled' }),
        Registration.countDocuments({ event: event._id, status: 'attended' }),
        Registration.countDocuments({ event: event._id }),
      ]);

    let exportedList = allRegistrations;
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      exportedList = allRegistrations.filter(
        (reg) =>
          searchRegex.test(reg.user?.name) ||
          searchRegex.test(reg.user?.email) ||
          searchRegex.test(reg.confirmationCode)
      );
    }

    const activeRegistrations = confirmedCount + attendedCount;
    const checkInRate =
      activeRegistrations > 0
        ? Math.round((attendedCount / activeRegistrations) * 100 * 10) / 10
        : 0;
    const capacityPercentage =
      event.capacity > 0
        ? Math.round((activeRegistrations / event.capacity) * 100)
        : 0;

    // Define CSV headers
    const columns = [
      'Registration ID',
      'Confirmation Code',
      'Attendee Name',
      'Attendee Email',
      'Attendee Phone',
      'Ticket Type',
      'Status',
      'Registered At',
      'Checked-In At',
      'Notes',
    ];

    const dataRows = exportedList.map((reg) => [
      sanitizeCSVCell(reg._id),
      sanitizeCSVCell(reg.confirmationCode),
      sanitizeCSVCell(reg.user?.name || 'N/A'),
      sanitizeCSVCell(reg.user?.email || 'N/A'),
      sanitizeCSVCell(reg.user?.phone || 'N/A'),
      sanitizeCSVCell(reg.ticketType || 'standard'),
      sanitizeCSVCell(reg.status),
      sanitizeCSVCell(reg.registeredAt ? reg.registeredAt.toISOString() : 'N/A'),
      sanitizeCSVCell(reg.checkedInAt ? reg.checkedInAt.toISOString() : 'N/A'),
      sanitizeCSVCell(reg.notes || ''),
    ]);

    // Analytics summary block
    const summaryRows = [
      [],
      [sanitizeCSVCell('--- EVENT ATTENDANCE & CHECK-IN ANALYTICS ---')],
      [sanitizeCSVCell('Event Title'), sanitizeCSVCell(event.title)],
      [sanitizeCSVCell('Event Date'), sanitizeCSVCell(event.date ? event.date.toISOString() : 'N/A')],
      [sanitizeCSVCell('Total Registrations'), sanitizeCSVCell(totalRegistrations)],
      [sanitizeCSVCell('Active Registrations'), sanitizeCSVCell(activeRegistrations)],
      [sanitizeCSVCell('Checked In (Attended)'), sanitizeCSVCell(attendedCount)],
      [sanitizeCSVCell('Pending Check-In (Confirmed)'), sanitizeCSVCell(confirmedCount)],
      [sanitizeCSVCell('Cancelled'), sanitizeCSVCell(cancelledCount)],
      [sanitizeCSVCell('Check-In Rate'), sanitizeCSVCell(`${checkInRate}%`)],
      [sanitizeCSVCell('Capacity Limit'), sanitizeCSVCell(event.capacity)],
      [sanitizeCSVCell('Capacity Utilization'), sanitizeCSVCell(`${capacityPercentage}%`)],
      [sanitizeCSVCell('Filtered Roster Records Exported'), sanitizeCSVCell(exportedList.length)],
      [sanitizeCSVCell('Generated At'), sanitizeCSVCell(new Date().toISOString())],
    ];

    const csvLines = [
      columns.map(sanitizeCSVCell).join(','),
      ...dataRows.map((row) => row.join(',')),
      ...summaryRows.map((row) => row.join(',')),
    ];

    const csvContent = csvLines.join('\r\n');

    const rawSlug = (event.slug || event.title || 'event')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const filename = `roster-${rawSlug || 'event'}-${status || 'all'}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Total-Count', totalRegistrations.toString());
    res.setHeader('X-Checked-In-Count', attendedCount.toString());
    res.setHeader('X-Check-In-Rate', checkInRate.toString());

    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getRegistrationById,
  getRegistrationByCode,
  getEventRegistrations,
  checkInAttendee,
  getEventStats,
  exportEventRosterCSV,
};
