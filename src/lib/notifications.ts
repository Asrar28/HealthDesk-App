import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useAuth } from './auth';
import type { Notification } from './types';

export function useNotifications() {
  const { user } = useAuth();

  const { data: notifications = [], refetch } = useQuery<Notification[]>({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
      return (data || []) as Notification[];
    },
    enabled: !!user?.id,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, unreadCount, refetch };
}
