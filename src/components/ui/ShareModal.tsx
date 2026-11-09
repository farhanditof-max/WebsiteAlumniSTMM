'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Copy, Check, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  shareUrl: string;
  subtitle?: string;
  description?: string;
}

export function ShareModal({
  isOpen,
  onClose,
  title,
  shareUrl,
  subtitle,
  description = 'Bagikan profil alumni ini ke rekan kerja, recruiter, atau media sosial:',
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareText = encodeURIComponent(`${title} - ${subtitle || 'Dashboard Alumni STMM MMTC Yogyakarta'}`);
  const encodedUrl = encodeURIComponent(shareUrl);

  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}%0A${encodedUrl}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: subtitle || title,
          url: shareUrl,
        });
      } catch {
        // User cancelled share
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bagikan Profil Alumni" maxWidth="md">
      <div className="space-y-5">
        <div>
          <h4 className="text-base font-bold text-slate-900">{title}</h4>
          {subtitle && <p className="text-xs text-[#0284c7] font-medium mt-0.5">{subtitle}</p>}
          <p className="text-xs text-slate-500 mt-2">{description}</p>
        </div>

        {/* COPY LINK BOX */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700">Tautan Langsung</label>
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-50 border border-slate-200">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent px-2.5 py-1 text-xs text-slate-700 font-mono outline-hidden truncate"
            />
            <button
              onClick={handleCopy}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-2xs'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* SOCIAL CHANNELS */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-700 block">Bagikan Melalui Platform</label>
          <div className="grid grid-cols-2 gap-2.5">
            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-800 transition group"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 leading-tight">WhatsApp</p>
                <p className="text-[10px] text-slate-500">Kirim ke chat</p>
              </div>
            </a>

            {/* LinkedIn */}
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-100 text-sky-800 transition group"
            >
              <div className="w-7 h-7 rounded-full bg-[#0077b5] text-white flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 group-hover:text-sky-900 leading-tight">LinkedIn</p>
                <p className="text-[10px] text-slate-500">Posting ke feed</p>
              </div>
            </a>

            {/* Twitter / X */}
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition group"
            >
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 group-hover:text-slate-900 leading-tight">X (Twitter)</p>
                <p className="text-[10px] text-slate-500">Bagikan tweet</p>
              </div>
            </a>

            {/* Native Share fallback or direct trigger */}
            {typeof window !== 'undefined' && typeof navigator.share === 'function' ? (
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition group cursor-pointer text-left"
              >
                <div className="w-7 h-7 rounded-full bg-[#0284c7] text-white flex items-center justify-center shrink-0">
                  <Share2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800 group-hover:text-[#0284c7] leading-tight">Lainnya...</p>
                  <p className="text-[10px] text-slate-500">Menu share sistem</p>
                </div>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}
