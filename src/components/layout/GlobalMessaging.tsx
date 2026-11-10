'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import LinkedInMessagingWidget from '@/components/feed/LinkedInMessagingWidget';

export default function GlobalMessaging() {
  const { user } = useAuth();
  if (!user) return null;
  return <LinkedInMessagingWidget />;
}
