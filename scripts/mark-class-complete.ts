/**
 * Script to mark a user as having completed all modules in a class
 * Usage: npx tsx scripts/mark-class-complete.ts <email> <classTitle>
 */

import { createLearningClient } from "../lib/supabase/learning-client";
import { createClient } from "../lib/supabase/client";
import { getAllClasses, getClassModules } from "../lib/classes";
import { markWeekAttendance } from "../lib/classroom";

async function markClassComplete(email: string, classTitle: string) {
  console.log(`Marking ${email} as complete for class: ${classTitle}`);

  // Get Supabase clients
  const learningSupabase = createLearningClient();
  const authSupabase = createClient();

  if (!learningSupabase || !authSupabase) {
    console.error("Failed to initialize Supabase clients");
    process.exit(1);
  }

  try {
    // 1. Find user by email in users table
    const { data: userData, error: userError } = await authSupabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();
    
    if (userError || !userData) {
      console.error(`User not found: ${email}`, userError);
      process.exit(1);
    }

    console.log(`Found user: ${userData.id} (${userData.email})`);
    const userId = userData.id;

    // 2. Find class by title
    const allClasses = await getAllClasses({}, learningSupabase);
    const targetClass = allClasses.find(
      (c) => c.title.toLowerCase().includes(classTitle.toLowerCase())
    );

    if (!targetClass) {
      console.error(`Class not found: ${classTitle}`);
      console.log("Available classes:", allClasses.map((c) => c.title).join(", "));
      process.exit(1);
    }

    console.log(`Found class: ${targetClass.id} - ${targetClass.title}`);

    // 3. Get all modules for the class
    const modules = await getClassModules(targetClass.id, learningSupabase);
    console.log(`Found ${modules.length} modules`);

    if (modules.length === 0) {
      console.error("No modules found for this class");
      process.exit(1);
    }

    // 4. Mark attendance for all weeks
    console.log("\nMarking attendance for all modules...");
    for (const module of modules) {
      const attendance = await markWeekAttendance(
        targetClass.id,
        userId,
        module.weekNumber,
        "manual",
        userId,
        learningSupabase
      );

      if (attendance) {
        console.log(`✓ Week ${module.weekNumber}: ${module.title}`);
      } else {
        console.log(`✗ Failed to mark attendance for Week ${module.weekNumber}`);
      }
    }

    console.log("\n✅ Class completion marked successfully!");
    console.log("Badges should be awarded automatically if configured.");

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Get command line arguments
const email = process.argv[2];
const classTitle = process.argv[3];

if (!email || !classTitle) {
  console.error("Usage: npx tsx scripts/mark-class-complete.ts <email> <classTitle>");
  console.error('Example: npx tsx scripts/mark-class-complete.ts "gany.wicaksono@gmail.com" "Gamejam!"');
  process.exit(1);
}

markClassComplete(email, classTitle);
