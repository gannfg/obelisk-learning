import { Suspense } from "react";
import { AcademyPageClient } from "@/components/academy-page";

interface AcademyPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AcademyPage({ searchParams }: AcademyPageProps) {
  // Await searchParams to prevent Next.js error about accessing Promise directly
  await searchParams;
  
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


