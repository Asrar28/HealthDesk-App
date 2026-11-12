import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pill,
  Plus,
  Search,
  Pencil,
  Trash2,
  Clock,
  Calendar,
  AlertCircle,
  User,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Modal, ConfirmDialog, Badge, Spinner, EmptyState, showToast } from '@/components/ui';
import type { Medicine, FamilyMember } from '@/lib/types';

const FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 8 hours',
  'Every 12 hours',
  'Weekly',
  'As needed (SOS)',
];

export function MedicinesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Filters
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'inactive'>('active');
  const [filterMember, setFilterMember] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDosage, setFormDosage] = useState('');
  const [formFrequency, setFormFrequency] = useState('Once daily');
  const [formTime, setFormTime] = useState('08:00');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formMemberId, setFormMemberId] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  // 1. Fetch Medicines
  const { data: medicines = [], isLoading, error, refetch } = useQuery<Medicine[]>({
    queryKey: ['medicines', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Medicine[];
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
    setEditingMedicine(null);
    setFormName('');
    setFormDosage('');
    setFormFrequency('Once daily');
    setFormTime('08:00');
    setFormStartDate(new Date().toISOString().slice(0, 10));
    setFormEndDate('');
    setFormMemberId('');
    setFormNotes('');
    setFormIsActive(true);
    setFormError('');
    setShowModal(true);
  };

  // Open Edit modal
  const handleOpenEdit = (m: Medicine) => {
    setEditingMedicine(m);
    setFormName(m.name || '');
    setFormDosage(m.dosage || '');
    setFormFrequency(m.frequency || 'Once daily');
    setFormTime(m.time || '08:00');
    setFormStartDate(m.start_date || '');
    setFormEndDate(m.end_date || '');
    setFormMemberId(m.family_member_id || '');
    setFormNotes(m.notes || '');
    setFormIsActive(m.is_active ?? true);
    setFormError('');
    setShowModal(true);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!formName.trim()) throw new Error('Please enter medication name');

      // STRICT Supabase column match:
      // id, user_id, name, dosage, frequency, time, start_date, end_date, family_member_id, notes, is_active, created_at
      const payload = {
        user_id: user.id,
        name: formName.trim(),
        dosage: formDosage.trim() || null,
        frequency: formFrequency || null,
        time: formTime || null,
        start_date: formStartDate || null,
        end_date: formEndDate || null,
        family_member_id: formMemberId ? formMemberId : null,
        notes: formNotes.trim() || null,
        is_active: formIsActive,
      };

      if (editingMedicine) {
        const { error } = await supabase
          .from('medicines')
          .update(payload)
          .eq('id', editingMedicine.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('medicines').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines', user?.id] });
      setShowModal(false);
      showToast({
        title: editingMedicine ? 'Medicine updated' : 'Medicine added',
        type: 'success',
      });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to save medicine');
      showToast({
        title: 'Error saving medicine',
        description: err.message,
        type: 'error',
      });
    },
  });

  // Active Toggle Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('medicines')
        .update({ is_active })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines', user?.id] });
      showToast({ title: 'Medicine status changed', type: 'info' });
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
        .from('medicines')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines', user?.id] });
      setDeletingId(null);
      showToast({ title: 'Medicine deleted', type: 'info' });
    },
    onError: (err: any) => {
      showToast({ title: 'Delete failed', description: err.message, type: 'error' });
    },
  });

  // Filtered List
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      // 1. Tab filter
      if (filterTab === 'active' && !m.is_active) return false;
      if (filterTab === 'inactive' && m.is_active) return false;

      // 2. Member filter
      if (filterMember !== 'all' && m.family_member_id !== filterMember) return false;

      // 3. Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const n = (m.name || '').toLowerCase();
        const d = (m.dosage || '').toLowerCase();
        const notes = (m.notes || '').toLowerCase();
        if (!n.includes(q) && !d.includes(q) && !notes.includes(q)) return false;
      }

      return true;
    });
  }, [medicines, filterTab, filterMember, search]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Medicines Tracker</h1>
          <p className="text-sm text-slate-500">
            Track daily prescriptions, dosage schedules, and course durations for the whole family.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Add Medicine
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {(['active', 'inactive', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`rounded-xl px-4 py-2 text-xs font-bold capitalize transition-all ${
                filterTab === tab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-gray-200/80 hover:bg-slate-50'
              }`}
            >
              {tab === 'active' ? 'Active Courses' : tab === 'inactive' ? 'Completed / Inactive' : 'All Medicines'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl bg-white px-3 py-2 border border-gray-200/80 shadow-xs flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by medicine name, dosage, or instructions..."
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
          <p className="mt-2 text-sm text-slate-500">Loading medicines...</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
          <AlertCircle className="h-8 w-8 mx-auto text-rose-600 mb-2" />
          <p className="text-sm font-semibold">Failed to load medicines</p>
          <p className="text-xs text-rose-600 mt-1">{(error as any).message}</p>
          <button onClick={() => refetch()} className="btn-outline mt-4 text-xs">
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredMedicines.length === 0 && (
        <div className="rounded-3xl bg-white p-12 text-center border border-dashed border-gray-200 shadow-xs">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
            <Pill className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No medicines found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            {medicines.length === 0
              ? 'Add prescriptions, vitamins, or daily pills to keep dosages consistent.'
              : 'No medications match your filter criteria.'}
          </p>
          <button onClick={handleOpenAdd} className="btn-primary mt-6">
            <Plus className="h-4 w-4" /> Add Medicine
          </button>
        </div>
      )}

      {/* Medicines Cards List */}
      {!isLoading && !error && filteredMedicines.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMedicines.map((m) => {
            const memberName = m.family_member_id ? memberMap.get(m.family_member_id) : 'All Members';

            return (
              <div
                key={m.id}
                className={`group rounded-2xl bg-white p-5 shadow-sm border transition-all flex flex-col justify-between gap-4 ${
                  m.is_active
                    ? 'border-gray-100 hover:border-emerald-200'
                    : 'border-gray-100 bg-slate-50/50 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                          m.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Pill className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-tight">{m.name}</h3>
                        <p className="text-xs font-semibold text-emerald-800 mt-0.5">
                          {m.dosage || 'Standard dose'}
                        </p>
                      </div>
                    </div>

                    {/* Active toggle button */}
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: m.id, is_active: !m.is_active })}
                      disabled={toggleActiveMutation.isPending}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold transition flex items-center gap-1.5 ${
                        m.is_active
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                      title="Click to toggle Active / Inactive"
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${m.is_active ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`}
                      />
                      {m.is_active ? 'Active' : 'Completed'}
                    </button>
                  </div>

                  {/* Frequency & Time */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-700">
                      {m.frequency || 'Once daily'}
                    </span>
                    {m.time && (
                      <span className="rounded-lg bg-teal-50 px-2 py-1 font-medium text-teal-800 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {m.time}
                      </span>
                    )}
                    <span className="rounded-lg bg-indigo-50 px-2 py-1 font-semibold text-indigo-800">
                      {memberName}
                    </span>
                  </div>

                  {/* Dates & Notes */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                    {(m.start_date || m.end_date) && (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {m.start_date ? m.start_date : 'Started'}
                          {m.end_date ? ` to ${m.end_date}` : ' (ongoing)'}
                        </span>
                      </div>
                    )}
                    {m.notes && (
                      <div className="rounded-xl bg-slate-50 p-2.5 text-slate-600 flex items-start gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <p className="line-clamp-2">{m.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-1 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => handleOpenEdit(m)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                    title="Edit medicine"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(m.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                    title="Delete medicine"
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
        title={editingMedicine ? 'Edit Medicine' : 'Add Medication'}
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
            <label className="label">Medication Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Metformin, Paracetamol, Telmisartan..."
              className="input"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Dosage</label>
              <input
                type="text"
                placeholder="e.g. 500mg, 1 tablet, 5ml"
                className="input"
                value={formDosage}
                onChange={(e) => setFormDosage(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Frequency</label>
              <select
                className="input"
                value={formFrequency}
                onChange={(e) => setFormFrequency(e.target.value)}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Scheduled Time</label>
              <input
                type="time"
                className="input"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
              />
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">End Date (optional)</label>
              <input
                type="date"
                className="input"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Instructions / Doctor Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Take after meal with warm water, avoid dairy for 1 hour..."
              className="input"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              checked={formIsActive}
              onChange={(e) => setFormIsActive(e.target.checked)}
            />
            <span>Active prescription (ongoing)</span>
          </label>

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
              {editingMedicine ? 'Save Changes' : 'Add Medicine'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Delete Medicine"
        message="Are you sure you want to remove this medication record?"
        confirmLabel="Delete"
        danger
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
