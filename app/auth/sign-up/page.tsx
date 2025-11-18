import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Start your learning journey with Obelisk Learning
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}

