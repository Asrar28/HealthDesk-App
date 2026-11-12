import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarCheck,
  Plus,
  Search,
  Pencil,
  Trash2,
  Clock,
  Calendar,
  AlertCircle,
  User,
  CheckCircle2,
  Building,
  Stethoscope,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Modal, ConfirmDialog, Badge, Spinner, EmptyState, showToast } from '@/components/ui';
import type { Appointment, FamilyMember } from '@/lib/types';

const STATUSES = ['upcoming', 'completed', 'cancelled'];

export function AppointmentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Filters
  const [filterTab, setFilterTab] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [filterMember, setFilterMember] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDoctorName, setFormDoctorName] = useState('');
  const [formHospital, setFormHospital] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formTime, setFormTime] = useState('10:00');
  const [formMemberId, setFormMemberId] = useState('');
  const [formStatus, setFormStatus] = useState('upcoming');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // 1. Fetch Appointments
  const { data: appointments = [], isLoading, error, refetch } = useQuery<Appointment[]>({
    queryKey: ['appointments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });
      if (error) throw error;
      return (data || []) as Appointment[];
    },
    enabled: !!user?.id,
  });

  // 2. Fetch Family Members
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
    setEditingAppointment(null);
    setFormTitle('');
    setFormDoctorName('');
    setFormHospital('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormTime('10:00');
    setFormMemberId('');
    setFormStatus('upcoming');
    setFormNotes('');
    setFormError('');
    setShowModal(true);
  };

  // Open Edit modal
  const handleOpenEdit = (a: Appointment) => {
    setEditingAppointment(a);
    setFormTitle(a.title || '');
    setFormDoctorName(a.doctor_name || '');
    setFormHospital(a.hospital || '');
    setFormDate(a.date || a.due_date || new Date().toISOString().slice(0, 10));
    setFormTime(a.time || '10:00');
    setFormMemberId(a.family_member_id || '');
    setFormStatus(a.status || 'upcoming');
    setFormNotes(a.notes || '');
    setFormError('');
    setShowModal(true);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!formTitle.trim()) throw new Error('Please enter appointment title');
      if (!formDate) throw new Error('Please pick a date');

      // STRICT Supabase column match:
      // id, user_id, title, doctor_name, hospital, date, due_date, time, family_member_id, status, notes, created_at
      const payload = {
        user_id: user.id,
        title: formTitle.trim(),
        doctor_name: formDoctorName.trim() || null,
        hospital: formHospital.trim() || null,
        date: formDate,
        due_date: formDate,
        time: formTime || null,
        family_member_id: formMemberId ? formMemberId : null,
        status: formStatus,
        notes: formNotes.trim() || null,
      };

      if (editingAppointment) {
        const { error } = await supabase
          .from('appointments')
          .update(payload)
          .eq('id', editingAppointment.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('appointments').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', user?.id] });
      setShowModal(false);
      showToast({
        title: editingAppointment ? 'Appointment updated' : 'Appointment scheduled',
        type: 'success',
      });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to save appointment');
      showToast({
        title: 'Error saving appointment',
        description: err.message,
        type: 'error',
      });
    },
  });

  // Quick Status Mutation (Mark Done / Cancel)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', user?.id] });
      showToast({ title: 'Appointment status updated', type: 'info' });
    },
    onError: (err: any) => {
      showToast({ title: 'Status update failed', description: err.message, type: 'error' });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', user?.id] });
      setDeletingId(null);
      showToast({ title: 'Appointment deleted', type: 'info' });
    },
    onError: (err: any) => {
      showToast({ title: 'Delete failed', description: err.message, type: 'error' });
    },
  });

  // Filtered List
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      // 1. Tab filter
      if (filterTab !== 'all' && a.status !== filterTab) return false;

      // 2. Member filter
      if (filterMember !== 'all' && a.family_member_id !== filterMember) return false;

      // 3. Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const t = (a.title || '').toLowerCase();
        const doc = (a.doctor_name || '').toLowerCase();
        const hosp = (a.hospital || '').toLowerCase();
        if (!t.includes(q) && !doc.includes(q) && !hosp.includes(q)) return false;
      }

      return true;
    });
  }, [appointments, filterTab, filterMember, search]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Doctor Appointments</h1>
          <p className="text-sm text-slate-500">
            Keep track of upcoming clinic visits, hospital consultations, and diagnostic follow-ups.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Add Appointment
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {(['upcoming', 'completed', 'cancelled', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`rounded-xl px-4 py-2 text-xs font-bold capitalize transition-all ${
                filterTab === tab
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-gray-200/80 hover:bg-slate-50'
              }`}
            >
              {tab === 'completed' ? 'Done' : tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl bg-white px-3 py-2 border border-gray-200/80 shadow-xs flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by title, doctor name, or hospital..."
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
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="py-16 text-center">
          <Spinner className="h-8 w-8 text-teal-600 mx-auto" />
          <p className="mt-2 text-sm text-slate-500">Loading appointments...</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
          <AlertCircle className="h-8 w-8 mx-auto text-rose-600 mb-2" />
          <p className="text-sm font-semibold">Failed to load appointments</p>
          <p className="text-xs text-rose-600 mt-1">{(error as any).message}</p>
          <button onClick={() => refetch()} className="btn-outline mt-4 text-xs">
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredAppointments.length === 0 && (
        <div className="rounded-3xl bg-white p-12 text-center border border-dashed border-gray-200 shadow-xs">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-sky-50 text-sky-600 mb-4">
            <CalendarCheck className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No appointments found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            {appointments.length === 0
              ? 'Schedule upcoming visits with local pediatricians, dentists, or cardiologists.'
              : 'No appointments match your active filter.'}
          </p>
          <button onClick={handleOpenAdd} className="btn-primary mt-6">
            <Plus className="h-4 w-4" /> Book Appointment
          </button>
        </div>
      )}

      {/* Appointments List */}
      {!isLoading && !error && filteredAppointments.length > 0 && (
        <div className="space-y-3">
          {filteredAppointments.map((a) => {
            const memberName = a.family_member_id ? memberMap.get(a.family_member_id) : 'All Members';
            const dateStr = a.date || a.due_date || 'Date TBD';

            return (
              <div
                key={a.id}
                className="group rounded-2xl bg-white p-5 shadow-sm border border-gray-100 hover:border-sky-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      a.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-600'
                        : a.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-sky-50 text-sky-600'
                    }`}
                  >
                    <Stethoscope className="h-6 w-6" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{a.title}</h3>
                      <Badge
                        variant={
                          a.status === 'completed'
                            ? 'mint'
                            : a.status === 'cancelled'
                            ? 'rose'
                            : 'blue'
                        }
                      >
                        {a.status === 'completed' ? 'Done' : a.status || 'Upcoming'}
                      </Badge>
                    </div>

                    <div className="mt-1 text-xs text-slate-600 font-medium flex flex-wrap items-center gap-2">
                      {a.doctor_name && <span>Dr. {a.doctor_name}</span>}
                      {a.doctor_name && a.hospital && <span>•</span>}
                      {a.hospital && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Building className="h-3 w-3" />
                          {a.hospital}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md">
                        {memberName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium text-slate-600">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {dateStr}
                      </span>
                      {a.time && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {a.time}
                          </span>
                        </>
                      )}
                    </div>

                    {a.notes && (
                      <p className="mt-2 text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                        {a.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right side action controls */}
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-gray-50">
                  {a.status === 'upcoming' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: a.id, status: 'completed' })}
                      className="rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mark Done
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenEdit(a)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                    title="Edit appointment"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(a.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                    title="Delete appointment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
        title={editingAppointment ? 'Edit Appointment' : 'Schedule Appointment'}
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
            <label className="label">Appointment Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Pediatrician Checkup, Cardiology Review, Eye Exam..."
              className="input"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Doctor Name</label>
              <input
                type="text"
                placeholder="e.g. Dr. Patil, Dr. Aisha..."
                className="input"
                value={formDoctorName}
                onChange={(e) => setFormDoctorName(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Clinic / Hospital</label>
              <input
                type="text"
                placeholder="e.g. Govt Hospital Bhatkal, Al-Shifa..."
                className="input"
                value={formHospital}
                onChange={(e) => setFormHospital(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Family Member</label>
              <select
                className="input"
                value={formMemberId}
                onChange={(e) => setFormMemberId(e.target.value)}
              >
                <option value="">General / All Members</option>
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name || m.name} ({m.relationship})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === 'completed' ? 'Done' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Consultation Notes / Prescriptions</label>
            <textarea
              rows={2}
              placeholder="e.g. Bring previous blood reports and ECG charts..."
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
              {editingAppointment ? 'Save Changes' : 'Schedule Appointment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Delete Appointment"
        message="Are you sure you want to remove this appointment record?"
        confirmLabel="Delete"
        danger
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
