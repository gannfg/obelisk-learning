import { NextRequest, NextResponse } from "next/server";
import { createAuthServerClient, createLearningServerClient } from "@/lib/supabase/server";

// For MVP: This runs micro-checks (automated tests) for a mission
// In production, this would execute test code in the sandbox

export async function POST(request: NextRequest) {
  try {
    const authSupabase = await createAuthServerClient();
    const learningSupabase = await createLearningServerClient();
    const { data: { user } } = await authSupabase.auth.getUser();

    const body = await request.json();
    const { files, lessonId, missionId } = body;

    if (!missionId) {
      return NextResponse.json({ error: "missionId is required" }, { status: 400 });
    }

    // If user is not authenticated, return a friendly message instead of 401
    if (!user) {
      return NextResponse.json({
        results: [],
        message: "Sign in to run micro-checks for this mission.",
        success: false,
      });
    }

    // Fetch micro-checks for this mission
    const { data: microChecks, error: checksError } = await learningSupabase
      .from("micro_checks")
      .select("*")
      .eq("mission_id", missionId)
      .order("order_index");

    if (checksError) {
      console.error("Error fetching micro-checks:", checksError);
      return NextResponse.json({ error: "Failed to fetch micro-checks" }, { status: 500 });
    }

    if (!microChecks || microChecks.length === 0) {
      return NextResponse.json({
        results: [],
        message: "No micro-checks defined for this mission",
      });
    }

    // TODO: Execute test code in sandbox
    // For now, return mock results
    const results = microChecks.map((check) => {
      // Mock: Check if files contain expected patterns
      const fileContent = Object.values(files || {}).join("\n");
      const hasTestCode = fileContent.includes(check.test_code.substring(0, 20));
      
      return {
        id: check.id,
        name: check.name,
        passed: hasTestCode, // Mock logic
        message: hasTestCode ? "Test passed" : "Test failed: Expected code pattern not found",
      };
    });

    // Log results
    for (const result of results) {
      const check = microChecks.find((c) => c.id === result.id);
      if (check) {
        try {
          await learningSupabase.from("micro_check_results").upsert({
            user_id: user.id,
            micro_check_id: check.id,
            mission_id: missionId,
            passed: result.passed,
            output: result.message,
          }, {
            onConflict: "user_id,micro_check_id",
          });
        } catch (err) {
          console.error("Failed to log micro-check result:", err);
        }
      }
    }

    return NextResponse.json({
      results,
      success: true,
    });
  } catch (error) {
    console.error("Micro-check error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

