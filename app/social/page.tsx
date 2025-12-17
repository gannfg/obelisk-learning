"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CollaboratorCard } from "@/components/collaborator-card";
import { CollaboratorListItem } from "@/components/collaborator-list-item";
import {
  mergeUsersAndMentors,
  searchSocialUsers,
  type SocialUser,
  type SocialUserFilter,
  getSocialUserById,
} from "@/lib/social";
import {
  createDirectConversation,
} from "@/lib/messages";
import { createClient } from "@/lib/supabase/client";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { useAuth } from "@/lib/hooks/use-auth";
import { Search, Filter, X } from "lucide-react";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SocialPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const learningSupabase = createLearningClient();

  const [socialUsers, setSocialUsers] = useState<SocialUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SocialUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState<SocialUserFilter>({});

  // Load all users and mentors
  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        const allUsers = await mergeUsersAndMentors({
          authSupabase: supabase,
          learningSupabase: learningSupabase,
          includeMockInstructors: true,
        });
        // Keep all users including DeMentor (ai-mentor type) for the collaborate page
        setSocialUsers(allUsers);
        setFilteredUsers(allUsers);
      } catch (error) {
        console.error("Error loading users:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [supabase, learningSupabase]);

  // Apply search and filters
  useEffect(() => {
    const filtered = searchSocialUsers(socialUsers, {
      search: searchQuery || undefined,
      ...filter,
    });
    setFilteredUsers(filtered);
  }, [socialUsers, searchQuery, filter]);

  // Handle message button click - redirect to messages with user
  const handleMessageClick = async (userId: string) => {
    if (!user) {
      router.push('/auth/sign-in');
      return;
    }
    
    try {
      // Create or get conversation
      const convId = await createDirectConversation(userId);
      // Always navigate to messages; prefer direct conversation if we have an id
      router.push(convId ? `/messages/${convId}` : "/messages");
    } catch (error) {
      console.error("Error creating conversation:", error);
      router.push('/messages');
    }
  };

  // Get available filter options
  const allSkills = Array.from(
    new Set(
      socialUsers.flatMap((u) => [...(u.skills || []), ...(u.specializations || [])])
    )
  ).sort();

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      {/* Header Banner - Seamless, full-width */}
      <div className="mb-6 sm:mb-8">
        <Card className="relative overflow-hidden border-0 shadow-none bg-transparent p-0 min-h-[160px] sm:min-h-[200px] md:min-h-[240px]">
          {/* Background Image - allow some cover to fill space */}
          <div
            className="absolute inset-0 pointer-events-none z-0 bg-no-repeat bg-cover"
            style={{ backgroundImage: 'url(/collaborate_banner.svg)', backgroundPosition: 'calc(50% + -75px) center' }}
          />

          {/* Content overlay */}
          <div className="relative z-10 flex flex-col justify-center gap-2 sm:gap-3 px-4 sm:px-6 md:px-8 py-6 sm:py-8 h-full">
            <div className="max-w-2xl mt-[10px]">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-white">
                Team Up
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-white/90">
                Connect with builders, mentors, and teams across the ecosystem.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          <Input
            placeholder="Search by Role or Name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base"
          />
        </div>
        
        <Button
          variant="outline"
          size="default"
          onClick={() => setShowFilters(!showFilters)}
          className="h-10 sm:h-11"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="mb-6 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm sm:text-base font-semibold">Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilter({});
                setSearchQuery("");
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs sm:text-sm font-medium mb-2 block">Type</label>
              <Select
                value={Array.isArray(filter.type) ? filter.type[0] : filter.type || ""}
                onValueChange={(value) =>
                  setFilter((prev) => ({
                    ...prev,
                    type: value ? (value as SocialUser["type"]) : undefined,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="mentor">Mentors</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium mb-2 block">
                Looking for Collaborators
              </label>
              <Select
                value={filter.lookingForCollaborators ? "true" : ""}
                onValueChange={(value) =>
                  setFilter((prev) => ({
                    ...prev,
                    lookingForCollaborators: value === "true" ? true : undefined,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="true">Looking for Collaborators</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      )}

      {/* User Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredUsers.length > 0 ? (
        <>
          {/* Mobile: List View */}
          <div className="flex flex-col gap-2 sm:hidden">
            {filteredUsers.map((socialUser) => (
              <CollaboratorListItem
                key={socialUser.id}
                user={socialUser}
                onMessageClick={handleMessageClick}
              />
            ))}
          </div>
          
          {/* Desktop: Grid View */}
          <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredUsers.map((socialUser) => (
              <CollaboratorCard
                key={socialUser.id}
                user={socialUser}
                onMessageClick={handleMessageClick}
              />
            ))}
          </div>
        </>
      ) : (
        <Card className="p-8 sm:p-12 text-center">
          <p className="text-sm sm:text-base text-muted-foreground">
            No collaborators found matching your criteria.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setFilter({});
              setSearchQuery("");
            }}
          >
            Clear Filters
          </Button>
        </Card>
      )}
    </div>
  );
}
