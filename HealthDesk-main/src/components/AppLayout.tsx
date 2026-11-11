import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { HeartPulse, Menu, X, Bell, LayoutDashboard, CalendarDays, Users, Building2, BookOpen, Settings, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useNotifications } from '@/lib/notifications';
import { canManageFacilities, canEditArticles } from '@/lib/permissions';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/planner', label: 'Planner', icon: CalendarDays },
    { to: '/family', label: 'Family', icon: Users },
    { to: '/facilities', label: 'Facilities', icon: Building2 },
    { to: '/library', label: 'Health Library', icon: BookOpen },
  ];

  const adminItems: { to: string; label: string; icon: typeof Building2 }[] = [];
  if (canManageFacilities(profile?.role)) {
    adminItems.push({ to: '/facilities/admin', label: 'Manage Facilities', icon: Building2 });
  }
  if (canEditArticles(profile?.role)) {
    adminItems.push({ to: '/library/editor', label: 'Editor Dashboard', icon: BookOpen });
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <header className="sticky top-0 z-40 border-b border-navy-100/60 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-navy-800">HealthDesk</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-teal-50 text-teal-700' : 'text-navy-600 hover:bg-navy-50 hover:text-navy-800'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/notifications"
              className="relative rounded-lg p-2.5 text-navy-600 hover:bg-navy-50 hover:text-navy-800"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link
              to="/settings"
              className="hidden rounded-lg p-2.5 text-navy-600 hover:bg-navy-50 hover:text-navy-800 sm:block"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </Link>
            <div className="hidden items-center gap-2 rounded-lg px-3 py-1.5 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 text-sm font-semibold text-navy-700">
                {profile?.display_name?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden xl:block">
                <p className="text-sm font-medium text-navy-800">{profile?.display_name || 'User'}</p>
                <p className="text-xs text-navy-400">{profile?.role}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="hidden rounded-lg p-2.5 text-navy-600 hover:bg-navy-50 hover:text-navy-800 sm:block"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2.5 text-navy-600 hover:bg-navy-50 lg:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-navy-100 bg-white px-4 py-3 lg:hidden">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive ? 'bg-teal-50 text-teal-700' : 'text-navy-600 hover:bg-navy-50'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
              {adminItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive ? 'bg-teal-50 text-teal-700' : 'text-navy-600 hover:bg-navy-50'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
              <div className="my-1 border-t border-navy-100" />
              <Link
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-600 hover:bg-navy-50"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-600 hover:bg-navy-50"
              >
                <UserIcon className="h-4 w-4" />
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-coral-600 hover:bg-coral-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>

      <footer className="border-t border-navy-100/60 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-500">
                <HeartPulse className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-navy-700">HealthDesk</span>
              <span className="text-sm text-navy-400">· Bhatkal, Karnataka</span>
            </div>
            <p className="max-w-2xl text-xs text-navy-400">
              HealthDesk provides general health education and organisational tools. It does not
              diagnose conditions, prescribe treatment, or replace advice from a qualified healthcare
              professional.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
