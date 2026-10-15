import { useState } from 'react';

const CATEGORY_GRADIENTS = {
  conference: 'from-blue-600 via-indigo-700 to-slate-900',
  workshop: 'from-primary-600 via-purple-700 to-indigo-900',
  seminar: 'from-emerald-600 via-teal-700 to-slate-900',
  meetup: 'from-amber-500 via-orange-600 to-slate-900',
  concert: 'from-pink-600 via-rose-700 to-purple-950',
  sports: 'from-coral-500 via-red-600 to-slate-900',
  networking: 'from-cyan-600 via-blue-700 to-indigo-950',
  webinar: 'from-violet-600 via-indigo-700 to-slate-900',
  default: 'from-primary-700 via-indigo-800 to-slate-950',
};

/**
 * EventImage — Standardized 16:9 event visual with automatic fallbacks and subtle hover animations.
 * Eliminates irregular card heights and broken images.
 */
const EventImage = ({
  src,
  alt = 'Event banner',
  category = 'default',
  className = '',
  imgClassName = '',
  aspectRatio = 'aspect-video',
  priority = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const normalizedCategory = category?.toLowerCase();
  const gradient = CATEGORY_GRADIENTS[normalizedCategory] || CATEGORY_GRADIENTS.default;

  return (
    <div className={`relative overflow-hidden w-full ${aspectRatio} bg-slate-900 ${className}`}>
      {src && !hasError ? (
        <>
          {!isLoaded && (
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} shimmer-mask opacity-80`} />
          )}
          <img
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } ${imgClassName}`}
          />
        </>
      ) : (
        <div className={`w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br ${gradient} text-white select-none`}>
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 mb-2 shadow-inner">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <span className="text-xs uppercase font-bold tracking-wider text-white/90">
            {category || 'Campus Event'}
          </span>
        </div>
      )}
    </div>
  );
};

export default EventImage;
