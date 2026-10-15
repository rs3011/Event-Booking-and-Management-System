import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import * as organizerService from '../../services/organizerService';
import CapacityBar from '../../components/ui/CapacityBar';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const OrganizerDashboardPage = () => {
  useDocumentTitle('Organizer Dashboard | EventViser');

  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, eventsRes, registrationsRes, revenueRes] = await Promise.allSettled([
          organizerService.getDashboardStats(),
          organizerService.getUpcomingEvents(),
          organizerService.getRecentRegistrations(),
          organizerService.getRevenueBreakdown(),
        ]);

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data || statsRes.value);
        }
        if (eventsRes.status === 'fulfilled') {
          setUpcomingEvents(eventsRes.value.data || eventsRes.value || []);
        }
        if (registrationsRes.status === 'fulfilled') {
          setRecentRegistrations(registrationsRes.value.data || registrationsRes.value || []);
        }
        if (revenueRes.status === 'fulfilled') {
          setRevenueBreakdown(revenueRes.value.data || revenueRes.value || []);
        }
      } catch {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const maxRevenue = revenueBreakdown.length > 0
    ? Math.max(...revenueBreakdown.map((r) => r.revenue || 0))
    : 0;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* ═══════ Welcome SaaS Header ═══════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Organizer Operations Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back, {user?.name || 'Organizer'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {format(new Date(), 'EEEE, MMMM dd, yyyy')} • Real-time overview of your campus events
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/organizer/events/create">
            <Button
              variant="primary"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
            >
              Create Event
            </Button>
          </Link>
          <Link to="/organizer/events">
            <Button variant="secondary">
              All Events
            </Button>
          </Link>
        </div>
      </div>

      {/* ═══════ Stats Cards ═══════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Total Events"
          value={stats?.totalEvents ?? 0}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
          variant="primary"
        />

        <StatCard
          label="Total Registrations"
          value={stats?.totalRegistered ?? 0}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
            </svg>
          }
          variant="emerald"
        />

        <StatCard
          label="Estimated Gross Value"
          value={`$${(stats?.totalRevenue ?? stats?.estimatedRevenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          variant="coral"
        />

        <StatCard
          label="Capacity Fill Rate"
          value={`${Math.round(stats?.capacityUtilization ?? 0)}%`}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
          variant="violet"
        />
      </div>

      {/* ═══════ Main Content Grid ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Upcoming Events — ~60% */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Upcoming Events</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Events scheduled on your roster</p>
            </div>
            <Link
              to="/organizer/events"
              className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
            >
              View all ({upcomingEvents.length}) →
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
            {upcomingEvents.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No upcoming events scheduled"
                  description="Create your first campus event to begin accepting registrations."
                  actionLabel="+ Create Event"
                  onAction="/organizer/events/create"
                />
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event._id} className="p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800">
                          {event.category || 'Event'}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {format(new Date(event.date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white truncate text-base hover:text-primary-600 transition-colors">
                        <Link to={`/events/${event.slug || event._id}`}>{event.title}</Link>
                      </h3>
                      <div className="mt-2 max-w-xs">
                        <CapacityBar
                          current={event.registeredCount || 0}
                          total={event.capacity || 0}
                          size="sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/organizer/events/${event._id}/attendees`}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors"
                      >
                        Roster ({event.registeredCount || 0})
                      </Link>
                      <Link
                        to={`/organizer/events/${event._id}/edit`}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/events/${event.slug || event._id}`}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title="View Live Page"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Registrations — ~40% */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Live Registrations</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Recent ticket confirmations</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Latest</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
            {recentRegistrations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <svg className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <p className="text-xs">No registrations received yet.</p>
              </div>
            ) : (
              recentRegistrations.slice(0, 8).map((reg) => (
                <div key={reg._id} className="flex items-center gap-3 p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {(reg.attendeeName || reg.user?.name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {reg.attendeeName || reg.user?.name || 'Anonymous Attendee'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {reg.eventTitle || reg.event?.title || 'Campus Event'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 block">
                      Confirmed
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                      {formatDistanceToNow(new Date(reg.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ═══════ Revenue Breakdown ═══════ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Revenue & Headcount per Event</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Commercial performance across your active roster</p>
        </div>

        <div className="p-6">
          {revenueBreakdown.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <p className="text-sm">No ticket sales or revenue data available yet.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {revenueBreakdown.map((item) => {
                const barWidth = maxRevenue > 0 ? ((item.revenue || 0) / maxRevenue) * 100 : 0;

                return (
                  <div key={item._id || item.eventId} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[60%]">
                        {item.title || item.eventTitle}
                      </span>
                      <div className="flex items-center gap-3 text-sm shrink-0">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {item.confirmedCount ?? item.registrations ?? 0} tickets
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          ${(item.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 rounded-full transition-all duration-700 ease-out group-hover:from-primary-600 group-hover:to-indigo-700"
                        style={{ width: `${Math.max(barWidth, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div>
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-64" />
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-40 mt-2" />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-16" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24" />
          </div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-40" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
          </div>
        ))}
      </div>
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-40" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

export default OrganizerDashboardPage;
