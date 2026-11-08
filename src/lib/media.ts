/**
 * Media and communication utility helpers
 */

/**
 * Robust YouTube video ID parser
 * Handles raw URLs (watch?v=, embed/, youtu.be/, shorts/, youtube-nocookie) and full <iframe> embed snippets.
 */
export function parseYouTubeVideoId(input?: unknown): string | null {
  if (typeof input !== 'string' || !input.trim()) return null;
  const raw = input.trim();
  
  // 1. If user pasted a full <iframe> tag, extract src first
  let url = raw;
  const iframeSrcMatch = raw.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    url = iframeSrcMatch[1];
  }

  // 2. Extract standard 11-character YouTube video ID
  const regExp = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i;
  const match = url.match(regExp);
  if (match && match[1]) {
    return match[1];
  }

  // Also catch generic ?v=xxx or &v=xxx in youtube domains
  const vParamMatch = url.match(/[?&]v=([\w-]{11})/i);
  if (vParamMatch && vParamMatch[1]) {
    return vParamMatch[1];
  }

  // 3. If user pasted the raw 11-char ID directly
  if (/^[\w-]{11}$/.test(url)) {
    return url;
  }

  return null;
}

/**
 * Formats a phone number for direct WhatsApp wa.me link.
 * Normalizes Indonesian numbers (08... -> 628..., +62... -> 62...).
 */
export function formatWhatsAppUrl(phone?: unknown): string {
  if (typeof phone !== 'string' || !phone.trim()) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    return `https://wa.me/62${digits.slice(1)}`;
  }
  if (digits.startsWith('62')) {
    return `https://wa.me/${digits}`;
  }
  if (digits.startsWith('8')) {
    return `https://wa.me/62${digits}`;
  }
  return `https://wa.me/${digits}`;
}

/**
 * Ensures an external web link has http:// or https:// protocol.
 */
export function ensureAbsoluteUrl(url?: unknown): string {
  if (typeof url !== 'string' || !url.trim()) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Validates and sanitizes HTTP/HTTPS URLs (F-07).
 * Prevents javascript:, data:, and vbscript: XSS injection vectors.
 */
export function safeHttpUrl(url: string | null | undefined, allowedHosts?: string[]): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Tolak tegas skema non-HTTP berbahaya (XSS vectors)
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:')
  ) {
    return null;
  }

  try {
    const fullUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://') 
      ? trimmed 
      : `https://${trimmed}`;
    const parsed = new URL(fullUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    if (allowedHosts && allowedHosts.length > 0) {
      const isAllowed = allowedHosts.some(host => 
        parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
      );
      if (!isAllowed) return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}
