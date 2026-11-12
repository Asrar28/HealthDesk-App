import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Building2, Search, List, Map as MapIcon, Phone, Navigation, X, Filter, Plus, BadgeCheck, Clock, ShieldQuestion } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { canManageFacilities } from '@/lib/permissions';
import { LoadingState, EmptyState, ErrorState, Badge } from '@/components/ui';
import type { Facility, FacilityCategory } from '@/lib/types';

const CATEGORIES: FacilityCategory[] = [
  'Government Hospital', 'PHC', 'CHC', 'Private Hospital', 'Clinic',
  'Diagnostic Lab', 'Pharmacy', 'Blood Bank', 'Specialist', 'Emergency',
];

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const BHATKAL_CENTER: [number, number] = [13.8715, 74.6184];

export function FacilitiesPage() {
  const { profile } = useAuth();
  const [view, setView] = useState<'list' | 'map'>('list');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterService, setFilterService] = useState('');
  const [filterPin, setFilterPin] = useState('');

  const { data: facilities = [], isLoading, error, refetch } = useQuery<Facility[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const { data, error } = await supabase.from('facilities').select('*').order('name');
      if (error) throw error;
      return data as Facility[];
    },
  });

  const allServices = useMemo(() => {
    const svcs = new Set<string>();
    facilities.forEach((f) => f.services.forEach((s) => svcs.add(s)));
    return Array.from(svcs).sort();
  }, [facilities]);

  const filtered = useMemo(() => {
    return facilities.filter((f) => {
      if (search) {
        const q = search.toLowerCase();
        if (!f.name.toLowerCase().includes(q) && !(f.locality ?? '').toLowerCase().includes(q)) return false;
      }
      if (filterCategory !== 'all' && f.category !== filterCategory) return false;
      if (filterService && !f.services.includes(filterService)) return false;
      if (filterPin && f.pincode !== filterPin) return false;
      return true;
    });
  }, [facilities, search, filterCategory, filterService, filterPin]);

  if (isLoading) return <LoadingState message="Loading facilities..." />;
  if (error) return <ErrorState message="Could not load facilities." onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Facility Finder</h1>
          <p className="text-sm text-navy-500">Healthcare facilities in Bhatkal, Karnataka</p>
        </div>
        <div className="flex items-center gap-2">
          {canManageFacilities(profile?.role) && (
            <Link to="/facilities/admin" className="btn-outline">
              <Plus className="h-4 w-4" /> Manage
            </Link>
          )}
          <div className="flex rounded-lg border border-navy-200 bg-white p-1">
            <button onClick={() => setView('list')} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${view === 'list' ? 'bg-teal-50 text-teal-700' : 'text-navy-500'}`}>
              <List className="h-4 w-4" /> List
            </button>
            <button onClick={() => setView('map')} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${view === 'map' ? 'bg-teal-50 text-teal-700' : 'text-navy-500'}`}>
              <MapIcon className="h-4 w-4" /> Map
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
            <input className="input pl-10" placeholder="Search by name or locality..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input" value={filterService} onChange={(e) => setFilterService(e.target.value)}>
            <option value="">All services</option>
            {allServices.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="input" placeholder="PIN code" value={filterPin} onChange={(e) => setFilterPin(e.target.value)} maxLength={6} />
        </div>
        {(search || filterCategory !== 'all' || filterService || filterPin) && (
          <button onClick={() => { setSearch(''); setFilterCategory('all'); setFilterService(''); setFilterPin(''); }} className="mt-3 flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700">
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>

      {facilities.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Building2 className="h-12 w-12" />}
            title="No facilities yet"
            description={canManageFacilities(profile?.role) ? "Add the first healthcare facility to help families find local care." : "Facilities will appear here once an admin adds them."}
            action={canManageFacilities(profile?.role) ? <Link to="/facilities/admin" className="btn-primary"><Plus className="h-4 w-4" /> Add facility</Link> : undefined}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Filter className="h-12 w-12" />} title="No facilities match your filters" description="Try adjusting or clearing your filters." />
        </div>
      ) : view === 'list' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((f) => <FacilityCard key={f.id} facility={f} />)}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="h-[600px] w-full">
            <MapContainer center={BHATKAL_CENTER} zoom={13} className="h-full w-full">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {filtered.filter((f) => f.lat && f.lng).map((f) => (
                <Marker key={f.id} position={[f.lat!, f.lng!]}>
                  <Popup>
                    <div className="min-w-48">
                      <p className="font-semibold">{f.name}</p>
                      <p className="text-xs text-gray-500">{f.category}</p>
                      {f.phone && <p className="text-xs mt-1">{f.phone}</p>}
                      <a href={`/facilities/${f.id}`} className="text-xs text-teal-600 mt-1 inline-block">View details</a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          <div className="flex items-center justify-between border-t border-navy-100 px-4 py-3">
            <p className="text-xs text-navy-400">Showing {filtered.length} facilities · Map data &copy; OpenStreetMap contributors</p>
          </div>
        </div>
      )}
    </div>
  );
}

function FacilityCard({ facility }: { facility: Facility }) {
  const verificationBadge = () => {
    if (facility.verification_status === 'verified') return <Badge variant="mint"><BadgeCheck className="h-3 w-3" /> Verified</Badge>;
    if (facility.verification_status === 'unverified') return <Badge variant="coral"><ShieldQuestion className="h-3 w-3" /> Unverified</Badge>;
    return <Badge variant="amber"><Clock className="h-3 w-3" /> Pending</Badge>;
  };

  return (
    <Link to={`/facilities/${facility.id}`} className="card transition-shadow hover:shadow-card-hover flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-navy-800">{facility.name}</h3>
            <p className="text-xs text-navy-400">{facility.category}</p>
          </div>
        </div>
        {verificationBadge()}
      </div>
      <p className="mt-3 text-sm text-navy-500 line-clamp-2">{facility.address}</p>
      {facility.services.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {facility.services.slice(0, 3).map((s) => <Badge key={s} variant="neutral">{s}</Badge>)}
          {facility.services.length > 3 && <Badge variant="neutral">+{facility.services.length - 3}</Badge>}
        </div>
      )}
      <div className="mt-auto flex items-center gap-2 border-t border-navy-100 pt-3">
        {facility.phone && (
          <a href={`tel:${facility.phone}`} onClick={(e) => e.stopPropagation()} className="btn-ghost text-xs text-teal-600">
            <Phone className="h-3.5 w-3.5" /> Call
          </a>
        )}
        {facility.lat && facility.lng && (
          <a href={`https://www.openstreetmap.org/directions?from=&to=${facility.lat}%2C${facility.lng}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="btn-ghost text-xs">
            <Navigation className="h-3.5 w-3.5" /> Directions
          </a>
        )}
      </div>
    </Link>
  );
}
