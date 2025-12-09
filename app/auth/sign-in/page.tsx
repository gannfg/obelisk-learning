import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-3 sm:px-4 md:px-6 py-8 sm:py-10 md:py-12 pb-20 md:pb-12">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">Sign In</h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Sign in to your Superteam Study account
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}

