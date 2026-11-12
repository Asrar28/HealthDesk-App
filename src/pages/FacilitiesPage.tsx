import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Search,
  Phone,
  MapPin,
  Clock,
  ShieldAlert,
  ArrowRight,
  Filter,
  CheckCircle2,
  Stethoscope,
  Pill,
  TestTube,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { BHATKAL_FACILITIES } from '@/lib/bhatkal-facilities';
import type { Facility } from '@/lib/types';

export function FacilitiesPage() {
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredFacilities = useMemo(() => {
    return BHATKAL_FACILITIES.filter((f) => {
      if (filterType !== 'all' && f.type.toLowerCase() !== filterType.toLowerCase()) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const n = f.name.toLowerCase();
        const a = f.area.toLowerCase();
        const addr = f.address.toLowerCase();
        const services = f.services.join(' ').toLowerCase();
        if (!n.includes(q) && !a.includes(q) && !addr.includes(q) && !services.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [filterType, search]);

  const typeIcons: Record<string, typeof Building2> = {
    Hospital: Building2,
    Clinic: Stethoscope,
    Pharmacy: Pill,
    Lab: TestTube,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Healthcare Facilities — Bhatkal
            </h1>
            <span className="rounded-full bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-0.5">
              Karnataka 581320
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Verified local hospitals, polyclinics, diagnostic blood labs, and 24/7 pharmacies across Bhatkal.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'Hospital', 'Clinic', 'Pharmacy', 'Lab'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                filterType === t
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-gray-200 hover:bg-slate-50'
              }`}
            >
              {t === 'all' ? 'All Facilities' : `${t}s`}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-gray-100 flex items-center gap-3">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by facility name, locality (e.g. Shirali, Bunder, College Rd), or service..."
            className="w-full bg-transparent text-xs sm:text-sm text-slate-900 outline-none placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-xs font-semibold text-slate-400 hover:text-slate-600">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredFacilities.map((f) => {
          const IconComp = typeIcons[f.type] || Building2;
          return (
            <div
              key={f.id}
              className="group rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                        f.type === 'Hospital'
                          ? 'bg-teal-50 text-teal-700'
                          : f.type === 'Pharmacy'
                          ? 'bg-emerald-50 text-emerald-700'
                          : f.type === 'Lab'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-sky-50 text-sky-700'
                      }`}
                    >
                      <IconComp className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition">
                        {f.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge
                          variant={
                            f.type === 'Hospital'
                              ? 'teal'
                              : f.type === 'Pharmacy'
                              ? 'mint'
                              : f.type === 'Lab'
                              ? 'navy'
                              : 'blue'
                          }
                        >
                          {f.type}
                        </Badge>
                        {f.emergency && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                            <ShieldAlert className="h-3 w-3 text-rose-500" /> 24/7 Emergency
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Area & Address */}
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1 font-medium">{f.address}</span>
                  </div>
                  {f.timing && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{f.timing}</span>
                    </div>
                  )}
                </div>

                {/* Service pills */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {f.services.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700"
                    >
                      {s}
                    </span>
                  ))}
                  {f.services.length > 4 && (
                    <span className="rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-400">
                      +{f.services.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between gap-3">
                <a
                  href={`tel:${f.phone.replace(/[^0-9+]/g, '')}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-teal-700"
                >
                  <Phone className="h-3.5 w-3.5 text-teal-600" />
                  {f.phone}
                </a>

                <Link
                  to={`/facilities/${f.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-800"
                >
                  View Details <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
