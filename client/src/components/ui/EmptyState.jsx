import { Link } from 'react-router-dom';
import Button from './Button';

const VARIANTS = {
  noEvents: {
    icon: (
      <svg className="w-12 h-12 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    title: 'No events found yet',
    description: 'There are no published campus events matching your criteria right now. Check back soon or be the first to host one!',
    actionLabel: 'Browse All Events',
    actionLink: '/events',
  },
  noTickets: {
    icon: (
      <svg className="w-12 h-12 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
      </svg>
    ),
    title: 'Your ticket wallet is empty',
    description: "You haven't registered for any campus events yet. Explore upcoming hackathons, tech talks, and cultural fests!",
    actionLabel: 'Explore Campus Events',
    actionLink: '/events',
  },
  noAttendees: {
    icon: (
      <svg className="w-12 h-12 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: 'No registrations recorded yet',
    description: 'Share your event link with student groups to kickstart registrations and fill your venue.',
    actionLabel: 'Copy Event Link',
    actionLink: null,
  },
  noResults: {
    icon: (
      <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    title: 'No matching results',
    description: "We couldn't find events matching your search filters. Try clearing your filters or searching with different keywords.",
    actionLabel: 'Reset Filters',
    actionLink: null,
  },
};

const EmptyState = ({
  variant,
  icon,
  title,
  description,
  actionLabel,
  actionLink,
  onAction,
  className = '',
}) => {
  const preset = variant ? VARIANTS[variant] : {};
  const resolvedIcon = icon || preset.icon;
  const resolvedTitle = title || preset.title || 'Nothing here yet';
  const resolvedDescription = description || preset.description || '';
  const resolvedActionLabel = actionLabel || preset.actionLabel;
  const resolvedActionLink = actionLink !== undefined ? actionLink : preset.actionLink;

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center rounded-3xl bg-white/50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 ${className}`}>
      {resolvedIcon && (
        <div className="w-20 h-20 rounded-3xl bg-primary-50/80 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/50 flex items-center justify-center mb-5 shadow-xs">
          {resolvedIcon}
        </div>
      )}

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
        {resolvedTitle}
      </h3>

      {resolvedDescription && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
          {resolvedDescription}
        </p>
      )}

      {resolvedActionLabel && resolvedActionLink && (
        <Link to={resolvedActionLink}>
          <Button variant="primary" size="md">
            {resolvedActionLabel}
          </Button>
        </Link>
      )}

      {resolvedActionLabel && !resolvedActionLink && onAction && (
        <Button variant="secondary" size="md" onClick={onAction}>
          {resolvedActionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
