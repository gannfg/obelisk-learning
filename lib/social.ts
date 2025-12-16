import { Instructor } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { mockInstructors } from "@/lib/mock-data";

/**
 * Unified type for users and mentors in the social page
 */
export type SocialUserType = "user" | "mentor" | "ai-mentor";

export type SocialUser = {
  id: string;
  name: string;
  username?: string | null;
  avatar?: string | null;
  bio?: string | null;
  type: SocialUserType;
  // For mentors: specializations, for users: skills/interests
  skills?: string[];
  specializations?: string[];
  // Collaboration status
  lookingForCollaborators?: boolean;
  availability?: "available" | "busy" | "away";
  // Social links (from instructors)
  socials?: {
    twitter?: string;
    website?: string;
    github?: string;
    linkedin?: string;
  };
  // Metadata
  email?: string;
  createdAt?: string;
  // User stats
  level?: number;
  xp?: number;
  teams?: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  // Profile fields
  location?: string;
  languages?: string[];
};

/**
 * Search and filter options for social users
 */
export type SocialUserFilter = {
  search?: string; // Search by name, username, bio
  type?: SocialUserType | SocialUserType[]; // Filter by type
  skills?: string[]; // Filter by skills/interests
  lookingForCollaborators?: boolean; // Only show users looking for collaborators
  availability?: ("available" | "busy" | "away")[]; // Filter by availability
};

/**
 * Fetch all users from the auth Supabase
 */
