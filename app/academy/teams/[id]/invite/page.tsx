"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2, UserPlus, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { getTeamById, TeamWithDetails } from "@/lib/teams";
import { searchUsers, createTeamInvitation } from "@/lib/team-invitations";
import { cn } from "@/lib/utils";

export default function InviteMembersPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [team, setTeam] = useState<TeamWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; email: string; username?: string; name?: string; avatar?: string }>
  >([]);
  const [searching, setSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<
    Array<{ id: string; email: string; username?: string; name?: string; avatar?: string }>
  >([]);
  const [inviting, setInviting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId || !user) return;

    const loadTeam = async () => {
      setLoading(true);
      try {
        const teamData = await getTeamById(teamId, supabase);
        if (!teamData) {
          router.push("/academy/teams");
          return;
        }

        // Check if user is a team member
        const isMember = teamData.members?.some((m) => m.userId === user.id);
        if (!isMember) {
          router.push(`/academy/teams/${teamId}`);
          return;
        }

        setTeam(teamData);
      } catch (error) {
        console.error("Error loading team:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [teamId, user, supabase, router]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timeoutId = setTimeout(async () => {
        setSearching(true);
        try {
          const results = await searchUsers(searchQuery, supabase);
          // Filter out users who are already team members
          const existingMemberIds = new Set(team?.members?.map((m) => m.userId) || []);
          const filteredResults = results.filter((user) => !existingMemberIds.has(user.id));
          setSearchResults(filteredResults);
        } catch (error) {
          console.error("Error searching users:", error);
        } finally {
          setSearching(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, supabase, team]);

  const handleSelectUser = (user: { id: string; email: string; username?: string; name?: string; avatar?: string }) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleSendInvitations = async () => {
    if (!user || !team || selectedUsers.length === 0) return;

    setInviting(true);
    setError(null);
    setSuccess(null);

    try {
      const results = await Promise.all(
        selectedUsers.map((selectedUser) =>
          createTeamInvitation(team.id, selectedUser.id, user.id, supabase)
        )
      );

      const successful = results.filter((r) => r !== null).length;
      const failed = results.length - successful;

      if (successful > 0) {
        setSuccess(
          `Successfully sent ${successful} invitation${successful > 1 ? "s" : ""}${
            failed > 0 ? `. ${failed} invitation${failed > 1 ? "s" : ""} failed.` : ""
          }`
        );
        setSelectedUsers([]);
        setTimeout(() => {
          router.push(`/academy/teams/${team.id}`);
        }, 2000);
      } else {
        setError("Failed to send invitations. Please try again.");
      }
    } catch (err) {
      console.error("Error sending invitations:", err);
      setError("An error occurred while sending invitations.");
    } finally {
      setInviting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user || !team) {
    return null;
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="mb-8">
        <Link
          href={`/academy/teams/${team.id}`}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block transition-colors"
        >
          ← Back to Team
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Invite Members to {team.name}</CardTitle>
            <CardDescription>
              Search for users by email or username and invite them to join your team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {success && (
              <div className="p-3 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Search */}
            <div className="space-y-2">
              <label htmlFor="search" className="text-sm font-medium">
                Search Users
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by email or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Search Results */}
              {searchQuery.trim().length >= 2 && (
                <div className="border border-border rounded-md bg-background max-h-60 overflow-y-auto">
                  {searching ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="divide-y divide-border">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleSelectUser(user)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                        >
                          {user.avatar ? (
                            <div className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                              <Image
                                src={user.avatar}
                                alt={user.name || user.email}
                                fill
                                className="object-cover"
                                sizes="40px"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-primary">
                                {(user.name || user.email || "U").charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{user.name || user.username || user.email}</div>
                            {user.email && (
                              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                            )}
                          </div>
                          <UserPlus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No users found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Selected Users ({selectedUsers.length})</label>
                <div className="space-y-2">
                  {selectedUsers.map((selectedUser) => (
                    <div
                      key={selectedUser.id}
                      className="flex items-center gap-3 p-3 rounded-md border border-border bg-muted/30"
                    >
                      {selectedUser.avatar ? (
                        <div className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={selectedUser.avatar}
                            alt={selectedUser.name || selectedUser.email}
                            fill
                            className="object-cover"
                            sizes="40px"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-primary">
                            {(selectedUser.name || selectedUser.email || "U").charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {selectedUser.name || selectedUser.username || selectedUser.email}
                        </div>
                        {selectedUser.email && (
                          <div className="text-xs text-muted-foreground truncate">{selectedUser.email}</div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(selectedUser.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleSendInvitations}
                disabled={selectedUsers.length === 0 || inviting}
                className="flex-1"
              >
                {inviting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send Invitations ({selectedUsers.length})
                  </>
                )}
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/academy/teams/${team.id}`}>Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

