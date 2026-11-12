import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, isBefore, isAfter, parseISO } from 'date-fns';
import { CalendarCheck, Clock, AlertTriangle, CalendarDays, CheckCircle2, ArrowRight, Plus, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { LoadingState, EmptyState, Badge } from '@/components/ui';
import type { Reminder, FamilyMember } from '@/lib/types';

export function DashboardPage() {
  const { user } = useAuth();

  const { data: reminders = [], isLoading } = useQuery<(Reminder & { family_members?: FamilyMember })[]>({
    queryKey: ['reminders', 'dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reminders')
        .select('*, family_members(*)')
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data as (Reminder & { family_members?: FamilyMember })[];
    },
    enabled: !!user,
  });

  if (isLoading) return <LoadingState message="Loading your dashboard..." />;

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const pending = reminders.filter((r) => r.status === 'pending');
  const completed = reminders.filter((r) => r.status === 'completed');

  const overdue = pending.filter((r) => {
    const due = r.snoozed_until ? parseISO(r.snoozed_until) : parseISO(r.due_date);
    return isBefore(due, todayStart);
  });

  const dueToday = pending.filter((r) => {
    const due = r.snoozed_until ? parseISO(r.snoozed_until) : parseISO(r.due_date);
    return isAfter(due, todayStart) && isBefore(due, todayEnd);
  });

  const thisWeek = pending.filter((r) => {
    const due = r.snoozed_until ? parseISO(r.snoozed_until) : parseISO(r.due_date);
    return isAfter(due, todayEnd) && isBefore(due, weekEnd);
  });

  const nextReminder = pending
    .filter((r) => isAfter(r.snoozed_until ? parseISO(r.snoozed_until) : parseISO(r.due_date), now))
    .sort((a, b) => {
      const aDate = a.snoozed_until ? parseISO(a.snoozed_until) : parseISO(a.due_date);
      const bDate = b.snoozed_until ? parseISO(b.snoozed_until) : parseISO(b.due_date);
      return aDate.getTime() - bDate.getTime();
    })[0];

  const stats = [
    { label: 'Next Reminder', value: nextReminder ? nextReminder.title : 'None', sub: nextReminder?.family_members?.display_name ?? '', icon: Bell, variant: 'teal' as const, link: '/planner' },
    { label: 'Due Today', count: dueToday.length, icon: Clock, variant: 'amber' as const, link: '/planner?status=today' },
    { label: 'Overdue', count: overdue.length, icon: AlertTriangle, variant: 'coral' as const, link: '/planner?status=overdue' },
    { label: 'This Week', count: thisWeek.length, icon: CalendarDays, variant: 'navy' as const, link: '/planner?status=week' },
    { label: 'Completed', count: completed.length, icon: CheckCircle2, variant: 'mint' as const, link: '/planner?status=completed' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Dashboard</h1>
          <p className="text-sm text-navy-500">Here's your family's health at a glance</p>
        </div>
        <Link to="/planner" className="btn-primary">
          <Plus className="h-4 w-4" />
          New reminder
        </Link>
      </div>

      {reminders.length === 0 && !isLoading && (
        <div className="card">
          <EmptyState
            icon={<CalendarCheck className="h-12 w-12" />}
            title="No reminders yet"
            description="Create your first preventive health reminder to start tracking your family's checkups, vaccinations, and screenings."
            action={
              <Link to="/planner" className="btn-primary">
                <Plus className="h-4 w-4" />
                Create a reminder
              </Link>
            }
          />
        </div>
      )}

      {reminders.length > 0 && (
        <>
          {/* Stats grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {stats.map((stat) => (
              <Link
                key={stat.label}
                to={stat.link}
                className="card transition-shadow hover:shadow-card-hover"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${stat.variant}-50 text-${stat.variant}-600`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-navy-400">{stat.label}</p>
                    {'count' in stat ? (
                      <p className="text-2xl font-bold text-navy-800">{stat.count}</p>
                    ) : (
                      <>
                        <p className="truncate text-sm font-semibold text-navy-800">{stat.value}</p>
                        {stat.sub && <p className="truncate text-xs text-navy-400">{stat.sub}</p>}
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Next reminder highlight */}
          {nextReminder && (
            <div className="card bg-gradient-to-br from-teal-50 to-mint-100 border-teal-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500 text-white">
                    <Bell className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-teal-600">Up Next</p>
                    <h3 className="text-lg font-semibold text-navy-800">{nextReminder.title}</h3>
                    <div className="mt-1 flex items-center gap-3 text-sm text-navy-500">
                      {nextReminder.family_members && <span>{nextReminder.family_members.display_name}</span>}
                      <Badge variant="teal">{nextReminder.category}</Badge>
                    </div>
                  </div>
                </div>
                <Link to="/planner" className="btn-ghost text-teal-600">
                  View
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Overdue section */}
          {overdue.length > 0 && (
            <div className="card border-coral-200">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-coral-700">
                <AlertTriangle className="h-5 w-5" />
                Overdue ({overdue.length})
              </h3>
              <div className="space-y-2">
                {overdue.slice(0, 3).map((r) => (
                  <Link
                    key={r.id}
                    to="/planner"
                    className="flex items-center justify-between rounded-lg border border-coral-100 bg-coral-50/50 px-4 py-2.5 transition-colors hover:bg-coral-50"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium text-navy-800">{r.title}</p>
                        <p className="text-xs text-navy-400">{r.family_members?.display_name ?? 'Unassigned'}</p>
                      </div>
                    </div>
                    <Badge variant="coral">Overdue</Badge>
                  </Link>
                ))}
                {overdue.length > 3 && (
                  <Link to="/planner?status=overdue" className="block pt-1 text-center text-sm text-teal-600 hover:text-teal-700">
                    View all {overdue.length} overdue items
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Due today */}
          {dueToday.length > 0 && (
            <div className="card">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-navy-800">
                <Clock className="h-5 w-5 text-amber-500" />
                Due Today ({dueToday.length})
              </h3>
              <div className="space-y-2">
                {dueToday.map((r) => (
                  <Link
                    key={r.id}
                    to="/planner"
                    className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-2.5 transition-colors hover:bg-amber-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-navy-800">{r.title}</p>
                      <p className="text-xs text-navy-400">{r.family_members?.display_name ?? 'Unassigned'} · {r.category}</p>
                    </div>
                    <Badge variant="amber">Today</Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
