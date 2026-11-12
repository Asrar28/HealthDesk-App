import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  Menu,
  X,
  Bell,
  LayoutDashboard,
  CalendarDays,
  Users,
  Building2,
  BookOpen,
  Settings,
  LogOut,
  User as UserIcon,
  Pill,
  CalendarCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useNotifications } from '@/lib/notifications';
import { Toaster } from '@/components/ui';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const { unreadCount = 0 } = useNotifications();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/planner', label: 'Planner', icon: CalendarDays },
    { to: '/family', label: 'Family', icon: Users },
    { to: '/medicines', label: 'Medicines', icon: Pill },
    { to: '/appointments', label: 'Appointments', icon: CalendarCheck },
    { to: '/facilities', label: 'Facilities', icon: Building2 },
    { to: '/library', label: 'Health Library', icon: BookOpen },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Toaster />

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-gray-100/80 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 text-white shadow-sm shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-teal-600 transition-colors">
                HealthDesk
              </span>
              <span className="hidden sm:inline-block ml-2 rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700 uppercase tracking-wide">
                Bhatkal
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 xl:gap-1.5 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-50/80 text-teal-700 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-2">
            <Link
              to="/notifications"
              className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <Link
              to="/settings"
              className="hidden rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition sm:block"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </Link>

            {/* Profile Avatar Pill */}
            <Link
              to="/profile"
              className="hidden items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-2.5 py-1.5 shadow-xs hover:border-gray-200 transition sm:flex"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-800 text-xs font-bold">
                {initial}
              </div>
              <span className="text-xs font-semibold text-slate-800 max-w-[100px] truncate">
                {displayName}
              </span>
            </Link>

            <button
              onClick={handleSignOut}
              className="hidden rounded-xl p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition sm:block"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileOpen && (
          <div className="border-t border-gray-100 bg-white px-4 py-3 lg:hidden shadow-lg animate-slide-down">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                      isActive ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
              <div className="my-2 border-t border-gray-100" />
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <UserIcon className="h-4 w-4" />
                Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-6 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-500 text-white">
              <HeartPulse className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-slate-700">HealthDesk Bhatkal</span>
            <span>— Preventive Family Healthcare</span>
          </div>
          <p>© {new Date().getFullYear()} HealthDesk. For organization and preventive reminders only.</p>
        </div>
      </footer>
    </div>
  );
}
