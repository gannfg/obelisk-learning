/**
 * Workshop Calendar & Attendance System Types
 */

export type WorkshopLocationType = "online" | "offline";
export type AttendanceMethod = "qr" | "manual";

export interface Workshop {
  id: string;
  title: string;
  description: string | null;
  datetime: Date;
  locationType: WorkshopLocationType;
  venueName: string | null;
  venueAddress?: string | null;
  venueLat?: number | null;
  venueLng?: number | null;
  googleMapsUrl?: string | null;
  meetingLink: string | null;
  hostName: string;
  capacity: number | null;
  imageUrl: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  qrToken: string | null;
  qrExpiresAt: Date | null;
}

export interface WorkshopRegistration {
  id: string;
  workshopId: string;
  userId: string;
  registeredAt: Date;
}

export interface WorkshopAttendance {
  id: string;
  workshopId: string;
  userId: string;
  checkinTime: Date;
  method: AttendanceMethod;
  checkedInBy: string | null;
}

export interface ProofOfAttendance {
  id: string;
  workshopId: string;
  userId: string;
  attendanceId: string;
  issuedAt: Date;
  metadata: Record<string, any>;
}

export interface WorkshopStats {
  totalRegistrations: number;
  totalAttendance: number;
  onlineAttendance: number;
  offlineAttendance: number;
}

export interface TeamAttendanceKPIs {
  totalWorkshopsAttended: number;
  onlineAttendanceCount: number;
  offlineAttendanceCount: number;
  attendanceConsistencyScore: number;
}

export interface CreateWorkshopInput {
  title: string;
  description?: string;
  datetime: string; // ISO string
  locationType: WorkshopLocationType;
  venueName?: string;
  venueAddress?: string;
  venueLat?: number | null;
  venueLng?: number | null;
  googleMapsUrl?: string;
  meetingLink?: string;
  hostName: string;
  capacity?: number;
  imageUrl?: string;
}

export interface UpdateWorkshopInput extends Partial<CreateWorkshopInput> {
  id: string;
}

