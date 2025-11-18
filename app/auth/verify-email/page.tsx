import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Check your email</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            We've sent a confirmation link to your email address. Please click
            the link to verify your account.
          </p>
        </div>
        <Button asChild>
          <Link href="/auth/sign-in">Back to Sign In</Link>
        </Button>
      </div>
    </div>
  );
}

