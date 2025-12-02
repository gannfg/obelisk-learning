"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { getUserProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      if (authLoading) return;
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(user.id, user.email || undefined, supabase);
        // Fallback: treat configured email as admin even if profile missing flag
        const isEmailAdmin = user.email === "gany.wicaksono@gmail.com";
        setIsAdmin(Boolean(profile?.is_admin) || isEmailAdmin);
      } catch (err) {
        console.error("Error checking admin status:", err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, authLoading, supabase]);

  return { isAdmin, loading };
}


