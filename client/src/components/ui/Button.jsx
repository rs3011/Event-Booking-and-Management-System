import { forwardRef } from 'react';

/**
 * Button — Accessible, multi-variant design system button.
 * Semantic hierarchy:
 * - primary: Electric Violet -> Deep Indigo gradient (high-intent actions)
 * - accent: Coral (urgency, direct booking highlights)
 * - secondary: Clean slate border with smooth hover
 * - danger: Red for cancellations / rejections
 * - ghost: Minimal text with hover highlight
 */
const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  icon = null,
  iconPosition = 'left',
  className = '',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold shadow-sm',
    icon: 'p-2',
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-800 text-white shadow-md hover:shadow-primary-500/25 hover:brightness-110 focus-visible:ring-primary-500 dark:focus-visible:ring-offset-slate-900',
    accent: 'bg-gradient-to-r from-coral-500 to-coral-600 text-white shadow-md hover:shadow-coral-500/25 hover:brightness-110 focus-visible:ring-coral-500 dark:focus-visible:ring-offset-slate-900',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800 focus-visible:ring-slate-400',
    outline: 'bg-transparent text-primary-600 border-2 border-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:border-primary-500 dark:hover:bg-primary-950/40 focus-visible:ring-primary-500',
    ghost: 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 focus-visible:ring-slate-400',
    danger: 'bg-danger-600 text-white hover:bg-danger-700 shadow-sm focus-visible:ring-danger-500',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-0.5 w-4 h-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
