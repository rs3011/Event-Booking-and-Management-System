const SkeletonCard = () => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col shimmer-mask">
      {/* 16:9 Image placeholder */}
      <div className="aspect-video w-full bg-slate-200 dark:bg-slate-800" />

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4 mb-3" />

        {/* Date line */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded shrink-0" />
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
        </div>

        {/* Location line */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded shrink-0" />
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
        </div>

        {/* Capacity bar & CTA placeholder */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-12" />
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-3" />
          <div className="w-full h-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
