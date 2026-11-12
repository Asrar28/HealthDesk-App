import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Badge, Spinner, showToast } from '@/components/ui';
import type { Notification } from '@/lib/types';

export function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'read'>('all');

  // 1. Fetch Notifications
  const { data: notifications = [], isLoading, error, refetch } = useQuery<Notification[]>({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Notification[];
    },
    enabled: !!user?.id,
  });

  // Mark single as read
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
    onError: (err: any) => {
      showToast({ title: 'Failed to update notification', description: err.message, type: 'error' });
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      showToast({ title: 'All notifications marked as read', type: 'success' });
    },
    onError: (err: any) => {
      showToast({ title: 'Failed to mark all as read', description: err.message, type: 'error' });
    },
  });

  // Delete notification
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      showToast({ title: 'Notification removed', type: 'info' });
    },
    onError: (err: any) => {
      showToast({ title: 'Delete failed', description: err.message, type: 'error' });
    },
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filterTab === 'unread') return !n.is_read;
      if (filterTab === 'read') return n.is_read;
      return true;
    });
  }, [notifications, filterTab]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-500 text-white text-xs font-bold px-2 py-0.5">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Preventive alerts, vaccine schedules, and care reminders.</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="btn-outline self-start sm:self-auto text-xs py-2"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'unread', 'read'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`rounded-xl px-4 py-1.5 text-xs font-bold capitalize transition-all ${
              filterTab === tab
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-gray-200 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="py-16 text-center">
          <Spinner className="h-8 w-8 text-teal-600 mx-auto" />
          <p className="mt-2 text-sm text-slate-500">Checking notifications...</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
          <AlertCircle className="h-8 w-8 mx-auto text-rose-600 mb-2" />
          <p className="text-sm font-semibold">Failed to load notifications</p>
          <p className="text-xs text-rose-600 mt-1">{(error as any).message}</p>
          <button onClick={() => refetch()} className="btn-outline mt-4 text-xs">
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="rounded-3xl bg-white p-12 text-center border border-dashed border-gray-200 shadow-xs">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-4">
            <Inbox className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">All caught up!</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            You don't have any {filterTab === 'unread' ? 'unread ' : ''}notifications at the moment.
          </p>
        </div>
      )}

      {/* Notification Cards List */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`group rounded-2xl p-4 shadow-sm border transition-all flex items-start justify-between gap-4 ${
                n.is_read
                  ? 'bg-white border-gray-100 opacity-70'
                  : 'bg-teal-50/40 border-teal-200/80 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    n.is_read ? 'bg-slate-100 text-slate-400' : 'bg-teal-600 text-white shadow-sm'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm ${n.is_read ? 'font-semibold text-slate-800' : 'font-extrabold text-slate-900'}`}>
                      {n.title}
                    </h3>
                    {!n.is_read && (
                      <span className="h-2 w-2 rounded-full bg-teal-600" />
                    )}
                  </div>

                  {n.message && (
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  )}

                  <span className="mt-2 block text-[11px] text-slate-400 font-medium">
                    {new Date(n.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {!n.is_read && (
                  <button
                    onClick={() => markReadMutation.mutate(n.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-teal-700 transition"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteMutation.mutate(n.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                  title="Delete notification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
