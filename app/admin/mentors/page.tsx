"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/lib/hooks/use-admin";
import { useAuth } from "@/lib/hooks/use-auth";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { createClient } from "@/lib/supabase/client";
import { getUserProfile } from "@/lib/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, UserMinus } from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
  is_mentor: boolean;
  created_at: string;
}

export default function AdminMentorsPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.replace("/");
    }
  }, [adminLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      const authSupabase = createClient();
      const learningSupabase = createLearningClient();
      
      if (!authSupabase || !learningSupabase) {
        setMessage({ type: "error", text: "Supabase clients not configured" });
        setTimeout(() => setMessage(null), 3000);
        setLoading(false);
        return;
      }

      // First, get all users from Auth Supabase
      const { data: authUsers, error: authError } = await authSupabase
        .from("users")
        .select("id, email, first_name, username, created_at")
        .order("created_at", { ascending: false });

      if (authError) {
        console.error("Error loading users from Auth Supabase:", authError);
        throw authError;
      }

      // Then, get mentor status from Learning Supabase
      const { data: learningUsers, error: learningError } = await learningSupabase
        .from("users")
        .select("id, is_mentor");

      if (learningError && learningError.code !== "PGRST116") {
        // PGRST116 = relation does not exist, which is fine if table is empty
        console.warn("Error loading users from Learning Supabase:", learningError);
      }

      // Create a map of mentor statuses
      const mentorStatusMap = new Map<string, boolean>();
      (learningUsers || []).forEach((user) => {
        mentorStatusMap.set(user.id, user.is_mentor || false);
      });

      // Combine data
      const usersWithProfiles = (authUsers || []).map((user) => ({
        id: user.id,
        email: user.email || "Unknown",
        name: user.first_name || user.username || undefined,
        is_mentor: mentorStatusMap.get(user.id) || false,
        created_at: user.created_at || new Date().toISOString(),
      }));

      setUsers(usersWithProfiles);
    } catch (error) {
      console.error("Error loading users:", error);
      setMessage({ type: "error", text: "Failed to load users" });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const toggleMentorRole = async (userId: string, currentStatus: boolean) => {
    try {
      setMessage(null); // Clear previous messages

      const response = await fetch("/api/admin/mentors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          isMentor: !currentStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to update mentor role");
      }

      setMessage({
        type: "success",
        text: currentStatus
          ? "Mentor role removed successfully"
          : "Mentor role assigned successfully",
      });
      setTimeout(() => setMessage(null), 3000);
      loadUsers();
    } catch (error: any) {
      console.error("Error updating mentor role:", {
        message: error?.message,
        stack: error?.stack,
        fullError: error,
      });
      setMessage({
        type: "error",
        text: `Failed to update mentor role: ${error?.message || "Unknown error"}`,
      });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (adminLoading || !isAdmin) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-center min-height-[300px]">
          <p className="text-base text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mentors = filteredUsers.filter((u) => u.is_mentor);
  const nonMentors = filteredUsers.filter((u) => !u.is_mentor);

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Mentor Management</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Assign or remove mentor roles to users. Mentors can create and manage their own classes.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Mentors ({mentors.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {mentors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No mentors found</p>
              ) : (
                mentors.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{user.name || user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Mentor</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleMentorRole(user.id, true)}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Users ({nonMentors.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {nonMentors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users found</p>
              ) : (
                nonMentors.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{user.name || user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => toggleMentorRole(user.id, false)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Make Mentor
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

