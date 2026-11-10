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
  const [hasError, setHasError] = useState(false);

  const effectiveSrc = (src && !hasError) ? src : '/default_avatar.png';

  return (
    <img
      key={effectiveSrc}
      src={effectiveSrc}
      alt={name || 'Foto Alumni'}
      className={className}
      onError={(e) => {
        if (!hasError && src) {
          setHasError(true);
        } else {
          (e.target as HTMLElement).style.display = 'none';
        }
      }}
    />
  );
}
