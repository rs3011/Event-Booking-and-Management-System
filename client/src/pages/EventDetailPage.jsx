import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, isPast, differenceInHours, differenceInMinutes } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { getEventBySlug, getEvents } from '../services/eventService';
import { registerForEvent, cancelRegistration } from '../services/registrationService';
import EventCard from '../components/ui/EventCard';
import EventImage from '../components/ui/EventImage';
import Button from '../components/ui/Button';
import { formatCurrency } from '../utils/formatters';
import useDocumentTitle from '../hooks/useDocumentTitle';

const CATEGORY_STYLES = {
  conference: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900',
  workshop: 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 border-primary-200 dark:border-primary-900',
  seminar: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
  meetup: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900',
  concert: 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-900',
  sports: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-900',
  networking: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-900',
  webinar: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-900',
};

const formatDuration = (start, end) => {
  if (!start || !end) return null;
  const hours = differenceInHours(new Date(end), new Date(start));
  const totalMinutes = differenceInMinutes(new Date(end), new Date(start));
  const remainingMinutes = totalMinutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

const EventDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useDocumentTitle(event?.title || 'Event Detail — EventViser');

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getEventBySlug(slug);
      const responseData = response.data || response;
      const eventObj = responseData.event || responseData;
      if (responseData.isRegistered) {
        eventObj.userRegistration = responseData.userRegistration || { _registered: true };
      }
      setEvent(eventObj);

      if (eventObj.category) {
        try {
          const relatedRes = await getEvents({
            category: eventObj.category,
            limit: 4,
            status: 'published',
          });
          const allRelated = relatedRes.data?.events || relatedRes.data || relatedRes.events || [];
          setRelatedEvents(
            allRelated.filter((e) => e._id !== eventObj._id).slice(0, 3)
          );
        } catch {
          // Non-critical
        }
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error('Failed to load event details.');
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const eventDate = event ? new Date(event.date) : null;
  const endDate = event?.endDate ? new Date(event.endDate) : null;
  const isEventPast = eventDate ? isPast(eventDate) : false;
  const capacity = event?.capacity || 0;
  const registeredCount = event?.registeredCount || 0;
  const isFull = capacity > 0 && registeredCount >= capacity;
  const spotsLeft = Math.max(0, capacity - registeredCount);
  const percentBooked = capacity > 0 ? Math.round((registeredCount / capacity) * 100) : 0;
  const isUrgent = !isEventPast && !isFull && spotsLeft > 0 && spotsLeft <= 15;

  const isOrganizer = user && event?.organizer && (
    user._id === event.organizer._id || user._id === event.organizer
  );
  const userRegistration = event?.userRegistration || null;
  const isRegistered = !!userRegistration;

  const venue = event?.location?.venue || event?.venue;
  const address = event?.location?.address || event?.address;
  const city = event?.location?.city || event?.city;
  const country = event?.location?.country || event?.country;
  const fullAddress = [venue, address, city, country].filter(Boolean).join(', ');
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`;

  const handleRegister = async () => {
    setRegistrationLoading(true);
    try {
      const regRes = await registerForEvent(event._id, { notes });
      toast.success('Registration confirmed! Check your digital ticket.');
      setShowRegisterModal(false);
      setNotes('');
      const regId = regRes?.data?.registration?._id || regRes?.registration?._id || regRes?.data?._id;
      if (regId) {
        navigate(`/tickets/${regId}`);
      } else {
        await fetchEvent();
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    setRegistrationLoading(true);
    try {
      await cancelRegistration(userRegistration._id || userRegistration);
      toast.success('Registration cancelled.');
      setShowCancelModal(false);
      await fetchEvent();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to cancel registration.';
      toast.error(message);
    } finally {
      setRegistrationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="aspect-[21/9] w-full bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="lg:col-span-4 h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <span className="text-6xl mb-4">🔍</span>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Event Not Found</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">
          This event may have been removed, cancelled, or the link may be mistyped.
        </p>
        <Link to="/events" className="mt-6">
          <Button variant="primary" size="md">
            Browse All Campus Events
          </Button>
        </Link>
      </div>
    );
  }

  const categoryStyle = CATEGORY_STYLES[event.category?.toLowerCase()] || 'bg-slate-100 text-slate-700 border-slate-200';
  const organizer = event.organizer || {};

  return (
    <div className="space-y-10 pb-16">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION BREADCRUMB
      ─────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Events Marketplace
        </Link>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. HIGH-IMPACT HERO BANNER
      ─────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-slate-950">
          <EventImage
            src={event.image}
            alt={event.title}
            category={event.category}
            aspectRatio="aspect-[21/9]"
            priority={true}
            imgClassName="opacity-90"
          />

          {/* Badges Overlay */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-wrap items-center gap-2 z-10">
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-xl border backdrop-blur-md shadow-sm ${categoryStyle}`}>
              {event.category || 'Campus Event'}
            </span>
            {isUrgent && (
              <span className="px-3 py-1 text-xs font-bold rounded-xl bg-coral-500 text-white shadow-md animate-pulse-subtle flex items-center gap-1">
                <span>🔥</span>
                <span>Only {spotsLeft} {spotsLeft === 1 ? 'seat' : 'seats'} left</span>
              </span>
            )}
            {isFull && (
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-xl bg-rose-600 text-white shadow-sm">
                Sold Out
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN LAYOUT: NARRATIVE (LEFT) + STICKY CONVERSION (RIGHT)
      ─────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT COLUMN: Narrative & Details (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Title & Key Meta */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {event.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 dark:text-slate-300 pt-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <span className="font-semibold">{eventDate ? format(eventDate, 'EEEE, MMMM d, yyyy') : 'Date TBA'}</span>
                </div>

                {event.time && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{event.time}</span>
                  </div>
                )}

                {venue && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span>{venue}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description Narrative */}
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                About This Event
              </h2>
              <div className="text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line space-y-4">
                {event.description}
              </div>

              {/* Tags */}
              {event.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Event Schedule & Location Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Schedule Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
                  📅
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Date & Schedule</h3>
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {eventDate ? format(eventDate, 'EEEE, MMM d, yyyy') : 'TBD'}
                  </p>
                  <p>Start Time: {event.time || 'TBA'}</p>
                  {endDate && (
                    <p className="text-xs text-slate-500">
                      Duration: {formatDuration(eventDate, endDate)}
                    </p>
                  )}
                </div>
              </div>

              {/* Venue Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  📍
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Campus Venue</h3>
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-900 dark:text-white">{venue || 'Campus Hall'}</p>
                  <p>{[address, city, country].filter(Boolean).join(', ')}</p>
                  {fullAddress && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline pt-1"
                    >
                      View on Google Maps →
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Organizer Verified Card */}
            {organizer?.name && (
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shrink-0">
                  {organizer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Host / Organizer</span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">{organizer.name}</h4>
                  <p className="text-xs text-slate-500">{organizer.email || 'Verified Campus Organizer'}</p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Sticky High-Conversion Booking Card (4 Cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-6">
              
              {/* Pricing Header */}
              <div className="flex items-baseline justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Registration</span>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    {event.price === 0 ? 'FREE' : formatCurrency(event.price, event.currency)}
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-2.5 py-1 rounded-lg">
                  Instant Confirmation
                </span>
              </div>

              {/* Real-Time Capacity Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">
                    {registeredCount} of {capacity} spots filled
                  </span>
                  <span className={isFull ? 'text-rose-500' : isUrgent ? 'text-coral-500' : 'text-primary-600'}>
                    {percentBooked}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull
                        ? 'bg-rose-500'
                        : isUrgent
                        ? 'bg-coral-500'
                        : 'bg-primary-600'
                    }`}
                    style={{ width: `${Math.min(100, percentBooked)}%` }}
                  />
                </div>
              </div>

              {/* Conversion CTAs */}
              <div className="space-y-3">
                {isEventPast ? (
                  <div className="w-full py-3.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-500 text-center font-bold text-sm rounded-xl">
                    This event has concluded
                  </div>
                ) : isOrganizer ? (
                  <div className="space-y-2">
                    <div className="py-2.5 px-3 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl text-center border border-blue-200 dark:border-blue-900">
                      You are the host of this event
                    </div>
                    <Link to={`/organizer/events/${event._id}/edit`} className="block">
                      <Button variant="primary" size="lg" className="w-full">
                        Edit Event Settings
                      </Button>
                    </Link>
                    <Link to={`/organizer/events/${event._id}/attendees`} className="block">
                      <Button variant="secondary" size="md" className="w-full">
                        View Live Roster & Check-In
                      </Button>
                    </Link>
                  </div>
                ) : isRegistered ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                      <div className="text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center justify-center gap-1.5 mb-1">
                        <span>✓</span>
                        <span>You&apos;re Confirmed!</span>
                      </div>
                      <p className="text-xs text-slate-500">Your spot is safely reserved.</p>
                    </div>

                    <Link to="/tickets" className="block">
                      <Button variant="primary" size="lg" className="w-full">
                        View Digital QR Ticket →
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                      onClick={() => setShowCancelModal(true)}
                    >
                      Cancel Registration
                    </Button>
                  </div>
                ) : !isAuthenticated ? (
                  <div className="space-y-2">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full shadow-lg shadow-primary-500/20"
                      onClick={() => navigate('/auth/login', { state: { from: `/events/${slug}` } })}
                    >
                      Sign In to Register
                    </Button>
                    <p className="text-[11px] text-center text-slate-400">
                      Takes 10 seconds. Free for students.
                    </p>
                  </div>
                ) : isFull ? (
                  <Button disabled variant="secondary" size="lg" className="w-full">
                    Event is Sold Out
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Special requirements or notes for the organizer? (optional)"
                      rows={2}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    />
                    <Button
                      variant={isUrgent ? 'accent' : 'primary'}
                      size="lg"
                      className="w-full shadow-lg"
                      onClick={() => setShowRegisterModal(true)}
                    >
                      Register Now
                    </Button>
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Instant digital ticket generated</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Direct door check-in via QR scan</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Cancel anytime if schedule changes</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. REGISTRATION CONFIRMATION MODAL
      ─────────────────────────────────────────────────────────────── */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 mx-auto flex items-center justify-center text-2xl font-bold">
                🎟️
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Confirm Your Spot
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You are registering for <span className="font-semibold text-slate-900 dark:text-white">{event.title}</span>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Attendee Name:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Attendee Email:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{user?.email}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                <span>Ticket Fee:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {event.price === 0 ? 'FREE' : formatCurrency(event.price, event.currency)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowRegisterModal(false)}
                disabled={registrationLoading}
              >
                Go Back
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleRegister}
                isLoading={registrationLoading}
              >
                Confirm Spot
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. CANCELLATION MODAL
      ─────────────────────────────────────────────────────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center text-2xl font-bold">
                ✕
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Cancel Registration?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your ticket will be released immediately so another student on campus can attend.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowCancelModal(false)}
                disabled={registrationLoading}
              >
                Keep Ticket
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleCancelRegistration}
                isLoading={registrationLoading}
              >
                Release Seat
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. RELATED CAMPUS EVENTS
      ─────────────────────────────────────────────────────────────── */}
      {relatedEvents.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-200/80 dark:border-slate-800 space-y-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            More Events in {event.category || 'This Category'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedEvents.map((rel) => (
              <EventCard key={rel._id} event={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
