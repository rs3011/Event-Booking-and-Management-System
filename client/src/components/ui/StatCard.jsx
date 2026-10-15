/**
 * StatCard — Executive SaaS metric display card.
 * Features:
 * - High-contrast metric typography
 * - Semantic icon badge
 * - Optional progress or trend subtitle
 */
const StatCard = ({
  label,
  value,
  icon,
  trend = null,
  trendType = 'neutral', // 'positive' | 'negative' | 'neutral'
  colorScheme = 'primary', // 'primary' | 'emerald' | 'amber' | 'coral' | 'purple'
  subtitle = null,
  progress = null,
  className = '',
}) => {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400 border-primary-100 dark:border-primary-900',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900',
    coral: 'bg-coral-50 text-coral-600 dark:bg-coral-950/50 dark:text-coral-400 border-coral-100 dark:border-coral-900',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-100 dark:border-purple-900',
  };

  const trendColors = {
    positive: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
    negative: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40',
    neutral: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
  };

  return (
    <div className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="flex items-center justify-between gap-4 mb-3">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-tight">
          {label}
        </span>
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${colorMap[colorScheme] || colorMap.primary}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {value}
        </span>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trendColors[trendType] || trendColors.neutral}`}>
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}

      {progress !== null && (
        <div className="mt-3">
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress >= 90
                  ? 'bg-rose-500'
                  : progress >= 75
                  ? 'bg-coral-500'
                  : 'bg-primary-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StatCard;
