
/**
 * EventViserLogo — Official Brand Logo & Wordmark component for EventViser.
 * Features a modern geometric aperture & ticket monogram with dual-tone gradient typography.
 */
const EventViserLogo = ({
  size = 'md',
  showText = true,
  className = '',
  badge = null,
}) => {
  // Dimensions for the icon based on size
  const sizeMap = {
    sm: { icon: 'w-6 h-6', text: 'text-lg', badge: 'text-[9px] px-1 py-0.2' },
    md: { icon: 'w-8 h-8', text: 'text-xl', badge: 'text-[10px] px-1.5 py-0.5' },
    lg: { icon: 'w-10 h-10', text: 'text-2xl', badge: 'text-xs px-2 py-0.5' },
    xl: { icon: 'w-12 h-12', text: 'text-3xl', badge: 'text-xs px-2 py-1' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2.5 font-sans select-none ${className}`}>
      {/* Brand Icon Mark */}
      <div className={`relative shrink-0 ${currentSize.icon} flex items-center justify-center transition-transform hover:scale-105 duration-200`}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <defs>
            <linearGradient id="eventviser-brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="50%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
            <linearGradient id="eventviser-glow" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Squircle Badge Base */}
          <rect
            x="2"
            y="2"
            width="36"
            height="36"
            rx="10"
            fill="url(#eventviser-brand-grad)"
          />
          {/* Subtle Inner Highlight */}
          <rect
            x="3"
            y="3"
            width="34"
            height="18"
            rx="9"
            fill="url(#eventviser-glow)"
          />

          {/* Dynamic "V" Visor + Ticket Notch Geometry */}
          <path
            d="M12 12.5L20 28L28 12.5H23.5L20 20.5L16.5 12.5H12Z"
            fill="#ffffff"
          />
          {/* Beacon / Focal Aperture Dot */}
          <circle cx="20" cy="11.5" r="2.2" fill="#ffffff" />
          
          {/* Decorative Edge Ticket Notches */}
          <path
            d="M2 17C3.65685 17 5 18.3431 5 20C5 21.6569 3.65685 23 2 23V17Z"
            fill="#ffffff"
            fillOpacity="0.3"
          />
          <path
            d="M38 17C36.3431 17 35 18.3431 35 20C35 21.6569 36.3431 23 38 23V17Z"
            fill="#ffffff"
            fillOpacity="0.3"
          />
        </svg>
      </div>

      {/* Brand Text Wordmark */}
      {showText && (
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-tight text-gray-900 dark:text-white ${currentSize.text}`}>
            Event
            <span className="bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 dark:from-primary-400 dark:via-indigo-400 dark:to-purple-300 bg-clip-text text-transparent">
              Viser
            </span>
          </span>
          {badge && (
            <span
              className={`font-bold uppercase tracking-wider rounded-md border ${currentSize.badge} bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-950/60 dark:text-primary-300 dark:border-primary-800`}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default EventViserLogo;
