import { Suspense } from "react";
import { AcademyPageClient } from "@/components/academy-page";

export default function AcademyPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <p className="text-center text-muted-foreground">Loading academy...</p>
        </div>
      }
    >
      <AcademyPageClient />
    </Suspense>
  );
}


