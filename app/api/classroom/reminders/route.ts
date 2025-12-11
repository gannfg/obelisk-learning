import { NextRequest, NextResponse } from "next/server";
import { createLearningServerClient, createAuthServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/server";
import { 
  notifyWeeklyReminder, 
  notifyAssignmentReminder 
} from "@/lib/classroom-notifications";
import { getClassById, getClassModules } from "@/lib/classes";
import { getClassAssignments } from "@/lib/classroom";

/**
 * API endpoint to trigger scheduled reminders
 * This should be called by a cron job or scheduled task
 * 
 * POST /api/classroom/reminders
 * Body: { type: "weekly" | "assignments" }
 * 
 * Optional: Add Authorization header with service key for cron jobs
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Check for service key in header for cron jobs
    const authHeader = request.headers.get("authorization");
    const serviceKey = process.env.CRON_SECRET_KEY;
    
    // If service key is set, require it for authentication
    if (serviceKey && authHeader !== `Bearer ${serviceKey}`) {
      // Fallback to user auth if no service key
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();
    const { type } = body;

    if (!type || !["weekly", "assignments"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'weekly' or 'assignments'" },
        { status: 400 }
      );
    }

    const learningSupabase = await createLearningServerClient();
    const authSupabase = await createAuthServerClient();
    let remindersSent = 0;

    if (type === "weekly") {
      // Get upcoming modules
      const { data: modules, error } = await learningSupabase.rpc(
        "get_upcoming_modules_for_reminders"
      );

      if (error) {
        console.error("Error fetching upcoming modules:", error);
        return NextResponse.json(
          { error: "Failed to fetch upcoming modules" },
          { status: 500 }
        );
      }

      // Send notifications for each module
      for (const module of modules || []) {
        const classItem = await getClassById(module.class_id, learningSupabase);
        if (classItem) {
          const count = await notifyWeeklyReminder(
            module.class_id,
            module.class_title || classItem.title,
            module.module_title,
            module.week_number,
            new Date(module.start_date),
            learningSupabase,
            authSupabase
          );
          remindersSent += count;
        }
      }

      return NextResponse.json({
        success: true,
        remindersSent,
      });
    }

    if (type === "assignments") {
      // Get upcoming assignments
      const { data: assignments, error } = await learningSupabase.rpc(
        "get_upcoming_assignments_for_reminders"
      );

      if (error) {
        console.error("Error fetching upcoming assignments:", error);
        return NextResponse.json(
          { error: "Failed to fetch upcoming assignments" },
          { status: 500 }
        );
      }

      // Send notifications for each assignment
      for (const assignment of assignments || []) {
        const success = await notifyAssignmentReminder(
          assignment.user_id,
          assignment.class_id,
          assignment.assignment_title,
          new Date(assignment.due_date),
          assignment.hours_until_due,
          authSupabase
        );
        if (success) {
          remindersSent++;
        }
      }

      return NextResponse.json({
        success: true,
        remindersSent,
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Error in reminders endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

