import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Plus, Pencil, Trash2, User as UserIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { LoadingState, EmptyState, ErrorState, Modal, ConfirmDialog, Spinner } from '@/components/ui';
import type { FamilyMember } from '@/lib/types';

const schema = z.object({
  display_name: z.string().min(1, 'Enter a display name'),
  relationship: z.string().min(1, 'Enter a relationship'),
  birth_year: z.string().optional().refine(
    (v) => !v || (/^\d{4}$/.test(v) && parseInt(v) >= 1900 && parseInt(v) <= new Date().getFullYear()),
    'Enter a valid 4-digit year'
  ),
});

type FormData = z.infer<typeof schema>;

const AVATAR_COLORS = ['bg-teal-500', 'bg-navy-600', 'bg-mint-500', 'bg-amber-500', 'bg-coral-500'];

export function FamilyPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: members = [], isLoading, error, refetch } = useQuery<FamilyMember[]>({
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
      const { error } = await supabase.from('family_members').insert({
        display_name: data.display_name,
        relationship: data.relationship,
        birth_year: data.birth_year ? parseInt(data.birth_year) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['family-members'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const { error } = await supabase.from('family_members').update({
        display_name: data.display_name,
        relationship: data.relationship,
        birth_year: data.birth_year ? parseInt(data.birth_year) : null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['family-members'] }); setShowForm(false); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('family_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['family-members'] }); setDeleteId(null); },
  });

  const editing = members.find((m) => m.id === editingId);

  if (isLoading) return <LoadingState message="Loading family members..." />;
  if (error) return <ErrorState message="Could not load your family members." onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Family</h1>
          <p className="text-sm text-navy-500">Manage your family member profiles</p>
        </div>
        <button onClick={() => { setEditingId(null); setShowForm(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> Add member
        </button>
      </div>

      {members.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="No family members yet"
            description="Add family member profiles to assign reminders to the right person. Only names, relationships, and birth years are stored — no medical history."
            action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="h-4 w-4" /> Add family member</button>}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member, i) => (
            <div key={member.id} className="card">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-white`}>
                  <span className="text-lg font-semibold">{member.display_name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-navy-800">{member.display_name}</h3>
                  <p className="text-sm text-navy-500">{member.relationship}</p>
                  {member.birth_year && <p className="text-xs text-navy-400">Born {member.birth_year}</p>}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-navy-100 pt-3">
                <button onClick={() => { setEditingId(member.id); setShowForm(true); }} className="btn-ghost text-xs">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={() => setDeleteId(member.id)} className="btn-ghost text-coral-600 hover:bg-coral-50 text-xs">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <FamilyForm
          editing={editing ?? null}
          onSubmit={(data) => {
            if (editingId) updateMutation.mutate({ id: editingId, data });
            else createMutation.mutate(data);
          }}
          onClose={() => { setShowForm(false); setEditingId(null); }}
          loading={createMutation.isPending || updateMutation.isPending}
          error={createMutation.error?.message || updateMutation.error?.message}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId!)}
        title="Delete family member"
        message="This will remove the family member profile. Reminders assigned to them will become unassigned but won't be deleted."
        confirmLabel="Delete"
        danger
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function FamilyForm({ editing, onSubmit, onClose, loading, error }: {
  editing: FamilyMember | null;
  onSubmit: (data: FormData) => void;
  onClose: () => void;
  loading: boolean;
  error?: string;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editing ? {
      display_name: editing.display_name,
      relationship: editing.relationship,
      birth_year: editing.birth_year?.toString() ?? '',
    } : {
      display_name: '',
      relationship: '',
      birth_year: '',
    },
  });

  return (
    <Modal open={true} onClose={onClose} title={editing ? 'Edit family member' : 'Add family member'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <div className="rounded-lg bg-coral-50 px-4 py-3 text-sm text-coral-700">{error}</div>}

        <div>
          <label className="label">Display name</label>
          <input className="input" placeholder="e.g. Aisha" {...register('display_name')} />
          {errors.display_name && <p className="mt-1 text-xs text-coral-600">{errors.display_name.message}</p>}
        </div>

        <div>
          <label className="label">Relationship</label>
          <input className="input" placeholder="e.g. Mother, Son, Spouse" {...register('relationship')} />
          {errors.relationship && <p className="mt-1 text-xs text-coral-600">{errors.relationship.message}</p>}
        </div>

        <div>
          <label className="label">Year of birth (optional)</label>
          <input className="input" placeholder="e.g. 1985" maxLength={4} {...register('birth_year')} />
          {errors.birth_year && <p className="mt-1 text-xs text-coral-600">{errors.birth_year.message}</p>}
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-navy-50 px-4 py-3 text-xs text-navy-500">
          <UserIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
          HealthDesk does not store medical history for family members. Only basic identifying information is kept.
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading && <Spinner className="h-4 w-4" />}
            {editing ? 'Save changes' : 'Add member'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
