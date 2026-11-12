import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  CalendarDays,
  Pill,
  CalendarCheck,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  BookOpen,
} from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Badge, Spinner, showToast } from '@/components/ui';
import type { FamilyMember, Reminder, Medicine, Appointment } from '@/lib/types';

export function DashboardPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';

  // 1. Fetch Family Members
  const { data: familyMembers = [] } = useQuery<FamilyMember[]>({
    queryKey: ['family-members', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return (data || []) as FamilyMember[];
    },
    enabled: !!user?.id,
  });

  // 2. Fetch Reminders
  const { data: reminders = [] } = useQuery<Reminder[]>({
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

  // 3. Fetch Medicines
  const { data: medicines = [] } = useQuery<Medicine[]>({
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

  // 4. Fetch Appointments
  const { data: appointments = [] } = useQuery<Appointment[]>({
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

  // Toggle Reminder completion
  const toggleReminderMutation = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const nextStatus = is_completed ? 'completed' : 'pending';
      const { error } = await supabase
        .from('reminders')
        .update({
          is_completed,
          status: nextStatus,
        })
        .eq('id', id)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', user?.id] });
      showToast({ title: 'Reminder updated', type: 'success' });
    },
    onError: (err: any) => {
      showToast({ title: 'Failed to update reminder', description: err.message, type: 'error' });
    },
  });

  // Family map for member lookup
  const familyMap = useMemo(() => {
    const map = new Map<string, string>();
    familyMembers.forEach((m) => map.set(m.id, m.display_name || m.name));
    return map;
  }, [familyMembers]);

  // Calculations
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const todayReminders = useMemo(() => {
    return reminders.filter((r) => {
      if (!r.due_date && !r.date) return false;
      const dStr = r.due_date || r.date || '';
      return dStr.startsWith(todayStr);
    });
  }, [reminders, todayStr]);

  const activeMedicines = useMemo(() => {
    return medicines.filter((m) => m.is_active);
  }, [medicines]);

  const upcomingAppointments = useMemo(() => {
    return appointments.filter((a) => a.status !== 'cancelled' && a.status !== 'completed');
  }, [appointments]);

  // Recent activity: Combine recent items
  const recentActivities = useMemo(() => {
    const items: Array<{ id: string; title: string; type: 'reminder' | 'medicine' | 'appointment'; date: string }> = [];
    reminders.slice(0, 3).forEach((r) => items.push({ id: r.id, title: r.title, type: 'reminder', date: r.created_at }));
    medicines.slice(0, 2).forEach((m) => items.push({ id: m.id, title: `${m.name} (${m.dosage || 'Dose'})`, type: 'medicine', date: m.created_at }));
    appointments.slice(0, 2).forEach((a) => items.push({ id: a.id, title: a.title, type: 'appointment', date: a.created_at }));
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [reminders, medicines, appointments]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Welcome Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 p-8 sm:p-10 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md mb-4 border border-white/20">
            <Sparkles className="h-3.5 w-3.5 text-emerald-200" />
            <span>Family Preventive Care Hub</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {greeting}, {displayName}!
          </h1>
          <p className="mt-2 text-teal-50 text-sm sm:text-base leading-relaxed">
            Today is <strong className="font-semibold text-white">{format(new Date(), 'EEEE, d MMMM yyyy')}</strong>. Keep your family's health on track with preventive checkups and timely medications.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/planner"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-teal-800 shadow-md hover:bg-teal-50 transition"
            >
              <Plus className="h-4 w-4" /> Add Reminder
            </Link>
            <Link
              to="/medicines"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-800/60 hover:bg-teal-800/80 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white border border-teal-400/30 transition backdrop-blur-sm"
            >
              <Pill className="h-4 w-4" /> Add Medicine
            </Link>
          </div>
        </div>

        {/* Subtle decorative circles */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 -mb-10 h-48 w-48 rounded-full bg-emerald-400/20 blur-xl pointer-events-none" />
      </div>

      {/* 2. 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Family Members */}
        <Link
          to="/family"
          className="group rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-slate-500">Family Members</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{familyMembers.length}</span>
            <span className="text-xs text-slate-400 font-medium">registered</span>
          </div>
        </Link>

        {/* Today's Reminders */}
        <Link
          to="/planner"
          className="group rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-amber-200 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-slate-500">Today's Reminders</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{todayReminders.length}</span>
            <span className="text-xs text-slate-400 font-medium">due today</span>
          </div>
        </Link>

        {/* Active Medicines */}
        <Link
          to="/medicines"
          className="group rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-slate-500">Active Medicines</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <Pill className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{activeMedicines.length}</span>
            <span className="text-xs text-slate-400 font-medium">ongoing courses</span>
          </div>
        </Link>

        {/* Upcoming Appointments */}
        <Link
          to="/appointments"
          className="group rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-sky-200 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-slate-500">Appointments</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 group-hover:scale-110 transition-transform">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{upcomingAppointments.length}</span>
            <span className="text-xs text-slate-400 font-medium">scheduled</span>
          </div>
        </Link>
      </div>

      {/* 3. Quick Actions */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Link
            to="/planner"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200/80 bg-slate-50/50 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-900 transition group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-xs sm:text-sm font-bold text-slate-800">Add Reminder</p>
              <p className="text-[11px] text-slate-500">Checkup / Vaccine</p>
            </div>
          </Link>

          <Link
            to="/medicines"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200/80 bg-slate-50/50 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-900 transition group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Pill className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-xs sm:text-sm font-bold text-slate-800">Add Medicine</p>
              <p className="text-[11px] text-slate-500">Dosage & timing</p>
            </div>
          </Link>

          <Link
            to="/appointments"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200/80 bg-slate-50/50 hover:bg-sky-50 hover:border-sky-200 hover:text-sky-900 transition group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition">
              <CalendarCheck className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-xs sm:text-sm font-bold text-slate-800">Add Appointment</p>
              <p className="text-[11px] text-slate-500">Doctor consultation</p>
            </div>
          </Link>

          <Link
            to="/family"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200/80 bg-slate-50/50 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-900 transition group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition">
              <Users className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-xs sm:text-sm font-bold text-slate-800">Add Member</p>
              <p className="text-[11px] text-slate-500">Family profile</p>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. Two-Column Layout: Today's Schedule + Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        
        {/* Left: Today's Schedule */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">Today's Schedule</h2>
            </div>
            <Link to="/planner" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {todayReminders.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center text-slate-400">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No reminders for today</p>
                <p className="text-xs text-slate-400 mt-1">You're completely caught up with today's tasks.</p>
                <Link to="/planner" className="mt-4 btn-primary text-xs py-2 px-3">
                  <Plus className="h-3.5 w-3.5" /> Create a reminder
                </Link>
              </div>
            ) : (
              todayReminders.map((r) => {
                const memberName = r.family_member_id ? familyMap.get(r.family_member_id) : 'All Members';
                return (
                  <div
                    key={r.id}
                    className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border transition ${
                      r.is_completed
                        ? 'bg-slate-50/70 border-gray-100 opacity-60'
                        : 'bg-white border-gray-100 hover:border-teal-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleReminderMutation.mutate({ id: r.id, is_completed: !r.is_completed })}
                        disabled={toggleReminderMutation.isPending}
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                          r.is_completed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 hover:border-teal-500'
                        }`}
                      >
                        {r.is_completed && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>
                      <div>
                        <p className={`text-sm font-bold ${r.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {r.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="font-medium text-slate-600">{memberName}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {r.due_time || r.time || 'All day'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={r.is_completed ? 'neutral' : 'teal'}>
                      {r.category || 'General'}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Upcoming Appointments */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-sky-600" />
              <h2 className="text-base font-bold text-slate-900">Upcoming Appointments</h2>
            </div>
            <Link to="/appointments" className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {upcomingAppointments.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center text-slate-400">
                <CalendarCheck className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No scheduled appointments</p>
                <p className="text-xs text-slate-400 mt-1">Book doctor visits or consultations here.</p>
                <Link to="/appointments" className="mt-4 btn-outline text-xs py-2 px-3">
                  <Plus className="h-3.5 w-3.5" /> Schedule appointment
                </Link>
              </div>
            ) : (
              upcomingAppointments.slice(0, 4).map((a) => {
                const memberName = a.family_member_id ? familyMap.get(a.family_member_id) : 'All Members';
                return (
                  <div key={a.id} className="p-3.5 rounded-xl border border-gray-100 hover:border-sky-200 transition bg-white flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{a.title}</p>
                      <p className="text-xs font-medium text-sky-700 mt-0.5">
                        {a.doctor_name ? `Dr. ${a.doctor_name}` : 'Doctor consultation'}
                        {a.hospital ? ` • ${a.hospital}` : ''}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-semibold text-slate-600">{memberName}</span>
                        <span>•</span>
                        <span>{a.date || a.due_date || 'TBD'}</span>
                        {a.time && <span>at {a.time}</span>}
                      </div>
                    </div>
                    <Badge variant={a.status === 'upcoming' ? 'blue' : a.status === 'completed' ? 'mint' : 'neutral'}>
                      {a.status || 'Upcoming'}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. Health Resources Cards (Facilities + Library Highlights) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bhatkal Facilities Spotlight */}
        <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/50 to-emerald-50/30 p-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Bhatkal Healthcare Facilities</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Find verified local hospitals, diagnostic centers, 24/7 pharmacies and clinics across Bhatkal with phone numbers and timings.
            </p>
            <Link to="/facilities" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800">
              Browse Bhatkal Directory <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Health Library Spotlight */}
        <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/50 to-indigo-50/30 p-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Family Health Library</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Read curated, evidence-based preventive health guides on nutrition, diabetes control, blood pressure, and children's vaccination.
            </p>
            <Link to="/library" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-800">
              Read Health Articles <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