export async function getAllUsers(supabaseClient?: any): Promise<SocialUser[]> {
  const supabase = supabaseClient || createClient();
  
  if (!supabase) {
    console.warn("Supabase client not available");
    return [];
  }

  try {
    // Fetch users with their collaboration status
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select(`
        *,
        collaboration_status:user_collaboration_status(*)
      `)
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return [];
    }

    if (!usersData) {
      return [];
    }

    // Import getLevel for calculating user levels
    const { getLevel } = await import("@/lib/progress");

    return usersData.map((user: any) => {
      const collaborationStatus = user.collaboration_status;
      const fullName = [user.first_name, user.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();
      
      const xp = (user.xp as number) || 0;
      const level = xp > 0 ? getLevel(xp) : undefined;

      return {
        id: user.id,
        name: fullName || user.username || user.email?.split("@")[0] || "User",
        username: user.username,
        avatar: user.image_url,
        bio: user.bio,
        type: "user" as SocialUserType,
        skills: collaborationStatus?.collaboration_interests || [],
        lookingForCollaborators: collaborationStatus?.looking_for_collaborators || false,
        availability: (collaborationStatus?.availability_status as "available" | "busy" | "away") || "available",
        email: user.email,
        createdAt: user.created_at,
        xp: xp > 0 ? xp : undefined,
        level,
        // Teams will be fetched separately and merged
        teams: undefined,
        // Add location and languages from user profile
        location: (user as any).location || undefined,
        languages: (user as any).languages || undefined,
      } as SocialUser;
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    return [];
  }
}

/**
 * Fetch all instructors from the learning Supabase
 */
export async function getInstructorsFromDB(supabaseClient?: any): Promise<SocialUser[]> {
  const supabase = supabaseClient || createLearningClient();
  
  if (!supabase) {
    console.warn("Learning Supabase client not available");
    return [];
  }

  try {
    const { data: instructorsData, error } = await supabase
      .from("instructors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching instructors:", error);
      return [];
    }

    if (!instructorsData) {
      return [];
    }

    return instructorsData.map((instructor: any) => ({
      id: instructor.id,
      name: instructor.name,
      avatar: instructor.avatar,
      bio: instructor.bio,
      type: "mentor" as SocialUserType,
      specializations: instructor.specializations || [],
      socials: instructor.socials || {},
    }));
  } catch (error) {
    console.error("Error in getInstructorsFromDB:", error);
    return [];
  }
}

/**
 * Get mock instructors (including AI mentor like DeMentor)
 */
export function getMockInstructors(): SocialUser[] {
  return mockInstructors.map((instructor) => ({
    id: instructor.id,
    name: instructor.name,
    avatar: instructor.avatar,
    bio: instructor.bio,
    type: instructor.id === "ai-instructor-1" ? ("ai-mentor" as SocialUserType) : ("mentor" as SocialUserType),
    specializations: instructor.specializations || [],
    socials: instructor.socials || {},
  }));
}

/**
 * Merge users and instructors into a unified SocialUser list
 */
export async function mergeUsersAndMentors(options?: {
  authSupabase?: any;
  learningSupabase?: any;
  includeMockInstructors?: boolean;
}): Promise<SocialUser[]> {
  const {
    authSupabase,
    learningSupabase,
    includeMockInstructors = true,
  } = options || {};

  try {
    // Fetch in parallel
    const [users, dbInstructors] = await Promise.all([
      getAllUsers(authSupabase),
      getInstructorsFromDB(learningSupabase),
    ]);

    // Fetch teams for all users if learning Supabase is available
    if (learningSupabase && users.length > 0) {
      try {
        const userIds = users.map(u => u.id);
        const { data: teamMembersData } = await learningSupabase
          .from("team_members")
          .select(`
            user_id,
            teams(id, name, avatar)
          `)
          .in("user_id", userIds);

        // Group teams by user_id
        const teamsByUserId = new Map<string, Array<{ id: string; name: string; avatar?: string }>>();
        
        teamMembersData?.forEach((tm: any) => {
          if (tm.teams) {
            const team = tm.teams as any;
            if (!teamsByUserId.has(tm.user_id)) {
              teamsByUserId.set(tm.user_id, []);
            }
            teamsByUserId.get(tm.user_id)!.push({
              id: team.id,
              name: team.name,
              avatar: team.avatar,
            });
          }
        });

        // Merge teams into users
        users.forEach(user => {
          const userTeams = teamsByUserId.get(user.id);
          if (userTeams && userTeams.length > 0) {
            user.teams = userTeams;
          }
        });
      } catch (teamError) {
        console.warn("Error fetching teams for users (non-critical):", teamError);
        // Don't fail the whole operation if teams fail
      }
    }

    // Get mock instructors (including AI mentor) if requested
    const mockInstructors = includeMockInstructors ? getMockInstructors() : [];

    // Get mock instructor IDs and names to filter out duplicates from DB
    const mockInstructorIds = new Set(mockInstructors.map(m => m.id));
    const mockInstructorNames = new Set(mockInstructors.map(m => m.name.toLowerCase().trim()));

    // Filter out DB instructors that duplicate mock instructors by ID or name (prioritize mock)
    // This removes DeMentor from DB if it exists there
    const uniqueDbInstructors = dbInstructors.filter(
      dbInst => !mockInstructorIds.has(dbInst.id) && 
                !mockInstructorNames.has(dbInst.name.toLowerCase().trim())
    );

    // Merge all together (mock instructors take priority)
    const allUsers: SocialUser[] = [
      ...mockInstructors, // Add mock instructors first (highest priority)
      ...uniqueDbInstructors, // Then unique DB instructors
      ...users.filter(user => {
        // Filter out users that duplicate instructors (prioritize instructors)
        const allInstructorIds = new Set([
          ...mockInstructors.map(m => m.id),
          ...uniqueDbInstructors.map(i => i.id)
        ]);
        return !allInstructorIds.has(user.id);
      }),
    ];

    // Sort: AI mentor first, then mentors, then regular users
    return allUsers.sort((a, b) => {
      if (a.type === "ai-mentor") return -1;
      if (b.type === "ai-mentor") return 1;
      if (a.type === "mentor" && b.type === "user") return -1;
      if (a.type === "user" && b.type === "mentor") return 1;
      // Same type, sort by name
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error("Error merging users and mentors:", error);
    // Return at least mock instructors as fallback
    return includeMockInstructors ? getMockInstructors() : [];
  }
}

/**
 * Search and filter social users
 */
export function searchSocialUsers(
  users: SocialUser[],
  filter: SocialUserFilter
): SocialUser[] {
  let filtered = [...users];

  // Search filter
  if (filter.search) {
    const searchLower = filter.search.toLowerCase().trim();
    filtered = filtered.filter((user) => {
      const searchableText = [
        user.name,
        user.username,
        user.bio,
        ...(user.skills || []),
        ...(user.specializations || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchLower);
    });
  }

  // Type filter
  if (filter.type) {
    const types = Array.isArray(filter.type) ? filter.type : [filter.type];
    filtered = filtered.filter((user) => types.includes(user.type));
  }

  // Skills filter
  if (filter.skills && filter.skills.length > 0) {
    filtered = filtered.filter((user) => {
      const userSkills = [...(user.skills || []), ...(user.specializations || [])];
      return filter.skills!.some((skill) =>
        userSkills.some((userSkill) =>
          userSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
    });
  }

  // Looking for collaborators filter
  if (filter.lookingForCollaborators !== undefined) {
    filtered = filtered.filter(
      (user) => user.lookingForCollaborators === filter.lookingForCollaborators
    );
  }

  // Availability filter
  if (filter.availability && filter.availability.length > 0) {
    filtered = filtered.filter(
      (user) => user.availability && filter.availability!.includes(user.availability)
    );
  }

  return filtered;
}

/**
 * Get a single social user by ID (checks users, instructors, and mock instructors)
 */
export async function getSocialUserById(
  id: string,
  options?: {
    authSupabase?: any;
    learningSupabase?: any;
  }
): Promise<SocialUser | null> {
  const { authSupabase, learningSupabase } = options || {};

  try {
    // Check mock instructors first (especially for AI mentor)
    const mockInstructors = getMockInstructors();
    const mockMatch = mockInstructors.find((u) => u.id === id);
    if (mockMatch) {
      return mockMatch;
    }

    // Check database instructors
    const dbInstructors = await getInstructorsFromDB(learningSupabase);
    const dbInstructorMatch = dbInstructors.find((u) => u.id === id);
    if (dbInstructorMatch) {
      return dbInstructorMatch;
    }

    // Check users
    const users = await getAllUsers(authSupabase);
    const userMatch = users.find((u) => u.id === id);
    if (userMatch) {
      return userMatch;
    }

    return null;
  } catch (error) {
    console.error("Error getting social user by ID:", error);
    return null;
  }
}

