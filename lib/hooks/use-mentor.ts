"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { createLearningClient } from "@/lib/supabase/learning-client";

export function useMentor() {
  const { user, loading: authLoading } = useAuth();
  const [isMentor, setIsMentor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (authLoading) return;
      if (!user) {
        setIsMentor(false);
        setLoading(false);
        return;
      }

      const supabase = createLearningClient();
      if (!supabase) {
        setIsMentor(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .select("is_mentor")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error checking mentor status:", error);
          setIsMentor(false);
        } else {
          setIsMentor(Boolean(data?.is_mentor));
        }
      } catch (err) {
        console.error("Error checking mentor status:", err);
        setIsMentor(false);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, authLoading]);

  return { isMentor, loading };
}

