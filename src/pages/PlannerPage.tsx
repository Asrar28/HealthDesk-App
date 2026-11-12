import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  Filter,
  User,
  AlertCircle,
  RotateCw,
  Bell,
  Calendar,
} from 'lucide-react';
import { format, parseISO, isToday, isFuture, addDays } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Modal, ConfirmDialog, Badge, Spinner, EmptyState, showToast } from '@/components/ui';
import type { Reminder, FamilyMember } from '@/lib/types';

const CATEGORIES = [
  'General health checkup',
  'Vaccination',
  'Blood pressure screening',
  'Blood glucose screening',
  'Dental',
  'Eye',
  'Follow-up',
  'Wellness',
  'Nutrition',
  'Custom',
];

const PRIORITIES = ['Low', 'Medium', 'High'];
const RECURRENCES = ['none', 'daily', 'weekly', 'monthly', 'yearly'];

export function PlannerPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Filters
  const [filterTab, setFilterTab] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [filterMember, setFilterMember] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [snoozeId, setSnoozeId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('General health checkup');
  const [formMemberId, setFormMemberId] = useState('');
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formTime, setFormTime] = useState('09:00');
  const [formPriority, setFormPriority] = useState('Medium');
  const [formRecurrence, setFormRecurrence] = useState('none');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // 1. Fetch Reminders
  const { data: reminders = [], isLoading, error, refetch } = useQuery<Reminder[]>({
    queryKey: ['reminders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return (data || []) as Reminder[];
    },
    enabled: !!user?.id,
  });
    // NOTIFICATION CHECKER - paste on line 83
const notifiedRef = useRef<Set<string>>(new Set())

