import { supabase } from './supabase';
import type { Profile, UserRole } from './types';

export async function fetchUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.error('fetchUserProfile', error);
    return null;
  }
  return data as Profile | null;
}

export function canManageFacilities(role: UserRole | undefined): boolean {
  return role === 'admin';
}

export function canEditArticles(role: UserRole | undefined): boolean {
  return role === 'editor' || role === 'reviewer' || role === 'admin';
}

export function canReviewArticles(role: UserRole | undefined): boolean {
  return role === 'reviewer' || role === 'admin';
}

export function canPublishArticles(role: UserRole | undefined): boolean {
  return role === 'reviewer' || role === 'admin';
}
