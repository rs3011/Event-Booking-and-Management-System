import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getFeaturedEvents, getEvents } from '../services/eventService';
import EventCard from '../components/ui/EventCard';
import EventImage from '../components/ui/EventImage';
import Button from '../components/ui/Button';
import SkeletonCard from '../components/ui/SkeletonCard';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { format } from 'date-fns';

const CATEGORIES = [
  { id: 'all', label: 'All Events', icon: '✨' },
  { id: 'workshop', label: 'Workshops', icon: '💻' },
  { id: 'seminar', label: 'Seminars & AI', icon: '🧠' },
  { id: 'conference', label: 'Conferences', icon: '🏛️' },
  { id: 'concert', label: 'Concerts & Fests', icon: '🎵' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'networking', label: 'Networking', icon: '🤝' },
];

const HomePage = () => {
  useDocumentTitle('EventViser — Campus Events, Simplified');
  const navigate = useNavigate();

  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const [featuredRes, upcomingRes] = await Promise.allSettled([
          getFeaturedEvents(),
          getEvents({ status: 'published', limit: 8, sort: 'date' }),
        ]);

        if (featuredRes.status === 'fulfilled') {
          const fData = featuredRes.value?.data || featuredRes.value?.events || featuredRes.value || [];
          setFeaturedEvents(Array.isArray(fData) ? fData : []);
        }

        if (upcomingRes.status === 'fulfilled') {
          const uData = upcomingRes.value?.data?.events || upcomingRes.value?.events || upcomingRes.value?.data || [];
          setUpcomingEvents(Array.isArray(uData) ? uData : []);
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const spotlightEvent = featuredEvents[0] || upcomingEvents[0];
  const totalRegistrations = upcomingEvents.reduce((acc, ev) => acc + (ev.registeredCount || 0), 0);
  const totalCapacity = upcomingEvents.reduce((acc, ev) => acc + (ev.capacity || 0), 0);
  const aggregateFillRate = totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;

  const filteredEvents = upcomingEvents.filter((event) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      event.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-16 sm:space-y-24 pb-16 overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION: Benefit-Driven with Product Visual
      ─────────────────────────────────────────────────────────────── */}
      <section className="relative pt-6 sm:pt-12">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-primary-600/15 to-coral-500/10 blur-[100px] -z-10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Direct Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                  Campus Events, Simplified
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
                Discover. Register.{' '}
                <span className="bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 dark:from-primary-400 dark:via-indigo-400 dark:to-purple-300 bg-clip-text text-transparent">
                  Show up.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Find the campus events worth attending and manage your entire registration journey from one platform — with instant digital QR tickets and zero event-day chaos.
              </p>

              {/* Dual Action CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link to="/events" className="w-full sm:w-auto">
                  <Button size="lg" variant="primary" className="w-full sm:w-auto text-base px-8 shadow-lg shadow-primary-500/20" icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  }>
                    Explore Events
                  </Button>
                </Link>

                <Link to="/organizer/events/create" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base px-7">
                    Organize an Event
                  </Button>
                </Link>
              </div>

              {/* Proof-Point Micro Badges */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-3 gap-3 text-left">
                <div className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Instant</div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Digital QR Tickets</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Atomic</div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Zero Overbooking</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">1-Tap</div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Check-In Scanner</div>
                </div>
              </div>
            </div>

            {/* Right Column: High-Fidelity Product Visual (Bound to live API data) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md rounded-3xl bg-slate-900 p-3 sm:p-4 shadow-2xl border border-slate-800 text-white select-none">
                {/* Window header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 px-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Campus Operations Feed</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                    {loading ? 'Syncing...' : 'Live'}
                  </span>
                </div>

                {/* Dashboard preview content */}
                <div className="space-y-4 pt-4">
                  {/* Metric row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/60">
                      <span className="text-xs font-medium text-slate-400">Active Bookings</span>
                      <div className="text-2xl font-black text-white mt-0.5">
                        {loading ? '...' : totalRegistrations}
                      </div>
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                        ↑ {aggregateFillRate}% Capacity
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/60">
                      <span className="text-xs font-medium text-slate-400">Active Events</span>
                      <div className="text-2xl font-black text-white mt-0.5">
                        {loading ? '...' : upcomingEvents.length}
                      </div>
                      <span className="text-[11px] text-primary-400 font-semibold mt-1 block">
                        Open Registrations
                      </span>
                    </div>
                  </div>

                  {/* Active Event Card Preview */}
                  {spotlightEvent ? (
                    <Link
                      to={`/events/${spotlightEvent.slug}`}
                      className="block p-4 rounded-2xl bg-gradient-to-r from-primary-950/70 via-slate-800 to-slate-800 border border-primary-800/40 space-y-3 hover:border-primary-500/60 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-coral-400 flex items-center gap-1">
                          {spotlightEvent.capacity > 0 && Math.max(0, spotlightEvent.capacity - (spotlightEvent.registeredCount || 0)) <= 15
                            ? `🔥 ${Math.max(0, spotlightEvent.capacity - (spotlightEvent.registeredCount || 0))} Spots Left`
                            : 'Open for Registration'}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-bold bg-primary-600/30 text-primary-300 px-2 py-0.5 rounded-md">
                          {spotlightEvent.category || 'Event'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white line-clamp-1">{spotlightEvent.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {spotlightEvent.location?.venue || spotlightEvent.venue || 'Campus Venue'} • {spotlightEvent.date ? format(new Date(spotlightEvent.date), 'MMM dd, h:mm a') : 'Upcoming'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>{spotlightEvent.registeredCount || 0} registered</span>
                          <span>{spotlightEvent.capacity || 0} max capacity</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-coral-500 rounded-full"
                            style={{
                              width: `${spotlightEvent.capacity > 0 ? Math.min(100, Math.round(((spotlightEvent.registeredCount || 0) / spotlightEvent.capacity) * 100)) : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/40 text-center py-6 text-slate-400 text-xs">
                      No active events scheduled yet.
                    </div>
                  )}

                  {/* Ticket confirmation sample */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 text-xs">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                      ✓
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-white block">Digital Pass Issued</span>
                      <span className="text-emerald-300 text-[11px]">Instant QR Code with Confirmation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. SPOTLIGHT / FEATURED HERO EVENT (Conversion Focus)
      ─────────────────────────────────────────────────────────────── */}
      {spotlightEvent && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 border border-slate-800 shadow-xl overflow-hidden p-6 sm:p-10 text-white">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-5 rounded-2xl overflow-hidden shadow-lg border border-white/10">
                <EventImage
                  src={spotlightEvent.image}
                  alt={spotlightEvent.title}
                  category={spotlightEvent.category}
                  aspectRatio="aspect-video"
                  priority={true}
                />
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-primary-500/20 text-primary-300 border border-primary-500/30">
                    Featured Event
                  </span>
                  <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-coral-500/20 text-coral-300 border border-coral-500/30">
                    {spotlightEvent.category || 'Special'}
                  </span>
                  {spotlightEvent.capacity > 0 && (
                    <span className="text-xs text-slate-300">
                      {spotlightEvent.registeredCount || 0} / {spotlightEvent.capacity} spots filled
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                  {spotlightEvent.title}
                </h2>

                <p className="text-sm sm:text-base text-slate-300 line-clamp-3 leading-relaxed">
                  {spotlightEvent.description}
                </p>

                <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <span>{spotlightEvent.date ? format(new Date(spotlightEvent.date), 'EEEE, MMMM d, yyyy') : 'Date TBA'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span>{spotlightEvent.location?.venue || spotlightEvent.venue || 'Campus Auditorium'}</span>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <Button
                    size="lg"
                    variant="accent"
                    onClick={() => navigate(`/events/${spotlightEvent.slug}`)}
                  >
                    View & Register Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. MARKETPLACE DISCOVERY: Filters & Events Grid
      ─────────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Campus Marketplace
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              Explore Upcoming Events
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Find something worth showing up for. Book your spot with a single click.
            </p>
          </div>

          {/* Quick Search */}
          <div className="w-full md:w-72">
            <div className="relative">
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 border ${
                selectedCategory === cat.id
                  ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/25 scale-[1.02]'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Event Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 p-8">
            <span className="text-4xl mb-3 block">🔍</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No events found in this category</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Try switching your category filter or clearing your search keywords.
            </p>
            <Button size="sm" variant="secondary" onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}>
              Reset Filters
            </Button>
          </div>
        )}

        <div className="text-center pt-4">
          <Link to="/events">
            <Button size="md" variant="outline" className="px-8">
              View All Campus Events →
            </Button>
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. HOW IT WORKS: Two-Sided Platform Value
      ─────────────────────────────────────────────────────────────── */}
      <section className="bg-slate-100/70 dark:bg-slate-900/50 py-16 sm:py-20 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Frictionless Platform
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Engineered for Modern Campus Life
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Whether you are discovering something new or hosting hundreds of peers, EventViser eliminates manual ticketing chaos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-xl border border-primary-100 dark:border-primary-900">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">1. Discover & Reserve</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Filter by verified student clubs and categories. Reserve your seat in one tap with atomic capacity guards that prevent overbooking.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-coral-50 dark:bg-coral-950/60 text-coral-600 dark:text-coral-400 flex items-center justify-center font-bold text-xl border border-coral-100 dark:border-coral-900">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">2. Get Your QR Ticket</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Receive an encrypted digital pass instantly with unique confirmation codes, printable formats, and direct Google Calendar sync.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-100 dark:border-emerald-900">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">3. Fast Door Check-In</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Organizers verify attendees in seconds with real-time check-in stats and one-click injection-safe CSV attendee exports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. CALL TO ACTION: Host on EventViser
      ─────────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-primary-900 via-indigo-900 to-slate-950 p-8 sm:p-14 text-center text-white space-y-6 shadow-2xl border border-primary-800/50">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary-300 bg-primary-800/40 px-3 py-1 rounded-full border border-primary-700/50">
            For Student Clubs & Organizers
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight max-w-2xl mx-auto">
            Ready to host your next conference, workshop, or campus fest?
          </h2>
          <p className="text-base text-slate-300 max-w-xl mx-auto font-normal">
            Publish your event in minutes with our 5-step guided wizard, Cloudinary banner uploads, and automated attendee communications.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/organizer/events/create">
              <Button size="lg" variant="accent" className="w-full sm:w-auto px-8">
                Host an Event Now
              </Button>
            </Link>
            <Link to="/events">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto px-8">
                Browse Directory
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