useEffect(() => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
  const timer = setInterval(() => {
    if (!reminders) return
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    const timeStr = now.toTimeString().slice(0, 5)
    reminders.forEach((r: any) => {
      const rDate = (r.due_date || r.date || '').slice(0, 10)
      const rTime = (r.due_time || r.time || r.reminder_time || '').slice(0, 5)
      if (rDate === todayStr && rTime === timeStr && !notifiedRef.current.has(r.id)) {
        notifiedRef.current.add(r.id)
        if (Notification.permission === 'granted') {
          new Notification('HealthDesk Reminder', { body: `${r.title} - Time!` })
        }
      }
    })
  }, 15000)
  return () => clearInterval(timer)
}, [reminders])

  // 2. Fetch Family Members for dropdown
  const { data: familyMembers = [] } = useQuery<FamilyMember[]>({
    queryKey: ['family-members', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user.id)
        .order('display_name', { ascending: true });
      if (error) throw error;
      return (data || []) as FamilyMember[];
    },
    enabled: !!user?.id,
  });

  const memberMap = useMemo(() => {
    const map = new Map<string, string>();
    familyMembers.forEach((m) => map.set(m.id, m.display_name || m.name));
    return map;
  }, [familyMembers]);

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingReminder(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('General health checkup');
    setFormMemberId('');
    setFormDate(format(new Date(), 'yyyy-MM-dd'));
    setFormTime('09:00');
    setFormPriority('Medium');
    setFormRecurrence('none');
    setFormNotes('');
    setFormError('');
    setShowModal(true);
  };

  // Open Edit modal
  const handleOpenEdit = (r: Reminder) => {
    setEditingReminder(r);
    setFormTitle(r.title || '');
    setFormDescription(r.description || '');
    setFormCategory(r.category || 'General health checkup');
    setFormMemberId(r.family_member_id || '');
    setFormDate(r.date || r.due_date?.slice(0, 10) || format(new Date(), 'yyyy-MM-dd'));
    setFormTime(r.time || r.due_time || '09:00');
    setFormPriority(r.priority || 'Medium');
    setFormRecurrence(r.recurrence || 'none');
    setFormNotes(r.notes || '');
    setFormError('');
    setShowModal(true);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!formTitle.trim()) throw new Error('Please enter a title');
      if (!formDate) throw new Error('Please select a date');

      // STRICT Supabase column match:
      // id, user_id, title, description, due_date, due_time, date, category, type, status, priority, recurrence, family_member_id, notes, is_completed, created_at
      // CRITICAL: save BOTH due_date + date = same value, due_time + time = same value
      const payload = {
        user_id: user.id,
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        due_date: formDate,
        date: formDate,
        due_time: formTime || null,
        time: formTime || null,
        category: formCategory,
        type: formCategory,
        status: editingReminder ? editingReminder.status : 'pending',
        priority: formPriority,
        recurrence: formRecurrence,
        family_member_id: formMemberId ? formMemberId : null,
        notes: formNotes.trim() || null,
        is_completed: editingReminder ? editingReminder.is_completed : false,
      };

      if (editingReminder) {
        const { error } = await supabase
          .from('reminders')
          .update(payload)
          .eq('id', editingReminder.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('reminders').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', user?.id] });
      setShowModal(false);
      showToast({
        title: editingReminder ? 'Reminder updated' : 'Reminder created',
        type: 'success',
      });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to save reminder');
      showToast({
        title: 'Error saving reminder',
        description: err.message,
        type: 'error',
      });
    },
  });

  // Toggle Completion
  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('reminders')
        .update({
          is_completed,
          status: is_completed ? 'completed' : 'pending',
        })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', user?.id] });
      showToast({ title: 'Status updated', type: 'success' });
    },
    onError: (err: any) => {
      showToast({ title: 'Failed to update', description: err.message, type: 'error' });
    },
  });

  // Snooze by N days
  const snoozeMutation = useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const current = reminders.find((r) => r.id === id);
      const base = current?.date || current?.due_date || format(new Date(), 'yyyy-MM-dd');
      const nextDate = format(addDays(new Date(base), days), 'yyyy-MM-dd');

      const { error } = await supabase
        .from('reminders')
        .update({
          date: nextDate,
          due_date: nextDate,
          status: 'pending',
        })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', user?.id] });
      setSnoozeId(null);
      showToast({ title: 'Reminder snoozed', type: 'info' });
    },
    onError: (err: any) => {
      showToast({ title: 'Snooze failed', description: err.message, type: 'error' });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', user?.id] });
      setDeletingId(null);
      showToast({ title: 'Reminder deleted', type: 'info' });
    },
    onError: (err: any) => {
      showToast({ title: 'Delete failed', description: err.message, type: 'error' });
    },
  });

  // Filtering Logic
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const filteredReminders = useMemo(() => {
    return reminders.filter((r) => {
      // 1. Tab filter
      if (filterTab === 'today') {
        const d = r.date || r.due_date || '';
        if (!d.startsWith(todayStr)) return false;
      } else if (filterTab === 'upcoming') {
        const d = r.date || r.due_date || '';
        if (d < todayStr || r.is_completed) return false;
      } else if (filterTab === 'completed') {
        if (!r.is_completed) return false;
      }

      // 2. Member filter
      if (filterMember !== 'all') {
        if (r.family_member_id !== filterMember) return false;
      }

      // 3. Category filter
      if (filterCategory !== 'all') {
        if (r.category !== filterCategory) return false;
      }

      // 4. Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const t = (r.title || '').toLowerCase();
        const d = (r.description || '').toLowerCase();
        const n = (r.notes || '').toLowerCase();
        if (!t.includes(q) && !d.includes(q) && !n.includes(q)) return false;
      }

      return true;
    });
  }, [reminders, filterTab, filterMember, filterCategory, search, todayStr]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Preventive Planner</h1>
          <p className="text-sm text-slate-500">
            Never miss an annual blood test, dental checkup, child vaccination, or routine screening.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary self-start sm:self-auto">
          <Plus className="h-4 w-4" /> New Reminder
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'today', 'upcoming', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`rounded-xl px-4 py-2 text-xs font-bold capitalize transition-all ${
                filterTab === tab
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-gray-200/80 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Secondary filters row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-white px-3 py-2 border border-gray-200/80 shadow-xs flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search reminders..."
              className="w-full text-xs text-slate-800 outline-none bg-transparent placeholder:text-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-xl bg-white px-3 py-1.5 border border-gray-200/80 shadow-xs flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              className="w-full text-xs text-slate-800 outline-none bg-transparent"
              value={filterMember}
              onChange={(e) => setFilterMember(e.target.value)}
            >
              <option value="all">All Family Members</option>
              {familyMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name || m.name} ({m.relationship})
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl bg-white px-3 py-1.5 border border-gray-200/80 shadow-xs flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              className="w-full text-xs text-slate-800 outline-none bg-transparent"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="py-16 text-center">
          <Spinner className="h-8 w-8 text-teal-600 mx-auto" />
          <p className="mt-2 text-sm text-slate-500">Loading reminders...</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
          <AlertCircle className="h-8 w-8 mx-auto text-rose-600 mb-2" />
          <p className="text-sm font-semibold">Failed to load reminders</p>
          <p className="text-xs text-rose-600 mt-1">{(error as any).message}</p>
          <button onClick={() => refetch()} className="btn-outline mt-4 text-xs">
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredReminders.length === 0 && (
        <div className="rounded-3xl bg-white p-12 text-center border border-dashed border-gray-200 shadow-xs">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-4">
            <CalendarDays className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No reminders found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            {reminders.length === 0
              ? 'Schedule periodic vaccinations, yearly blood profiles, or dental visits.'
              : 'No reminders match your current search and filter settings.'}
          </p>
          <button onClick={handleOpenAdd} className="btn-primary mt-6">
            <Plus className="h-4 w-4" /> Create Reminder
          </button>
        </div>
      )}

      {/* Reminder Cards List */}
      {!isLoading && !error && filteredReminders.length > 0 && (
        <div className="space-y-3">
          {filteredReminders.map((r) => {
            const memberName = r.family_member_id ? memberMap.get(r.family_member_id) : 'All Members';
            const dateStr = r.date || r.due_date || '';
            const isTodayItem = dateStr.startsWith(todayStr);

            return (
              <div
                key={r.id}
                className={`group relative rounded-2xl bg-white p-5 shadow-sm border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  r.is_completed
                    ? 'border-gray-100 bg-slate-50/50 opacity-60'
                    : isTodayItem
                    ? 'border-amber-200 ring-1 ring-amber-100/60'
                    : 'border-gray-100 hover:border-teal-200'
                }`}
              >
                {/* Left side: Checkbox + info */}
                <div className="flex items-start gap-4 min-w-0">
                  <button
                    onClick={() =>
                      toggleCompleteMutation.mutate({ id: r.id, is_completed: !r.is_completed })
                    }
                    disabled={toggleCompleteMutation.isPending}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                      r.is_completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 hover:border-teal-500 bg-white'
                    }`}
                    title={r.is_completed ? 'Mark pending' : 'Mark completed'}
                  >
                    {r.is_completed && <CheckCircle2 className="h-4 w-4" />}
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-base font-bold leading-tight ${
                          r.is_completed ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {r.title}
                      </h3>
                      {r.priority && (
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            r.priority === 'High'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : r.priority === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {r.priority}
                        </span>
                      )}
                    </div>

                    {r.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">{r.description}</p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
                      <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                        {memberName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium text-slate-600">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {dateStr || 'No date'}
                      </span>
                      {(r.due_time || r.time) && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {r.due_time || r.time}
                          </span>
                        </>
                      )}
                      {r.recurrence && r.recurrence !== 'none' && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            <RotateCw className="h-3 w-3" />
                            {r.recurrence}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Category badge & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-gray-50">
                  <Badge variant={r.is_completed ? 'neutral' : 'teal'}>
                    {r.category || 'General'}
                  </Badge>

                  <div className="flex items-center gap-1">
                    {!r.is_completed && (
                      <button
                        onClick={() => setSnoozeId(r.id)}
                        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1"
                        title="Snooze reminder"
                      >
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        Snooze
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEdit(r)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                      title="Edit reminder"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(r.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Delete reminder"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingReminder ? 'Edit Reminder' : 'New Preventive Reminder'}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          {formError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="label">Reminder Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Annual Blood Sugar & Lipid Test, Polio Booster..."
              className="input"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Family Member</label>
              <select
                className="input"
                value={formMemberId}
                onChange={(e) => setFormMemberId(e.target.value)}
              >
                <option value="">All Members / General</option>
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name || m.name} ({m.relationship})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Date *</label>
              <input
                type="date"
                required
                className="input"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Time</label>
              <input
                type="time"
                className="input"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input"
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Recurrence</label>
              <select
                className="input"
                value={formRecurrence}
                onChange={(e) => setFormRecurrence(e.target.value)}
              >
                <option value="none">One-time only</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="label">Short Description</label>
              <input
                type="text"
                placeholder="e.g. Fasting 10 hrs before blood draw"
                className="input"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Notes / Instructions</label>
            <textarea
              rows={2}
              placeholder="e.g. Dr. Patil suggested this follow up after 3 months..."
              className="input"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="btn-primary"
            >
              {saveMutation.isPending && <Spinner className="h-4 w-4" />}
              {editingReminder ? 'Save Changes' : 'Create Reminder'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Snooze Modal */}
      <Modal open={!!snoozeId} onClose={() => setSnoozeId(null)} title="Snooze Reminder" size="sm">
        <p className="text-sm text-slate-600 mb-4">Postpone this reminder date:</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { days: 1, label: '1 Day' },
            { days: 3, label: '3 Days' },
            { days: 7, label: '1 Week' },
            { days: 30, label: '1 Month' },
          ].map((item) => (
            <button
              key={item.days}
              onClick={() => snoozeId && snoozeMutation.mutate({ id: snoozeId, days: item.days })}
              disabled={snoozeMutation.isPending}
              className="rounded-xl border border-gray-200 p-3 text-center text-sm font-bold text-slate-800 hover:bg-teal-50 hover:border-teal-300 transition"
            >
              +{item.label}
            </button>
          ))}
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Delete Reminder"
        message="Are you sure you want to delete this reminder? This action cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
