import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function MentorPage() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-12 sm:py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <Button asChild variant="ghost" className="mb-8">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        <div className="text-center mb-12">
          <div className="relative w-64 h-64 mx-auto mb-8 overflow-hidden rounded-2xl border-2 border-border bg-muted/20 shadow-lg">
            <div className="absolute inset-0 animate-dementor-float">
              <Image
                src="/dementor_avatar.png"
                alt="DeMentor"
                fill
                className="object-cover object-top"
                priority
                unoptimized
              />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            DeMentor
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Your AI-powered mentor for this coding academy. This page is a
            placeholder where we can later add guidance, tips, and interactive
            mentor features.
          </p>
        </div>
      </div>
    </div>
  );
}






