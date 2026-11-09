'use client';

import React from 'react';
import { CheckCircle2, Clock, Eye, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected' | string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'accepted':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 font-semibold ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Diterima</span>
        </span>
      );
    case 'rejected':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200/80 text-red-700 font-semibold ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 text-red-500" />
          <span>Ditolak</span>
        </span>
      );
    case 'reviewed':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 font-semibold ${sizeClasses}`}>
          <Eye className="w-3.5 h-3.5 text-amber-600" />
          <span>Sedang Ditinjau</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200/80 text-[#0284c7] font-semibold ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-[#0284c7]" />
          <span>Menunggu Respon</span>
        </span>
      );
  }
}

export function OpenToWorkBadge({ pulse = true }: { pulse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-700 text-[11px] font-semibold whitespace-nowrap shadow-2xs">
      <span className={`w-2 h-2 rounded-full bg-emerald-500 ${pulse ? 'animate-pulse' : ''}`} />
      <span>Open to Work</span>
    </span>
  );
}

export function ProdiBadge({ prodi }: { prodi: string }) {
  return (
    <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
      {prodi}
    </span>
  );
}
