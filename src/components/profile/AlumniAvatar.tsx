'use client';

import React, { useState } from 'react';

interface AlumniAvatarProps {
  src?: string;
  name?: string;
  className?: string;
}

export default function AlumniAvatar({ 
  src, 
  name, 
  className = 'w-full h-full object-cover' 
}: AlumniAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const trimmed = src?.trim();
  const effectiveSrc = (trimmed && trimmed !== failedSrc) ? trimmed : '/default_avatar.png';

  return (
    <img
      src={effectiveSrc}
      alt={name || 'Foto Alumni'}
      className={className}
      onError={() => {
        if (effectiveSrc !== '/default_avatar.png') {
          setFailedSrc(effectiveSrc);
        }
      }}
    />
  );
}
