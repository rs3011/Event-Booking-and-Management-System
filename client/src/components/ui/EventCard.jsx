import { useNavigate } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';
import EventImage from './EventImage';
import Button from './Button';

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

const EventCard = ({ event, className = '' }) => {
  const navigate = useNavigate();

  if (!event) return null;

  const {
    title,
    slug,
    category,
    date,
    location,
    venue: topVenue,
    city: topCity,
    price = 0,
    currency = 'USD',
    capacity = 0,
    registeredCount = 0,
    image,
  } = event;

  const venue = location?.venue || topVenue;
  const city = location?.city || topCity;

  const eventDate = date ? new Date(date) : null;
  const isEventPast = eventDate ? isPast(eventDate) : false;
  const isFull = capacity > 0 && registeredCount >= capacity;
  const spotsLeft = Math.max(0, capacity - registeredCount);
  const percentBooked = capacity > 0 ? Math.round((registeredCount / capacity) * 100) : 0;
  const isUrgent = !isEventPast && !isFull && spotsLeft > 0 && spotsLeft <= 15;

  const categoryKey = category?.toLowerCase();
  const categoryBadgeClass = CATEGORY_STYLES[categoryKey] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  const handleClick = (e) => {
    // If target is inside button, let button handle navigation
    if (slug) navigate(`/events/${slug}`);
  };

  return (
    <article
      onClick={handleClick}
      className={`group cursor-pointer rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 
                  overflow-hidden shadow-sm hover:shadow-xl hover:border-primary-400 dark:hover:border-primary-600 
                  transition-all duration-300 flex flex-col hover:-translate-y-1 ${className}`}
    >
      {/* 16:9 Standardized Visual Header */}
      <div className="relative">
        <EventImage
          src={image}
          alt={title}
          category={category}
          aspectRatio="aspect-video"
        />

        {/* Category Pill */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-lg border backdrop-blur-md shadow-xs ${categoryBadgeClass}`}>
            {category || 'Campus'}
          </span>
        </div>

        {/* Price Tag */}
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-900/85 text-white dark:bg-white/90 dark:text-slate-900 backdrop-blur-md shadow-sm">
            {price === 0 ? 'FREE' : formatCurrency(price, currency)}
          </span>
        </div>

        {/* Scarcity Urgency Badge (Coral) */}
        {isUrgent && (
          <div className="absolute bottom-3 left-3 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-coral-500 text-white shadow-md animate-pulse-subtle">
              <span>🔥</span>
              <span>Only {spotsLeft} {spotsLeft === 1 ? 'seat' : 'seats'} left</span>
            </span>
          </div>
        )}

        {/* Status Overlays for Full / Past */}
        {isFull && !isEventPast && (
          <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="px-3.5 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-full uppercase tracking-widest shadow-md">
              Sold Out
            </span>
          </div>
        )}

        {isEventPast && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="px-3.5 py-1.5 bg-slate-700 text-white text-xs font-bold rounded-full uppercase tracking-widest shadow-sm">
              Past Event
            </span>
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 mb-2.5 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {title}
        </h3>

        {/* Date & Time */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
          <svg className="w-4 h-4 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span>{eventDate ? format(eventDate, 'EEE, MMM d, yyyy') : 'Date TBA'}</span>
        </div>

        {/* Venue */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
          <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <span className="truncate">{[venue, city].filter(Boolean).join(' • ') || 'Campus Venue'}</span>
        </div>

        {/* Capacity Bar & Conversion Action */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {percentBooked}% booked
            </span>
            <span className={isFull ? 'text-rose-500 font-semibold' : isUrgent ? 'text-coral-500 font-semibold' : 'text-slate-500'}>
              {registeredCount} / {capacity}
            </span>
          </div>

          {/* Micro Progress Bar */}
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3.5">
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

          {/* Single High-Intent CTA */}
          <Button
            size="sm"
            variant={isFull || isEventPast ? 'secondary' : isUrgent ? 'accent' : 'primary'}
            className="w-full text-xs py-2"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/events/${slug}`);
            }}
          >
            {isEventPast ? 'View Summary' : isFull ? 'Event Full' : 'Register Now'}
          </Button>
        </div>
      </div>
    </article>
  );
};

export default EventCard;
