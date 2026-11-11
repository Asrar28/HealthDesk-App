import { Link } from 'react-router-dom';
import { HeartPulse, CalendarCheck, Users, Building2, BookOpen, Bell, ShieldCheck, ArrowRight, Stethoscope, MapPin, Phone } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Nav */}
      <header className="absolute top-0 left-0 right-0 z-20">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-navy-800">HealthDesk</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-800 pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-navy-800 to-teal-900" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-mint-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-slide-up">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-mint-200">
                <MapPin className="h-4 w-4" />
                Built for Bhatkal, Karnataka
              </div>
              <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                Your family's health,
                <span className="block text-mint-300">better connected.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-navy-100">
                Plan preventive checkups, track vaccinations, manage health reminders, find local
                healthcare facilities, and read trusted health articles — all in one place.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/register" className="btn-primary bg-teal-500 px-6 py-3 text-base hover:bg-teal-400">
                  Get started free
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link to="/login" className="btn-outline border-white/20 bg-transparent text-white hover:bg-white/10 hover:border-white/30">
                  I already have an account
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-navy-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-mint-300" />
                  Private & secure
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-mint-300" />
                  For the whole family
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="rounded-2xl bg-white/5 p-6 backdrop-blur">
                <div className="rounded-xl bg-white p-6 shadow-elevated">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-navy-800">Today's Health Plan</h3>
                    <span className="badge bg-teal-50 text-teal-700">3 reminders</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { icon: Stethoscope, title: 'Annual checkup', person: 'Aisha', time: '10:00 AM', color: 'teal' },
                      { icon: HeartPulse, title: 'BP screening', person: 'Ibrahim', time: '2:30 PM', color: 'amber' },
                      { icon: CalendarCheck, title: 'Vaccination', person: 'Zara', time: 'Tomorrow', color: 'mint' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-navy-100 p-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${item.color}-50 text-${item.color}-600`}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-navy-800">{item.title}</p>
                          <p className="text-xs text-navy-400">{item.person} · {item.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-navy-800 sm:text-4xl">Everything your family needs to stay healthy</h2>
          <p className="mt-4 text-lg text-navy-500">Organise, plan, and stay on top of your family's preventive health — together.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: CalendarCheck, title: 'Preventive Planner', desc: 'Create recurring checkup reminders with lead times. Track vaccinations, dental visits, eye exams, and more — with calendar and list views.' },
            { icon: Users, title: 'Family Management', desc: 'Add family member profiles with names, relationships, and avatars. Each reminder links to the right person.' },
            { icon: Building2, title: 'Facility Finder', desc: 'Search healthcare facilities in Bhatkal by category, services, or PIN code. Call or get directions directly from the map.' },
            { icon: BookOpen, title: 'Health Library', desc: 'Browse reviewed health articles on diabetes, heart health, nutrition, vaccinations, and more. Bookmark for later.' },
            { icon: Bell, title: 'Notifications', desc: 'Get in-app reminders for upcoming checkups, overdue items, and new articles. Never miss a health appointment again.' },
            { icon: ShieldCheck, title: 'Privacy First', desc: 'Your family's health data is private to you. Only you can see your reminders and family profiles.' },
          ].map((f, i) => (
            <div key={i} className="card transition-shadow hover:shadow-card-hover">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-navy-800">{f.title}</h3>
              <p className="text-sm leading-relaxed text-navy-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-mint-100 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-mint-200 bg-white/80 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-navy-800">Important Health Disclaimer</h3>
            <p className="max-w-2xl text-sm leading-relaxed text-navy-600">
              HealthDesk provides general health education and organisational tools. It does not
              diagnose conditions, prescribe treatment, or replace advice from a qualified healthcare
              professional. Always consult a registered medical practitioner for health concerns.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy-800 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Ready to take charge of your family's health?</h2>
          <p className="mt-4 text-lg text-navy-200">Join HealthDesk today. It's free to get started.</p>
          <Link to="/register" className="btn-primary mt-8 bg-teal-500 px-8 py-3 text-base hover:bg-teal-400">
            Create your account
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-900 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-500">
                <HeartPulse className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">HealthDesk</span>
            </div>
            <p className="text-xs text-navy-300">
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
