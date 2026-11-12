import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User as UserIcon, Mail, LogOut, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { Spinner, Badge } from '@/components/ui';
import type { UserRole } from '@/lib/types';

const schema = z.object({
  display_name: z.string().min(2, 'Enter a name (at least 2 characters)'),
});

type FormData = z.infer<typeof schema>;

const roleLabels: Record<UserRole, string> = {
  member: 'Member',
  editor: 'Editor',
  reviewer: 'Reviewer',
  admin: 'Admin',
};

export function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { display_name: profile?.display_name ?? '' },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase.from('profiles').upsert({ id: user!.id, display_name: data.display_name, email: user!.email }, { onConflict: 'id' });
      if (error) throw error;
    },
    onSuccess: () => {
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Profile</h1>
        <p className="text-sm text-navy-500">Your account information</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-500 text-white">
            <span className="text-2xl font-bold">{profile?.display_name?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-navy-800">{profile?.display_name || 'User'}</h2>
            <p className="text-sm text-navy-500">{user?.email}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <Badge variant="teal">
                <Shield className="h-3 w-3" />
                {roleLabels[(profile?.role as UserRole) ?? 'member'] || 'Member'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="card space-y-4">
        <h3 className="font-semibold text-navy-800">Edit profile</h3>

        <div>
          <label className="label">Display name</label>
          <input className="input" {...register('display_name')} />
          {errors.display_name && <p className="mt-1 text-xs text-coral-600">{errors.display_name.message}</p>}
        </div>

        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
            <input className="input pl-10 bg-cream-100" value={user?.email ?? ''} disabled />
          </div>
          <p className="mt-1 text-xs text-navy-400">Email cannot be changed here</p>
        </div>

        {updateMutation.error && (
          <div className="rounded-lg bg-coral-50 px-4 py-3 text-sm text-coral-700">Could not save changes. Please try again.</div>
        )}
        {saved && (
          <div className="rounded-lg bg-mint-100 px-4 py-3 text-sm text-mint-700">Profile updated successfully.</div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting && <Spinner className="h-4 w-4" />}
            Save changes
          </button>
        </div>
      </form>

      <div className="card">
        <h3 className="mb-3 font-semibold text-navy-800">Account actions</h3>
        <button onClick={handleSignOut} className="btn-danger">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
