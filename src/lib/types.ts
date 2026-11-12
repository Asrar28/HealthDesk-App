export type UserRole = 'member' | 'editor' | 'reviewer' | 'admin';

export interface Profile {
  id: string;
  display_name: string;
  role: UserRole;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  owner_id: string;
  display_name: string;
  relationship: string;
  birth_year: number | null;
  avatar_url: string | null;
  created_at: string;
}

export type ReminderCategory =
  | 'General health checkup'
  | 'Vaccination'
  | 'Blood pressure screening'
  | 'Blood glucose screening'
  | 'Dental'
  | 'Eye'
  | 'Follow-up'
  | 'Wellness'
  | 'Nutrition'
  | 'Custom';

export type ReminderStatus = 'pending' | 'completed' | 'snoozed';
export type LeadTime = 'at_time' | '15_min' | '1_hour' | '1_day' | '1_week';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Reminder {
  id: string;
  owner_id: string;
  family_member_id: string | null;
  title: string;
  category: ReminderCategory;
  status: ReminderStatus;
  due_date: string;
  lead_time: LeadTime;
  recurrence: RecurrenceType;
  notes: string | null;
  snoozed_until: string | null;
  completed_at: string | null;
  next_due_date: string | null;
  created_at: string;
  updated_at: string;
  family_members?: FamilyMember | null;
}

export interface UserSettings {
  id: string;
  notify_reminders: boolean;
  notify_overdue: boolean;
  notify_articles: boolean;
  push_enabled: boolean;
  privacy_consent: boolean;
  created_at: string;
}

export type FacilityCategory =
  | 'Government Hospital'
  | 'PHC'
  | 'CHC'
  | 'Private Hospital'
  | 'Clinic'
  | 'Diagnostic Lab'
  | 'Pharmacy'
  | 'Blood Bank'
  | 'Specialist'
  | 'Emergency';

export type VerificationStatus = 'pending' | 'verified' | 'unverified';

export interface Facility {
  id: string;
  name: string;
  category: FacilityCategory;
  address: string;
  locality: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  website: string | null;
  lat: number | null;
  lng: number | null;
  services: string[];
  opening_hours: Record<string, string> | null;
  emergency_info: string | null;
  verification_status: VerificationStatus;
  source: string | null;
  last_verified: string | null;
  created_at: string;
  updated_at: string;
}

export type ArticleCategory =
  | 'Preventive'
  | 'Diabetes'
  | 'BP & Heart'
  | 'Nutrition'
  | 'Activity'
  | 'Hygiene'
  | 'Communicable Disease'
  | 'Vaccination'
  | 'Mental Wellbeing'
  | 'Healthy Ageing'
  | "Women's Health"
  | "Children's Health";

export type ReviewStatus =
  | 'draft'
  | 'submitted'
  | 'awaiting_review'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'archived';

export interface Article {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: ArticleCategory;
  tags: string[];
  language: string;
  source_title: string | null;
  source_url: string | null;
  review_status: ReviewStatus;
  reviewer_role: string | null;
  review_date: string | null;
  version: number;
  reading_time: number;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export interface ArticleBookmark {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}
