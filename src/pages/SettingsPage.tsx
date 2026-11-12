import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Shield, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { LoadingState, ErrorState, Spinner } from '@/components/ui';
import type { UserSettings } from '@/lib/types';

export function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [formState, setFormState] = useState<UserSettings | null>(null);

  const { data: settings, isLoading, error } = useQuery<UserSettings>({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_settings').select('*').eq('id', user!.id).maybeSingle();
      if (error) throw error;
      if (!data) {
        const { data: created, error: insertError } = await supabase.from('user_settings').insert({
          id: user!.id,
        }).select().single();
        if (insertError) throw insertError;
        return created as UserSettings;
      }
      return data as UserSettings;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (settings) setFormState(settings);
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      const { error } = await supabase.from('user_settings').update(updates).eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const toggle = (key: keyof UserSettings) => {
    if (!formState) return;
    const newValue = !formState[key];
    setFormState({ ...formState, [key]: newValue });
    updateMutation.mutate({ [key]: newValue } as Partial<UserSettings>);
  };

  if (isLoading) return <LoadingState message="Loading settings..." />;
  if (error) return <ErrorState message="Could not load your settings." />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Settings</h1>
        <p className="text-sm text-navy-500">Manage your notification and privacy preferences</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-mint-100 px-4 py-3 text-sm text-mint-700 animate-fade-in">
          <Check className="h-4 w-4" /> Settings saved
        </div>
      )}

      {/* Notification Preferences */}
      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-teal-600" />
          <h3 className="font-semibold text-navy-800">Notification preferences</h3>
        </div>
        <div className="space-y-4">
          <ToggleRow
            title="Reminder notifications"
            description="Get notified about upcoming health reminders"
            checked={formState?.notify_reminders ?? false}
            onChange={() => toggle('notify_reminders')}
          />
          <ToggleRow
            title="Overdue alerts"
            description="Get alerted when reminders become overdue"
            checked={formState?.notify_overdue ?? false}
            onChange={() => toggle('notify_overdue')}
          />
          <ToggleRow
            title="New article alerts"
            description="Get notified when new health articles are published"
            checked={formState?.notify_articles ?? false}
            onChange={() => toggle('notify_articles')}
          />
          <ToggleRow
            title="Push notifications"
            description="Receive push notifications on this device (requires browser permission)"
            checked={formState?.push_enabled ?? false}
            onChange={() => toggle('push_enabled')}
          />
        </div>
        {updateMutation.isPending && <div className="mt-3 flex items-center gap-2 text-xs text-navy-400"><Spinner className="h-3 w-3" /> Saving...</div>}
      </div>

      {/* Privacy */}
      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-teal-600" />
          <h3 className="font-semibold text-navy-800">Privacy</h3>
        </div>
        <div className="space-y-4">
          <ToggleRow
            title="Privacy consent"
            description="I consent to HealthDesk storing my family's health reminder data to provide organisational tools. My data is private and only visible to me."
            checked={formState?.privacy_consent ?? false}
            onChange={() => toggle('privacy_consent')}
          />
        </div>
      </div>

      <div className="card bg-navy-50 border-navy-100">
        <p className="text-xs leading-relaxed text-navy-500">
          HealthDesk provides general health education and organisational tools. It does not
          diagnose conditions, prescribe treatment, or replace advice from a qualified healthcare
          professional. Your data is stored securely and is only accessible to you.
        </p>
      </div>
    </div>
  );
}

function ToggleRow({ title, description, checked, onChange }: {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-navy-800">{title}</p>
        <p className="text-xs text-navy-500">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative flex-shrink-0 h-6 w-11 rounded-full transition-colors ${checked ? 'bg-teal-500' : 'bg-navy-200'}`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
