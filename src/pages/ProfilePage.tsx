import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Mail, Shield, LogOut } from 'lucide-react';

type FormData = { display_name: string };
type UserRole = 'member' | 'admin' | 'doctor';

const roleLabels: Record<UserRole, string> = {
  member: 'Member',
  admin: 'Admin',
  doctor: 'Doctor',
};

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [localProfile, setLocalProfile] = useState<{ full_name: string | null; role: string | null } | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { display_name: '' },
  });

  // Fetch profile DIRECTLY, don't wait for useAuth
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setLocalProfile(data);
        reset({ display_name: data.full_name ?? '' });
      }
    });
  }, [user, reset]);

  const profile = localProfile;
  const displayName = profile?.full_name || 'User';

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user!.id, full_name: data.display_name, email: user!.email }, { onConflict: 'id' });
      if (error) throw error;
    },
    onSuccess: async () => {
      setSaved(true);
      const { data } = await supabase.from('profiles').select('full_name, role').eq('id', user!.id).maybeSingle();
      if (data) {
        setLocalProfile(data);
        reset({ display_name: data.full_name ?? '' });
      }
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const handleSignOut = async () => { await signOut(); };

  return (
    <div className="space-y-6">
      <div className="card flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-500 text-white">
          <span className="text-2xl font-bold">{displayName.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-navy-800">{displayName}</h2>
          <p className="text-sm text-navy-500">{user?.email}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge variant="teal">
              <Shield className="h-3 w-3" />
              {roleLabels[(profile?.role as UserRole) ?? 'member'] || 'Member'}
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
