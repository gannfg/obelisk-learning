"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClassroomOverview } from "@/components/classroom/classroom-overview";
import { ClassroomModules } from "@/components/classroom/classroom-modules";
import { ClassroomAttendance } from "@/components/classroom/classroom-attendance";
import { ClassroomAssignments } from "@/components/classroom/classroom-assignments";
import { ClassroomAnnouncements } from "@/components/classroom/classroom-announcements";
import type { ClassWithModules } from "@/lib/classes";

interface ClassroomTabsProps {
  classId: string;
  classItem: ClassWithModules;
  userId: string;
  isInstructor: boolean;
}

export function ClassroomTabs({
  classId,
  classItem,
  userId,
  isInstructor,
}: ClassroomTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(urlTab);

  // Sync with URL parameter
  useEffect(() => {
    const tab = searchParams.get("tab") || "overview";
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Handle hash scrolling when assignments tab is active
  useEffect(() => {
    if (activeTab === "assignments" && typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash) {
        // Small delay to ensure content is rendered
        setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 300);
      }
    }
  }, [activeTab]);

  // Also check on initial mount
  useEffect(() => {
    if (typeof window !== "undefined" && activeTab === "assignments") {
      const hash = window.location.hash;
      if (hash) {
        // Longer delay on initial mount to ensure everything is loaded
        setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 500);
      }
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL, preserving hash if it exists
    const currentHash = typeof window !== "undefined" ? window.location.hash : "";
    const newUrl = `/class/${classId}?tab=${value}${currentHash}`;
    router.push(newUrl, { scroll: false });
    
    // If switching to assignments and there's a hash, scroll to it
    if (value === "assignments" && currentHash) {
      setTimeout(() => {
        const element = document.querySelector(currentHash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="modules">Modules</TabsTrigger>
        <TabsTrigger value="assignments">Assignments</TabsTrigger>
        <TabsTrigger value="attendance">Attendance</TabsTrigger>
        <TabsTrigger value="announcements">Announcements</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-6">
        <ClassroomOverview
          classId={classId}
          classItem={classItem}
          userId={userId}
          isInstructor={isInstructor}
        />
      </TabsContent>
      <TabsContent value="modules" className="mt-6">
        <ClassroomModules
          classId={classId}
          classItem={classItem}
          userId={userId}
          isInstructor={isInstructor}
        />
      </TabsContent>
      <TabsContent value="assignments" className="mt-6">
        <ClassroomAssignments
          classId={classId}
          classItem={classItem}
          userId={userId}
          isInstructor={isInstructor}
        />
      </TabsContent>
      <TabsContent value="attendance" className="mt-6">
        <ClassroomAttendance
          classId={classId}
          classItem={classItem}
          userId={userId}
          isInstructor={isInstructor}
        />
      </TabsContent>
      <TabsContent value="announcements" className="mt-6">
        <ClassroomAnnouncements
          classId={classId}
          classItem={classItem}
          userId={userId}
          isInstructor={isInstructor}
        />
      </TabsContent>
    </Tabs>
  );
}
