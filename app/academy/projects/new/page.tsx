import { Suspense } from "react";
import { NewProjectPageClient } from "@/components/new-project-page";

interface NewProjectPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function NewProjectPage({ searchParams }: NewProjectPageProps) {
  const teamParam = searchParams?.teamId;
  const initialTeamId =
    typeof teamParam === "string"
      ? teamParam
      : Array.isArray(teamParam)
      ? teamParam[0]
      : undefined;

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <p className="text-center text-muted-foreground">
            Loading project creator...
          </p>
        </div>
      }
    >
      <NewProjectPageClient initialTeamId={initialTeamId} />
    </Suspense>
  );
}

