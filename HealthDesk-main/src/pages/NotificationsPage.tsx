import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, Filter, CalendarCheck, AlertTriangle, BookOpen, Users, Info } from 'lucide-react';
import { useNotifications } from '@/lib/notifications';
import { LoadingState, EmptyState, ErrorState, Badge } from '@/components/ui';
import { formatDistanceToNow } from 'date-fns';

const TYPE_ICONS: Record<string, typeof Bell> = {
  reminder: CalendarCheck,
  overdue: AlertTriangle,
  article: BookOpen,
  family: Users,
  system: Info,
};

const TYPE_VARIANTS: Record<string, 'teal' | 'coral' | 'navy' | 'mint' | 'amber'> = {
  reminder: 'teal',
  overdue: 'coral',
  article: 'navy',
  family: 'mint',
  system: 'amber',
};

export function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | string>('all');

  const filtered = filter === 'all' ? notifications : filter === 'unread' ? notifications.filter((n) => !n.read) : notifications.filter((n) => n.type === filter);
  const types = Array.from(new Set(notifications.map((n) => n.type)));

  if (!notifications && !unreadCount) return <LoadingState message="Loading notifications..." />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Notifications</h1>
          <p className="text-sm text-navy-500">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAllAsRead.mutate()} disabled={markAllAsRead.isPending} className="btn-outline">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter('all')} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filter === 'all' ? 'bg-teal-50 text-teal-700' : 'bg-white text-navy-500 border border-navy-200'}`}>
          All ({notifications.length})
        </button>
        <button onClick={() => setFilter('unread')} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filter === 'unread' ? 'bg-teal-50 text-teal-700' : 'bg-white text-navy-500 border border-navy-200'}`}>
          Unread ({unreadCount})
        </button>
        {types.map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${filter === t ? 'bg-teal-50 text-teal-700' : 'bg-white text-navy-500 border border-navy-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Bell className="h-12 w-12" />}
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            description={filter === 'all' ? "You'll see reminders, alerts, and updates here." : 'Nothing to show in this category.'}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const Icon = TYPE_ICONS[n.type] ?? Bell;
            const variant = TYPE_VARIANTS[n.type] ?? 'teal';
            return (
              <div
                key={n.id}
                className={`card flex items-start gap-4 transition-colors ${!n.read ? 'border-teal-200 bg-teal-50/30' : ''}`}
              >
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-${variant}-50 text-${variant}-600`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm ${!n.read ? 'font-semibold text-navy-800' : 'font-medium text-navy-600'}`}>{n.title}</h3>
                    {!n.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-teal-500" />}
                  </div>
                  {n.message && <p className="mt-0.5 text-sm text-navy-500">{n.message}</p>}
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="text-xs text-navy-400">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                    {n.link && <Link to={n.link} className="text-xs text-teal-600 hover:text-teal-700">View</Link>}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  {!n.read && (
                    <button onClick={() => markAsRead.mutate(n.id)} disabled={markAsRead.isPending} className="btn-ghost text-xs" title="Mark as read">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => deleteNotification.mutate(n.id)} disabled={deleteNotification.isPending} className="btn-ghost text-xs text-coral-600 hover:bg-coral-50" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card bg-navy-50 border-navy-100">
        <p className="text-xs leading-relaxed text-navy-500">
          In-app notifications are active. To receive push notifications on your device,
          enable "Push notifications" in Settings and grant browser notification permission.
          FCM push setup requires a Firebase project — see the setup instructions.
        </p>
      </div>
    </div>
  );
}
