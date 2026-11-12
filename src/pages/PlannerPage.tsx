import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek, isBefore, isAfter, parseISO,
  format, addDays, eachDayOfInterval, isSameDay, isSameMonth,
} from 'date-fns';
import {
  Plus, Calendar as CalendarIcon, List, Pencil, Trash2, Check, Clock, Bell,
  AlertTriangle, ChevronLeft, ChevronRight, Search, X, Filter,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import {
  LoadingState, EmptyState, ErrorState, Badge, Modal, ConfirmDialog, Spinner,
} from '@/components/ui';
import { calculateNextOccurrence, formatLeadTime, formatRecurrence } from '@/lib/date-utils';
import type { Reminder, FamilyMember, ReminderCategory, LeadTime, RecurrenceType } from '@/lib/types';

const CATEGORIES: ReminderCategory[] = [
  'General health checkup', 'Vaccination', 'Blood pressure screening',
  'Blood glucose screening', 'Dental', 'Eye', 'Follow-up', 'Wellness', 'Nutrition', 'Custom',
];

const LEAD_TIMES: LeadTime[] = ['at_time', '15_min', '1_hour', '1_day', '1_week'];
const RECURRENCES: RecurrenceType[] = ['none', 'daily', 'weekly', 'monthly', 'yearly'];

const schema = z.object({
  title: z.string().min(2, 'Enter a title (at least 2 characters)'),
  family_member_id: z.string().optional(),
  category: z.enum([
    'General health checkup', 'Vaccination', 'Blood pressure screening',
    'Blood glucose screening', 'Dental', 'Eye', 'Follow-up', 'Wellness', 'Nutrition', 'Custom',
  ]),
  due_date: z.string().min(1, 'Pick a date'),
  due_time: z.string().min(1, 'Pick a time'),
  lead_time: z.enum(['at_time', '15_min', '1_hour', '1_day', '1_week']),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function PlannerPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [snoozeId, setSnoozeId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPerson, setFilterPerson] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | null>(null);

  const { data: reminders = [], isLoading, error, refetch } = useQuery<(Reminder & { family_members?: FamilyMember })[]>({
    queryKey: ['reminders'],
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

  const { data: familyMembers = [] } = useQuery<FamilyMember[]>({
    queryKey: ['family-members'],
    queryFn: async () => {
      const { data, error } = await supabase.from('family_members').select('*').order('display_name');
      if (error) throw error;
      return data as FamilyMember[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const dueDate = new Date(`${data.due_date}T${data.due_time}`);
      const { error } = await supabase.from('reminders').insert({
        title: data.title,
        family_member_id: data.family_member_id || null,
        category: data.category,
        due_date: dueDate.toISOString(),
        lead_time: data.lead_time,
        recurrence: data.recurrence,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const dueDate = new Date(`${data.due_date}T${data.due_time}`);
      const { error } = await supabase.from('reminders').update({
        title: data.title,
        family_member_id: data.family_member_id || null,
        category: data.category,
        due_date: dueDate.toISOString(),
        lead_time: data.lead_time,
        recurrence: data.recurrence,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setShowForm(false);
      setEditingId(null);
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (reminder: Reminder) => {
      const completedDate = new Date();
      const baseDate = parseISO(reminder.due_date);
      const nextDate = calculateNextOccurrence(baseDate, reminder.recurrence);

      if (nextDate && reminder.recurrence !== 'none') {
        const { error: updateError } = await supabase.from('reminders').update({
          status: 'completed',
          completed_at: completedDate.toISOString(),
          next_due_date: nextDate.toISOString(),
          updated_at: completedDate.toISOString(),
        }).eq('id', reminder.id);
        if (updateError) throw updateError;

        const { error: insertError } = await supabase.from('reminders').insert({
          owner_id: user!.id,
          family_member_id: reminder.family_member_id,
          title: reminder.title,
          category: reminder.category,
          due_date: nextDate.toISOString(),
          lead_time: reminder.lead_time,
          recurrence: reminder.recurrence,
          notes: reminder.notes,
        });
        if (insertError) throw insertError;
      } else {
        const { error } = await supabase.from('reminders').update({
          status: 'completed',
          completed_at: completedDate.toISOString(),
          updated_at: completedDate.toISOString(),
        }).eq('id', reminder.id);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const snoozeMutation = useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number }) => {
      const snoozedUntil = addDays(new Date(), days);
      const { error } = await supabase.from('reminders').update({
        status: 'snoozed',
        snoozed_until: snoozedUntil.toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setSnoozeId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setDeleteId(null);
    },
  });

  const filtered = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    return reminders.filter((r) => {
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory !== 'all' && r.category !== filterCategory) return false;
      if (filterPerson !== 'all' && r.family_member_id !== filterPerson) return false;

      if (filterStatus !== 'all') {
        const effectiveDate = r.snoozed_until ? parseISO(r.snoozed_until) : parseISO(r.due_date);
        if (filterStatus === 'pending' && r.status !== 'pending') return false;
        if (filterStatus === 'completed' && r.status !== 'completed') return false;
        if (filterStatus === 'snoozed' && r.status !== 'snoozed') return false;
        if (filterStatus === 'overdue' && !(r.status === 'pending' && isBefore(effectiveDate, todayStart))) return false;
        if (filterStatus === 'today' && !(r.status === 'pending' && isAfter(effectiveDate, todayStart) && isBefore(effectiveDate, todayEnd))) return false;
        if (filterStatus === 'week' && !(r.status === 'pending' && isAfter(effectiveDate, todayEnd) && isBefore(effectiveDate, weekEnd))) return false;
      }
      return true;
    });
  }, [reminders, search, filterCategory, filterPerson, filterStatus]);

  const editingReminder = reminders.find((r) => r.id === editingId);

  if (isLoading) return <LoadingState message="Loading your reminders..." />;
  if (error) return <ErrorState message="Could not load your reminders." onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Preventive Planner</h1>
          <p className="text-sm text-navy-500">Manage checkups, vaccinations, and health reminders</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-navy-200 bg-white p-1">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${view === 'list' ? 'bg-teal-50 text-teal-700' : 'text-navy-500'}`}
            >
              <List className="h-4 w-4" /> List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${view === 'calendar' ? 'bg-teal-50 text-teal-700' : 'text-navy-500'}`}
            >
              <CalendarIcon className="h-4 w-4" /> Calendar
            </button>
          </div>
          <button
            onClick={() => { setEditingId(null); setShowForm(true); }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> New
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
            <input
              className="input pl-10"
              placeholder="Search reminders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input" value={filterPerson} onChange={(e) => setFilterPerson(e.target.value)}>
            <option value="all">All family members</option>
            {familyMembers.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
          </select>
          <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="today">Due today</option>
            <option value="overdue">Overdue</option>
            <option value="week">This week</option>
            <option value="completed">Completed</option>
            <option value="snoozed">Snoozed</option>
          </select>
        </div>
        {(search || filterCategory !== 'all' || filterPerson !== 'all' || filterStatus !== 'all') && (
          <button
            onClick={() => { setSearch(''); setFilterCategory('all'); setFilterPerson('all'); setFilterStatus('all'); }}
            className="mt-3 flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>

      {reminders.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<CalendarIcon className="h-12 w-12" />}
            title="No reminders yet"
            description="Create your first preventive health reminder to start tracking checkups, vaccinations, and screenings."
            action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="h-4 w-4" /> Create reminder</button>}
          />
        </div>
      )}

      {reminders.length > 0 && filtered.length === 0 && (
        <div className="card">
          <EmptyState icon={<Filter className="h-12 w-12" />} title="No reminders match your filters" description="Try adjusting or clearing your filters." />
        </div>
      )}

      {/* List View */}
      {view === 'list' && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onComplete={() => completeMutation.mutate(reminder)}
              onEdit={() => { setEditingId(reminder.id); setShowForm(true); }}
              onDelete={() => setDeleteId(reminder.id)}
              onSnooze={() => setSnoozeId(reminder.id)}
              completing={completeMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Calendar View */}
      {view === 'calendar' && reminders.length > 0 && (
        <CalendarView
          reminders={filtered}
          month={calendarMonth}
          onPrevMonth={() => setCalendarMonth(addDays(startOfMonth(calendarMonth), -1))}
          onNextMonth={() => setCalendarMonth(addDays(endOfMonth(calendarMonth), 1))}
          selectedDay={selectedCalendarDay}
          onSelectDay={setSelectedCalendarDay}
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <ReminderForm
          editing={editingReminder ?? null}
          familyMembers={familyMembers}
          onSubmit={(data) => {
            if (editingId) updateMutation.mutate({ id: editingId, data });
            else createMutation.mutate(data);
          }}
          onClose={() => { setShowForm(false); setEditingId(null); }}
          loading={createMutation.isPending || updateMutation.isPending}
          error={createMutation.error?.message || updateMutation.error?.message}
        />
      )}

      {/* Snooze Dialog */}
      {snoozeId && (
        <Modal open={true} onClose={() => setSnoozeId(null)} title="Snooze reminder" size="sm">
          <p className="mb-4 text-sm text-navy-600">How long would you like to snooze this reminder?</p>
          <div className="grid grid-cols-2 gap-3">
            {[{ d: 1, l: '1 day' }, { d: 3, l: '3 days' }, { d: 7, l: '1 week' }, { d: 30, l: '1 month' }].map((opt) => (
              <button
                key={opt.d}
                onClick={() => snoozeMutation.mutate({ id: snoozeId, days: opt.d })}
                disabled={snoozeMutation.isPending}
                className="btn-outline"
              >
                {opt.l}
              </button>
            ))}
          </div>
          {snoozeMutation.isPending && <div className="mt-4 flex justify-center"><Spinner /></div>}
        </Modal>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId.mutate(deleteId!)}
        title="Delete reminder"
        message="This will permanently remove the reminder. This cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function ReminderCard({ reminder, onComplete, onEdit, onDelete, onSnooze, completing }: {
  reminder: Reminder & { family_members?: FamilyMember };
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSnooze: () => void;
  completing: boolean;
}) {
  const now = new Date();
  const effectiveDate = reminder.snoozed_until ? parseISO(reminder.snoozed_until) : parseISO(reminder.due_date);
  const isOverdue = reminder.status === 'pending' && isBefore(effectiveDate, startOfDay(now));
  const isToday = reminder.status === 'pending' && isAfter(effectiveDate, startOfDay(now)) && isBefore(effectiveDate, endOfDay(now));

  const statusBadge = () => {
    if (reminder.status === 'completed') return <Badge variant="mint">Completed</Badge>;
    if (reminder.status === 'snoozed') return <Badge variant="navy">Snoozed</Badge>;
    if (isOverdue) return <Badge variant="coral">Overdue</Badge>;
    if (isToday) return <Badge variant="amber">Due today</Badge>;
    return <Badge variant="teal">Upcoming</Badge>;
  };

  return (
    <div className={`card flex items-start gap-4 ${isOverdue ? 'border-coral-200' : isToday ? 'border-amber-200' : ''}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className={`font-semibold text-navy-800 ${reminder.status === 'completed' ? 'line-through text-navy-400' : ''}`}>
              {reminder.title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-navy-400">
              {reminder.family_members && <span>{reminder.family_members.display_name}</span>}
              {reminder.family_members && <span>·</span>}
              <span>{format(effectiveDate, 'd MMM yyyy, h:mm a')}</span>
              {reminder.recurrence !== 'none' && <Badge variant="neutral">{formatRecurrence(reminder.recurrence)}</Badge>}
            </div>
            {reminder.notes && <p className="mt-2 text-sm text-navy-500">{reminder.notes}</p>}
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            {statusBadge()}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {reminder.status !== 'completed' && (
            <>
              <button onClick={onComplete} disabled={completing} className="btn-ghost text-mint-700 hover:bg-mint-50 text-xs">
                {completing ? <Spinner className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                Complete
              </button>
              <button onClick={onSnooze} className="btn-ghost text-xs">
                <Clock className="h-3.5 w-3.5" /> Snooze
              </button>
            </>
          )}
          <button onClick={onEdit} className="btn-ghost text-xs">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button onClick={onDelete} className="btn-ghost text-coral-600 hover:bg-coral-50 text-xs">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function CalendarView({ reminders, month, onPrevMonth, onNextMonth, selectedDay, onSelectDay }: {
  reminders: (Reminder & { family_members?: FamilyMember })[];
  month: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  selectedDay: Date | null;
  onSelectDay: (d: Date) => void;
}) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const remindersForDay = (day: Date) => reminders.filter((r) => {
    const d = r.snoozed_until ? parseISO(r.snoozed_until) : parseISO(r.due_date);
    return isSameDay(d, day);
  });

  const selectedDayReminders = selectedDay ? remindersForDay(selectedDay) : [];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-navy-800">{format(month, 'MMMM yyyy')}</h3>
          <div className="flex gap-1">
            <button onClick={onPrevMonth} className="rounded-lg p-2 text-navy-500 hover:bg-navy-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={onNextMonth} className="rounded-lg p-2 text-navy-500 hover:bg-navy-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-navy-400">{d}</div>
          ))}
          {days.map((day) => {
            const dayReminders = remindersForDay(day);
            const inMonth = isSameMonth(day, month);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const hasOverdue = dayReminders.some((r) => r.status === 'pending' && isBefore(parseISO(r.due_date), startOfDay(new Date())));

            return (
              <button
                key={day.toISOString()}
                onClick={() => onSelectDay(day)}
                className={`min-h-16 rounded-lg border p-1.5 text-left transition-colors ${
                  isSelected ? 'border-teal-500 bg-teal-50' :
                  isToday ? 'border-teal-300 bg-teal-50/30' :
                  'border-navy-100 hover:bg-navy-50'
                } ${!inMonth ? 'opacity-40' : ''}`}
              >
                <span className={`text-xs ${isToday ? 'font-bold text-teal-700' : 'text-navy-600'}`}>
                  {format(day, 'd')}
                </span>
                {dayReminders.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {dayReminders.slice(0, 3).map((r) => (
                      <span
                        key={r.id}
                        className={`h-1.5 w-1.5 rounded-full ${
                          r.status === 'completed' ? 'bg-mint-400' :
                          hasOverdue ? 'bg-coral-400' : 'bg-teal-400'
                        }`}
                      />
                    ))}
                    {dayReminders.length > 3 && <span className="text-[10px] text-navy-400">+{dayReminders.length - 3}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h3 className="mb-3 font-semibold text-navy-800">
          {selectedDay ? format(selectedDay, 'EEEE, d MMM') : 'Select a day'}
        </h3>
        {selectedDay && selectedDayReminders.length === 0 ? (
          <p className="py-8 text-center text-sm text-navy-400">No reminders on this day</p>
        ) : selectedDay ? (
          <div className="space-y-2">
            {selectedDayReminders.map((r) => (
              <div key={r.id} className="rounded-lg border border-navy-100 p-3">
                <p className="text-sm font-medium text-navy-800">{r.title}</p>
                <p className="text-xs text-navy-400">
                  {format(parseISO(r.snoozed_until || r.due_date), 'h:mm a')}
                  {r.family_members && ` · ${r.family_members.display_name}`}
                </p>
                <div className="mt-1.5">
                  {r.status === 'completed' ? <Badge variant="mint">Completed</Badge> : <Badge variant="teal">{r.category}</Badge>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-navy-400">Click any day to see reminders</p>
        )}
      </div>
    </div>
  );
}

function ReminderForm({ editing, familyMembers, onSubmit, onClose, loading, error }: {
  editing: Reminder | null;
  familyMembers: FamilyMember[];
  onSubmit: (data: FormData) => void;
  onClose: () => void;
  loading: boolean;
  error?: string;
}) {
  const dueDate = editing ? parseISO(editing.due_date) : new Date();

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editing ? {
      title: editing.title,
      family_member_id: editing.family_member_id ?? undefined,
      category: editing.category,
      due_date: format(dueDate, 'yyyy-MM-dd'),
      due_time: format(dueDate, 'HH:mm'),
      lead_time: editing.lead_time,
      recurrence: editing.recurrence,
      notes: editing.notes ?? '',
    } : {
      title: '',
      category: 'General health checkup',
      due_date: format(new Date(), 'yyyy-MM-dd'),
      due_time: '09:00',
      lead_time: 'at_time',
      recurrence: 'none',
      notes: '',
    },
  });

  return (
    <Modal open={true} onClose={onClose} title={editing ? 'Edit reminder' : 'New reminder'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <div className="rounded-lg bg-coral-50 px-4 py-3 text-sm text-coral-700">{error}</div>}

        <div>
          <label className="label">Title</label>
          <input className="input" placeholder="e.g. Annual health checkup" {...register('title')} />
          {errors.title && <p className="mt-1 text-xs text-coral-600">{errors.title.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Family member</label>
            <select className="input" {...register('family_member_id')}>
              <option value="">Unassigned</option>
              {familyMembers.map((m) => <option key={m.id} value={m.id}>{m.display_name} ({m.relationship})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" {...register('category')}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Due date</label>
            <input type="date" className="input" {...register('due_date')} />
            {errors.due_date && <p className="mt-1 text-xs text-coral-600">{errors.due_date.message}</p>}
          </div>
          <div>
            <label className="label">Time</label>
            <input type="time" className="input" {...register('due_time')} />
            {errors.due_time && <p className="mt-1 text-xs text-coral-600">{errors.due_time.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Recurrence</label>
            <Controller
              control={control}
              name="recurrence"
              render={({ field }) => (
                <select className="input" value={field.value} onChange={field.onChange}>
                  {RECURRENCES.map((r) => <option key={r} value={r}>{formatRecurrence(r)}</option>)}
                </select>
              )}
            />
          </div>
          <div>
            <label className="label">Lead time (notification)</label>
            <Controller
              control={control}
              name="lead_time"
              render={({ field }) => (
                <select className="input" value={field.value} onChange={field.onChange}>
                  {LEAD_TIMES.map((l) => <option key={l} value={l}>{formatLeadTime(l)}</option>)}
                </select>
              )}
            />
          </div>
        </div>

        <div>
          <label className="label">Notes (optional)</label>
          <textarea className="input min-h-20" rows={3} placeholder="Add any notes..." {...register('notes')} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading && <Spinner className="h-4 w-4" />}
            {editing ? 'Save changes' : 'Create reminder'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
