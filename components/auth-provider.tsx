"use client";

import { useEffect } from 'react';
import { initializeAuthClient } from '@/lib/auth/client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize auth client on mount
    initializeAuthClient();
  }, []);

  return <>{children}</>;
}

