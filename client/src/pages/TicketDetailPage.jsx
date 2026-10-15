import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { getRegistrationById, cancelRegistration } from '../services/registrationService';
import { useAuth } from '../contexts/AuthContext';
import EventViserLogo from '../components/common/EventViserLogo';
import Button from '../components/ui/Button';
import useDocumentTitle from '../hooks/useDocumentTitle';

const STATUS_STYLES = {
  confirmed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  attended: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
};

const STATUS_LABELS = {
  confirmed: 'Confirmed & Valid',
  cancelled: 'Cancelled Pass',
  attended: 'Checked In / Attended',
};

const TicketDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useDocumentTitle(
    registration ? `Ticket #${registration.confirmationCode || 'Detail'} — EventViser` : 'Digital Ticket'
  );

  const fetchRegistration = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getRegistrationById(id);
      const data = response.data?.registration || response.registration || response.data;
      setRegistration(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setFetchError(true);
        toast.error('Failed to load ticket details.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRegistration();
  }, [fetchRegistration]);

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      await cancelRegistration(registration._id);
      toast.success('Registration cancelled successfully.');
      setShowCancelModal(false);
      await fetchRegistration();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to cancel registration.';
      toast.error(message);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(registration.confirmationCode);
      setCopiedCode(true);
      toast.success('Confirmation code copied to clipboard!');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error('Failed to copy confirmation code.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-6 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-96 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  if (fetchError || notFound || !registration) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <span className="text-6xl mb-4">🎟️</span>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Ticket Not Found</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md text-sm">
          This digital ticket could not be found or you do not have permission to view it.
        </p>
        <Link to="/tickets" className="mt-6">
          <Button variant="primary" size="md">
            View My Tickets
          </Button>
        </Link>
      </div>
    );
  }

  const event = registration.event || {};
  const attendee = registration.user || user || {};
  const eventDate = event.date ? new Date(event.date) : null;
  const venue = event.location?.venue || event.venue;
  const city = event.location?.city || event.city;
  const locationStr = [venue, city].filter(Boolean).join(', ') || 'Campus Hall';
  const isCancelled = registration.status === 'cancelled';
  const isConfirmed = registration.status === 'confirmed';
  const canCancel = isConfirmed && eventDate && eventDate > new Date();

  // Google Calendar URL generator
  const calendarTitle = encodeURIComponent(event.title || 'Campus Event');
  const calendarLocation = encodeURIComponent(locationStr);
  const calendarDetails = encodeURIComponent(`Ticket Code: ${registration.confirmationCode}\n${event.description || ''}`);
  const calendarDateFormatted = eventDate ? format(eventDate, "yyyyMMdd'T'HHmmss") : '';
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calendarTitle}&dates=${calendarDateFormatted}/${calendarDateFormatted}&details=${calendarDetails}&location=${calendarLocation}`;

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 print:px-0 print:py-0">
        
        {/* Navigation Breadcrumb (Hidden on Print) */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link
            to="/tickets"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            My Ticket Wallet
          </Link>

          <span className="text-xs font-semibold text-slate-400">
            Pass ID: #{registration.confirmationCode?.slice(0, 8)}
          </span>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            BOARDING PASS STYLE DIGITAL TICKET
        ─────────────────────────────────────────────────────────────── */}
        <div className="relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden print:shadow-none print:border print:rounded-none">
          
          {/* Top Decorative Header */}
          <div className="bg-gradient-to-r from-primary-900 via-indigo-900 to-slate-950 p-6 sm:p-8 text-white relative">
            <div className="flex items-center justify-between mb-4">
              <EventViserLogo size="sm" showText={true} />
              <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border backdrop-blur-md shadow-xs ${STATUS_STYLES[registration.status]}`}>
                {STATUS_LABELS[registration.status]}
              </span>
            </div>

            <h1 className={`text-2xl sm:text-3xl font-black text-white tracking-tight ${isCancelled ? 'line-through opacity-60' : ''}`}>
              {event.title || 'Campus Event'}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300 mt-2 font-medium">
              <span>📅 {eventDate ? format(eventDate, 'EEEE, MMM d, yyyy') : 'Date TBA'}</span>
              {event.time && <span>⏰ {event.time}</span>}
              <span>📍 {locationStr}</span>
            </div>
          </div>

          {/* Notch & Perforated Tear Line */}
          <div className="relative border-t-2 border-dashed border-slate-200 dark:border-slate-800 my-1">
            <div className="absolute -left-4 -top-3.5 w-7 h-7 bg-slate-50 dark:bg-slate-950 rounded-full border-r border-slate-200 dark:border-slate-800 print:bg-white" />
            <div className="absolute -right-4 -top-3.5 w-7 h-7 bg-slate-50 dark:bg-slate-950 rounded-full border-l border-slate-200 dark:border-slate-800 print:bg-white" />
          </div>

          {/* QR Code & Check-in Pass Body */}
          <div className="p-6 sm:p-8 space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-block p-4 rounded-3xl bg-white dark:bg-white border-2 border-slate-200 dark:border-slate-300 shadow-md">
                <QRCodeSVG
                  value={registration.confirmationCode}
                  size={190}
                  level="H"
                  includeMargin={true}
                  className="print:opacity-100"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Unique Confirmation Code
                </span>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-2 group px-4 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Click to copy code"
                >
                  <span className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-slate-900 dark:text-white">
                    {registration.confirmationCode}
                  </span>
                  <span className="text-xs text-primary-600 dark:text-primary-400 font-semibold group-hover:underline">
                    {copiedCode ? '✓ Copied' : 'Copy'}
                  </span>
                </button>
                <p className="text-xs text-slate-400 mt-1">
                  Show this QR code at the door for instant check-in.
                </p>
              </div>
            </div>

            {/* Attendee Details Table */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-5 space-y-3 text-xs border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Attendee Name</span>
                <span className="font-bold text-slate-900 dark:text-white text-right">
                  {attendee.name || 'Student Attendee'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 font-medium">Registered Email</span>
                <span className="font-bold text-slate-900 dark:text-white text-right truncate max-w-[240px]">
                  {attendee.email || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 font-medium">Registration Date</span>
                <span className="font-bold text-slate-900 dark:text-white text-right">
                  {format(new Date(registration.registeredAt || registration.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
              {registration.checkedInAt && (
                <div className="flex justify-between items-center py-1 border-t border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400">
                  <span className="font-semibold">Checked In At</span>
                  <span className="font-bold">
                    {format(new Date(registration.checkedInAt), 'MMM d, h:mm a')}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons (Print-Hidden) */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 print:hidden">
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={handlePrint}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                  </svg>
                }
              >
                Print / Save PDF
              </Button>

              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full"
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  }
                >
                  Add to Google Calendar
                </Button>
              </a>

              {canCancel && (
                <Button
                  variant="ghost"
                  size="md"
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs print:hidden">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center text-xl font-bold">
                ✕
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Release Your Ticket?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to cancel your spot for <span className="font-semibold text-slate-900 dark:text-white">{event.title}</span>? This ticket code will be invalidated immediately.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelLoading}
              >
                Keep Ticket
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleCancel}
                isLoading={cancelLoading}
              >
                Cancel Pass
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          nav, footer, .print\\:hidden { display: none !important; }
          .print\\:px-0 { padding-left: 0 !important; padding-right: 0 !important; }
          .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border { border: 1px solid #cbd5e1 !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
        }
      `}</style>
    </>
  );
};

export default TicketDetailPage;
