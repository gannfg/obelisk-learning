/**
 * Grant Management Types
 */

export type GrantStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'completed'
  | 'cancelled';

export type CheckInStatus = 
  | 'on_track'
  | 'at_risk'
  | 'behind'
  | 'blocked';

export type Grant = {
  id: string;
  title: string;
  description: string;
  recipientId: string;
  amount: number;
  currency: string;
  status: GrantStatus;
  startDate: string;
  endDate: string;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
};

export type Milestone = {
  id: string;
  grantId: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
};

export type CheckIn = {
  id: string;
  grantId: string;
  recipientId: string;
  status: CheckInStatus;
  update: string;
  attachments?: string[];
  createdAt: string;
};

export type StatusUpdate = {
  id: string;
  grantId: string;
  recipientId: string;
  title: string;
  content: string;
  progress: number; // 0-100
  attachments?: string[];
  createdAt: string;
};

export type Deployment = {
  id: string;
  grantId: string;
  recipientId: string;
  title: string;
  url: string;
  description?: string;
  environment: 'development' | 'staging' | 'production';
  deployedAt: string;
};

export type ProofOfWork = {
  id: string;
  grantId: string;
  recipientId: string;
  title: string;
  description: string;
  type: 'screenshot' | 'video' | 'code' | 'demo' | 'document';
  files: string[]; // URLs to uploaded files
  links?: string[]; // External links
  createdAt: string;
};




