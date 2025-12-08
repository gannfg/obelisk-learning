"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Validate Supabase configuration
  const getSupabaseClient = () => {
    try {
      return createClient();
    } catch (err: any) {
      setError(
        "Supabase is not configured. Please set up your environment variables:\n\n" +
        "NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL\n" +
        "NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY\n\n" +
        "See ENV_SETUP.md for instructions."
      );
      throw err;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError(
          "Supabase is not configured. Please set NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL and NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY."
        );
        setLoading(false);
        return;
      }
      
      // Try signup with minimal options first
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        console.error("Signup error details:", {
          message: signUpError.message,
          status: signUpError.status,
          name: signUpError.name,
          cause: signUpError.cause,
          error: signUpError,
        });
        
        // Provide more helpful error messages
        let errorMessage = signUpError.message || "Failed to create account";
        
        if (signUpError.status === 500) {
          errorMessage = "Server error during signup. This usually means:\n\n" +
            "1. Supabase Auth Email provider is not enabled\n" +
            "2. Database schema is not set up (run supabase/auth-schema.sql)\n" +
            "3. Redirect URL not configured in Supabase\n" +
            "4. Environment variables are incorrect\n\n" +
            "Please check your Supabase Auth configuration. See the console for details.";
        } else if (signUpError.status === 400) {
          // Bad request - usually configuration issues
          if (signUpError.message?.includes("Invalid API key") || signUpError.message?.includes("JWT")) {
            errorMessage = "Invalid Supabase configuration. Please check your environment variables (NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL and NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY).";
          } else {
            errorMessage = signUpError.message || "Invalid request. Please check your input and try again.";
          }
        } else if (signUpError.message?.includes("email")) {
          errorMessage = signUpError.message;
        } else if (signUpError.message?.includes("already registered") || signUpError.message?.includes("already exists")) {
          errorMessage = "An account with this email already exists. Please sign in instead.";
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Create user profile in public.users table
        try {
          const { error: profileError } = await supabase
            .from("users")
            .upsert({
              id: data.user.id,
              email: data.user.email || email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "id"
            });

          if (profileError) {
            console.error("Profile creation error:", profileError);
            // Don't fail signup if profile creation fails - user can still sign in
          }
        } catch (profileErr) {
          console.error("Profile creation exception:", profileErr);
          // Don't fail signup if profile creation fails
        }

        // Check if email confirmation is required
        if (data.user.email_confirmed_at) {
          // Email already confirmed, redirect to dashboard
          router.push("/dashboard");
          router.refresh();
        } else {
          // Email confirmation required
          setError("Please check your email to verify your account before signing in.");
          setLoading(false);
        }
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200 whitespace-pre-line">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          minLength={6}
        />
        <p className="text-xs text-zinc-500">
          Must be at least 6 characters
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm Password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
          minLength={6}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/auth/sign-in"
          className="font-medium text-foreground hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

