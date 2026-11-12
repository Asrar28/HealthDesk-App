import { useEffect, useState } from 'react';
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
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileRole, setProfileRole] = useState<UserRole>('member');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { display_name: '' },
  });

  // Fetch profile DIRECTLY from Supabase - don't rely on useAuth
  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('full_name, role').eq('id', user.id).single().then(({ data }) => {
      if (data) {
        setProfileName(data.full_name || '');
        setProfileRole((data.role as UserRole) || 'member');
        reset({ display_name: data.full_name || '' });
      }
    });
  }, [user?.id, reset]);

  const displayName = profileName || 'User';

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
  const cleanName = data.display_name.trim();

  // 1. Save to profiles table
  const { error } = await supabase.from('profiles').upsert({
    id: user!.id,
    email: user!.email,
    full_name: cleanName,
  }, { onConflict: 'id' });
  if (error) throw error;

  // 2. Save to auth metadata - Dashboard reads this
  await supabase.auth.updateUser({
    data: { full_name: cleanName, display_name: cleanName }
  });
},
    onSuccess: async (_, data) => {
      await refreshProfile();
      setSaved(true);
      setProfileName(data.display_name);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="space-y-6">
      <div className="card flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-500 text-white">
          <UserIcon className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-navy-800">{displayName}</h2>
          <p className="text-sm text-navy-500">{user?.email}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge>
              <Shield className="h-3 w-3" />
              {roleLabels[profileRole]}
            </Badge>
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
          <div className="rounded-lg bg-coral-50 px-4 py-3 text-sm text-coral-700">{updateMutation.error.message}</div>
        )}
        {saved && (
          <div className="rounded-lg bg-mint-100 px-4 py-3 text-sm text-mint-700">Profile updated successfully</div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting && <Spinner />}
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
