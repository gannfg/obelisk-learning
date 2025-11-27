import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-3 sm:px-4 md:px-6 py-8 sm:py-10 md:py-12 pb-20 md:pb-12">
      <div className="w-full max-w-md space-y-6 sm:space-y-8 text-center">
        <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <Mail className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Check your email</h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 px-3">
            We've sent a confirmation link to your email address. Please click
            the link to verify your account.
          </p>
        </div>
        <Button asChild className="text-xs sm:text-sm h-8 sm:h-9 md:h-10">
          <Link href="/auth/sign-in">Back to Sign In</Link>
        </Button>
      </div>
    </div>
  );
}

