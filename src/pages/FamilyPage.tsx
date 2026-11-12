import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  User,
  Heart,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Modal, ConfirmDialog, Badge, Spinner, EmptyState, showToast } from '@/components/ui';
import type { FamilyMember } from '@/lib/types';

const RELATIONSHIPS = ['Self', 'Spouse', 'Child', 'Parent', 'Sibling', 'Grandparent', 'Other'];
const GENDERS = ['Male', 'Female', 'Other'];

export function FamilyPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formRelationship, setFormRelationship] = useState('Child');
  const [formAge, setFormAge] = useState<string>('');
  const [formGender, setFormGender] = useState('Male');
  const [formDob, setFormDob] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // 1. Fetch Family Members
  const { data: familyMembers = [], isLoading, error, refetch } = useQuery<FamilyMember[]>({
    queryKey: ['family-members', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as FamilyMember[];
    },
    enabled: !!user?.id,
  });

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormName('');
    setFormRelationship('Child');
    setFormAge('');
    setFormGender('Male');
    setFormDob('');
    setFormNotes('');
    setFormError('');
    setShowModal(true);
  };

  // Open Edit modal
  const handleOpenEdit = (member: FamilyMember) => {
    setEditingMember(member);
    setFormName(member.display_name || member.name || '');
    setFormRelationship(member.relationship || 'Child');
    setFormAge(member.age ? String(member.age) : '');
    setFormGender(member.gender || 'Male');
    setFormDob(member.date_of_birth || '');
    setFormNotes(member.notes || '');
    setFormError('');
    setShowModal(true);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!formName.trim()) throw new Error('Please enter a name');

      const parsedAge = formAge ? parseInt(formAge, 10) : null;
      const cleanName = formName.trim();

      // STRICT Supabase column match: NEVER send birth_year or unlisted columns
      const payload = {
        user_id: user.id,
        display_name: cleanName,
        name: cleanName,
        relationship: formRelationship,
        age: isNaN(parsedAge as number) ? null : parsedAge,
        gender: formGender || null,
        date_of_birth: formDob || null,
        notes: formNotes.trim() || null,
      };

      if (editingMember) {
        const { error } = await supabase
          .from('family_members')
          .update(payload)
          .eq('id', editingMember.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('family_members').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members', user?.id] });
      setShowModal(false);
      showToast({
        title: editingMember ? 'Family member updated' : 'Family member added',
        type: 'success',
      });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to save family member');
      showToast({
        title: 'Error saving member',
        description: err.message,
        type: 'error',
      });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members', user?.id] });
      setDeletingId(null);
      showToast({ title: 'Family member deleted', type: 'info' });
    },
    onError: (err: any) => {
      showToast({
        title: 'Delete failed',
        description: err.message,
        type: 'error',
      });
    },
  });

  // Filtered members by search
  const filteredMembers = useMemo(() => {
    return familyMembers.filter((m) => {
      const q = search.toLowerCase();
      const n = (m.display_name || m.name || '').toLowerCase();
      const r = (m.relationship || '').toLowerCase();
      return n.includes(q) || r.includes(q);
    });
  }, [familyMembers, search]);

  const colors = [
    'bg-teal-100 text-teal-800 border-teal-200',
    'bg-emerald-100 text-emerald-800 border-emerald-200',
    'bg-sky-100 text-sky-800 border-sky-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-amber-100 text-amber-800 border-amber-200',
    'bg-rose-100 text-rose-800 border-rose-200',
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Family Members</h1>
          <p className="text-sm text-slate-500">
            Manage profiles for each family member to tailor checkups, vaccines, and medicines.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Add Member
        </button>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 flex items-center gap-3">
        <Search className="h-5 w-5 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by name or relationship (e.g. Aisha, Child)..."
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-xs text-slate-400 hover:text-slate-600 font-medium">
            Clear
          </button>
        )}
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="py-16 text-center">
          <Spinner className="h-8 w-8 text-teal-600 mx-auto" />
          <p className="mt-2 text-sm text-slate-500">Loading family members...</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
          <AlertCircle className="h-8 w-8 mx-auto text-rose-600 mb-2" />
          <p className="text-sm font-semibold">Failed to load family members</p>
          <p className="text-xs text-rose-600 mt-1">{(error as any).message}</p>
          <button onClick={() => refetch()} className="btn-outline mt-4 text-xs">
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && familyMembers.length === 0 && (
        <div className="rounded-3xl bg-white p-12 text-center border border-dashed border-gray-200 shadow-xs">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-4">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No family members registered</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            Add your parents, spouse, or children to start tracking their vaccines, medical checkups, and prescriptions.
          </p>
          <button onClick={handleOpenAdd} className="btn-primary mt-6">
            <Plus className="h-4 w-4" /> Add your first member
          </button>
        </div>
      )}

      {/* Member Cards Grid */}
      {!isLoading && !error && familyMembers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((member, idx) => {
            const name = member.display_name || member.name || 'Member';
            const initial = name.charAt(0).toUpperCase();
            const colorClass = colors[idx % colors.length];

            return (
              <div
                key={member.id}
                className="group relative rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-extrabold border ${colorClass}`}
                      >
                        {initial}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-tight">{name}</h3>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="teal">{member.relationship || 'Family'}</Badge>
                          {member.gender && (
                            <span className="text-xs text-slate-400 font-medium">{member.gender}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleOpenEdit(member)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        title="Edit member"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(member.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Delete member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-5 space-y-2 border-t border-gray-50 pt-4 text-xs text-slate-500">
                    {member.age !== null && member.age !== undefined && (
                      <div className="flex items-center gap-2">
                        <Heart className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          Age: <strong className="font-semibold text-slate-700">{member.age} yrs</strong>
                        </span>
                      </div>
                    )}
                    {member.date_of_birth && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>DOB: {member.date_of_birth}</span>
                      </div>
                    )}
                    {member.notes && (
                      <div className="flex items-start gap-2 pt-1 text-slate-600 bg-slate-50 rounded-xl p-2.5">
                        <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <p className="line-clamp-2 italic">{member.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Registered {new Date(member.created_at).toLocaleDateString()}</span>
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
        title={editingMember ? 'Edit Family Member' : 'Add Family Member'}
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
            <label className="label">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Aisha Kazia, Mohammed..."
              className="input"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Relationship</label>
              <select
                className="input"
                value={formRelationship}
                onChange={(e) => setFormRelationship(e.target.value)}
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Gender</label>
              <select
                className="input"
                value={formGender}
                onChange={(e) => setFormGender(e.target.value)}
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Age (years)</label>
              <input
                type="number"
                min="0"
                max="130"
                placeholder="e.g. 28"
                className="input"
                value={formAge}
                onChange={(e) => setFormAge(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input
                type="date"
                className="input"
                value={formDob}
                onChange={(e) => setFormDob(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Special Notes / Allergies (Optional)</label>
            <textarea
              rows={3}
              placeholder="e.g. Penicillin allergy, diabetic, blood type O+..."
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
              {editingMember ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Delete Family Member"
        message="Are you sure you want to delete this profile? Associated reminders or records will remain but will become unassigned."
        confirmLabel="Delete Member"
        danger
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
