import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Phone,
  MapPin,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Stethoscope,
  Pill,
  TestTube,
  Share2,
} from 'lucide-react';
import { Badge, showToast } from '@/components/ui';
import { BHATKAL_FACILITIES } from '@/lib/bhatkal-facilities';

export function FacilityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const facility = BHATKAL_FACILITIES.find((f) => f.id === id);

  if (!facility) {
    return (
      <div className="py-16 text-center max-w-md mx-auto animate-fade-in">
        <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Facility Not Found</h2>
        <p className="mt-1 text-sm text-slate-500">
          The requested healthcare facility could not be located in the Bhatkal directory.
        </p>
        <button onClick={() => navigate('/facilities')} className="btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" /> Back to Directory
        </button>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast({ title: 'Link copied to clipboard', type: 'success' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/facilities')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Facilities Directory
        </button>
      </div>

      {/* Main Detail Card */}
      <div className="rounded-3xl bg-white p-6 sm:p-10 shadow-sm border border-gray-100 space-y-8">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <Badge variant="teal">{facility.type}</Badge>
              {facility.emergency && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-500" /> 24/7 Emergency & Casualty
                </span>
              )}
              <span className="text-xs font-semibold text-slate-400">Bhatkal, Karnataka</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {facility.name}
            </h1>
            <p className="mt-2 text-sm text-slate-600 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-teal-600 shrink-0" />
              {facility.address}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="btn-outline p-2.5"
              title="Share Facility"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <a
              href={`tel:${facility.phone.replace(/[^0-9+]/g, '')}`}
              className="btn-primary"
            >
              <Phone className="h-4 w-4" /> Call Now
            </a>
          </div>
        </div>

        {/* Overview & Timing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">About this facility</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              {facility.description || 'Verified local provider catering to outpatient and emergency needs in Bhatkal.'}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5 space-y-3 border border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-teal-600" /> Operating Hours
            </h3>
            <p className="text-sm font-bold text-slate-800">
              {facility.timing || 'Regular Outpatient Hours'}
            </p>
            <div className="pt-2 border-t border-gray-200/60">
              <p className="text-xs text-slate-500">Contact Number:</p>
              <a
                href={`tel:${facility.phone.replace(/[^0-9+]/g, '')}`}
                className="text-sm font-extrabold text-teal-700 hover:underline"
              >
                {facility.phone}
              </a>
            </div>
          </div>
        </div>

        {/* Services & Specialities */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h2 className="text-base font-bold text-slate-900">Available Services & Specialities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {facility.services.map((svc) => (
              <div
                key={svc}
                className="flex items-center gap-3 p-3 rounded-xl bg-teal-50/40 border border-teal-100 text-slate-800 text-xs sm:text-sm font-semibold"
              >
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>{svc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick action bar to book appointment */}
        <div className="rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 p-6 border border-teal-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-teal-900">Need to schedule a visit here?</h3>
            <p className="text-xs text-teal-700 mt-0.5">
              Add a consultation reminder on HealthDesk so you don't miss your appointment.
            </p>
          </div>
          <Link to="/appointments" className="btn-primary shrink-0 text-xs py-2 px-4">
            Schedule on App
          </Link>
        </div>
      </div>
    </div>
  );
}
