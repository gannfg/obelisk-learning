import { Suspense } from "react";
import { AcademyPageClient } from "@/components/academy-page";

export default function AcademyPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <p className="text-center text-muted-foreground">Loading academy...</p>
        </div>
      }
    >
      <AcademyPageClient />
    </Suspense>
  );
}


