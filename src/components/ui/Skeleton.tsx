'use client';

import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-lg ${className}`}
      aria-hidden="true"
    />
  );
}

export function TalentCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
      <div className="space-y-4">
        {/* Top: Avatar & Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <Skeleton className="w-14 h-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="w-32 h-4" />
              <Skeleton className="w-24 h-3" />
            </div>
          </div>
          <Skeleton className="w-20 h-5 rounded-full" />
        </div>

        {/* Bio */}
        <div className="space-y-2 pt-1">
          <Skeleton className="w-full h-3" />
          <Skeleton className="w-4/5 h-3" />
        </div>

        {/* Portfolio Tags */}
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="w-24 h-3.5 rounded" />
          <Skeleton className="w-16 h-3.5 rounded" />
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <Skeleton className="w-20 h-3" />
        <Skeleton className="w-28 h-8 rounded-xl" />
      </div>
    </div>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="w-20 h-5 rounded-md" />
          <Skeleton className="w-24 h-4" />
        </div>
        <Skeleton className="w-3/4 h-5" />
        <Skeleton className="w-1/2 h-3.5" />
        <div className="space-y-1.5 pt-1">
          <Skeleton className="w-full h-3" />
          <Skeleton className="w-5/6 h-3" />
        </div>
      </div>
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex gap-1.5">
          <Skeleton className="w-14 h-4 rounded" />
          <Skeleton className="w-14 h-4 rounded" />
        </div>
        <Skeleton className="w-24 h-6 rounded-lg" />
      </div>
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs animate-pulse">
      <div className="flex items-center gap-5">
        <Skeleton className="w-20 h-20 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="w-48 h-6" />
          <Skeleton className="w-36 h-4" />
          <Skeleton className="w-28 h-3" />
        </div>
      </div>
      <Skeleton className="w-32 h-8 rounded-full" />
    </div>
  );
}
