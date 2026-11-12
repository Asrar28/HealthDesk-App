export type UserRole = 'member' | 'editor' | 'reviewer' | 'admin';

export interface Profile {
  id: string;
  display_name: string;
  role: string;
  created_at: string;
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

export interface FamilyMember {
  id: string;
  user_id: string;
  display_name: string;
  name: string;
  relationship: string;
  age: number | null;
  gender: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  notes: string | null;
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
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  date: string | null;
  time?: string | null;
  category: string;
  type: string | null;
  status: string;
  priority: string | null;
  recurrence: string;
  repeat?: string | null;
  family_member_id: string | null;
  notes: string | null;
  is_completed: boolean;
  notified?: boolean | null;
  notified_at?: string | null;
  snoozed_until?: string | null;
  last_triggered_at?: string | null;
  created_at: string;
  family_members?: FamilyMember | null;
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  device_info: string | null;
  created_at: string;
  updated_at: string;
}

export interface Medicine {
  id: string;
  user_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  time: string | null;
  start_date: string | null;
  end_date: string | null;
  family_member_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  family_members?: FamilyMember | null;
}

export interface Appointment {
  id: string;
  user_id: string;
  title: string;
  doctor_name: string | null;
  hospital: string | null;
  date: string | null;
  due_date: string | null;
  time: string | null;
  family_member_id: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  family_members?: FamilyMember | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

export type FacilityCategory =
  | 'Hospital'
  | 'Clinic'
  | 'Pharmacy'
  | 'Lab'
  | 'Government Hospital'
  | 'PHC'
  | 'CHC'
  | 'Private Hospital'
  | 'Diagnostic Lab'
  | 'Blood Bank'
  | 'Specialist'
  | 'Emergency';

export type VerificationStatus = 'pending' | 'verified' | 'unverified';

export interface Facility {
  id: string;
  name: string;
  type: 'Hospital' | 'Clinic' | 'Pharmacy' | 'Lab';
  category?: FacilityCategory;
  area: string;
  address: string;
  phone: string;
  emergency: boolean;
  services: string[];
  timing?: string;
  description?: string;
  locality?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  website?: string | null;
  lat?: number | null;
  lng?: number | null;
  emergency_info?: string | null;
  verification_status?: VerificationStatus;
  source?: string | null;
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
  tags?: string[];
  language?: string;
  source_title?: string | null;
  source_url?: string | null;
  review_status?: ReviewStatus;
  reviewer_role?: string | null;
  review_date?: string | null;
  version?: number;
  reading_time?: number;
  author_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ArticleBookmark {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
}

export interface HealthArticle {
  id: string;
  title: string;
  category: string;
  icon: string;
  readTime: string;
  summary: string;
  body: string;
  tags?: string[];
}
