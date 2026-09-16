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
  const [errorSrc, setErrorSrc] = useState<string | null>(null);

  const initial = (name || 'A').trim().charAt(0).toUpperCase() || 'A';
  const hasError = Boolean(src && errorSrc === src);

  if (src && !hasError) {
    return (
      <img
        key={src}
        src={src}
        alt={name || 'Foto Alumni'}
        className={className}
        onError={() => setErrorSrc(src)}
      />
    );
  }

  return <span>{initial}</span>;
}
