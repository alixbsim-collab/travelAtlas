import React from 'react';

function SkeletonActivityCard() {
  return (
    <div className="border-l-4 border-neutral-200 rounded-lg p-4 shadow-sm mb-3 animate-pulse bg-white">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-neutral-200 rounded mt-1 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-neutral-200 rounded" />
            <div className="h-4 bg-neutral-200 rounded w-2/3" />
          </div>
          <div className="h-3 bg-neutral-100 rounded w-full mb-3" />
          <div className="flex gap-4">
            <div className="h-3 bg-neutral-100 rounded w-24" />
            <div className="h-3 bg-neutral-100 rounded w-16" />
            <div className="h-3 bg-neutral-100 rounded w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(SkeletonActivityCard);
