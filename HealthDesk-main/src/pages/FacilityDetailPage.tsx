import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  ArrowLeft, Building2, Phone, Navigation, Globe, MapPin, Clock, AlertCircle,
  BadgeCheck, ShieldQuestion, Tag, ChevronLeft, Trash2, Pencil, Plus,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { canManageFacilities } from '@/lib/permissions';
import { LoadingState, ErrorState, Badge, EmptyState } from '@/components/ui';
import type { Facility } from '@/lib/types';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export function FacilityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: facility, isLoading, error } = useQuery<Facility>({
    queryKey: ['facility', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('facilities').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Not found');
      return data as Facility;
    },
    enabled: !!id,
  });

  const verifyMutation = useMutation({
    mutationFn: async (status: 'verified' | 'unverified' | 'pending') => {
      const { error } = await supabase.rpc('admin_verify_facility', {
        p_facility_id: id!,
        p_status: status,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['facility', id] }),
  });

  if (isLoading) return <LoadingState message="Loading facility..." />;
  if (error || !facility) return <ErrorState message="Could not load this facility." onRetry={() => navigate('/facilities')} />;

  const isAdmin = canManageFacilities(profile?.role);

  return (
    <div className="space-y-6">
      <Link to="/facilities" className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700">
        <ChevronLeft className="h-4 w-4" /> Back to facilities
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <Building2 className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-navy-800">{facility.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="teal">{facility.category}</Badge>
                  {facility.verification_status === 'verified' && <Badge variant="mint"><BadgeCheck className="h-3 w-3" /> Verified</Badge>}
                  {facility.verification_status === 'unverified' && <Badge variant="coral"><ShieldQuestion className="h-3 w-3" /> Unverified</Badge>}
                  {facility.verification_status === 'pending' && <Badge variant="amber"><Clock className="h-3 w-3" /> Pending</Badge>}
                </div>
              </div>
            </div>

            {facility.emergency_info && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-coral-50 px-4 py-3 text-sm text-coral-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{facility.emergency_info}</span>
              </div>
            )}
          </div>

          {/* Address */}
          <div className="card">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-navy-800">
              <MapPin className="h-5 w-5 text-teal-600" /> Address
            </h3>
            <p className="text-sm text-navy-600">{facility.address}</p>
            <p className="mt-1 text-sm text-navy-500">
              {[facility.locality, facility.city, facility.district, facility.state, facility.pincode].filter(Boolean).join(', ')}
            </p>
          </div>

          {/* Services */}
          {facility.services.length > 0 && (
            <div className="card">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-navy-800">
                <Tag className="h-5 w-5 text-teal-600" /> Services
              </h3>
              <div className="flex flex-wrap gap-2">
                {facility.services.map((s) => <Badge key={s} variant="neutral">{s}</Badge>)}
              </div>
            </div>
          )}

          {/* Opening hours */}
          {facility.opening_hours && Object.keys(facility.opening_hours).length > 0 && (
            <div className="card">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-navy-800">
                <Clock className="h-5 w-5 text-teal-600" /> Opening hours
              </h3>
              <div className="space-y-1.5">
                {Object.entries(facility.opening_hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="text-navy-500 capitalize">{day}</span>
                    <span className="font-medium text-navy-700">{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="mb-3 font-semibold text-navy-800">Contact & directions</h3>
            <div className="space-y-2">
              {facility.phone && (
                <a href={`tel:${facility.phone}`} className="btn-primary w-full">
                  <Phone className="h-4 w-4" /> {facility.phone}
                </a>
              )}
              {facility.website && (
                <a href={facility.website} target="_blank" rel="noopener noreferrer" className="btn-outline w-full">
                  <Globe className="h-4 w-4" /> Visit website
                </a>
              )}
              {facility.lat && facility.lng && (
                <a href={`https://www.openstreetmap.org/directions?from=&to=${facility.lat}%2C${facility.lng}`} target="_blank" rel="noopener noreferrer" className="btn-outline w-full">
                  <Navigation className="h-4 w-4" /> Get directions
                </a>
              )}
            </div>

            {facility.source && (
              <p className="mt-3 text-xs text-navy-400">Source: {facility.source}</p>
            )}
            {facility.last_verified && (
              <p className="text-xs text-navy-400">Last verified: {new Date(facility.last_verified).toLocaleDateString()}</p>
            )}
          </div>

          {isAdmin && (
            <div className="card">
              <h3 className="mb-3 font-semibold text-navy-800">Admin actions</h3>
              <div className="space-y-2">
                <button onClick={() => verifyMutation.mutate('verified')} disabled={verifyMutation.isPending} className="btn-outline w-full text-mint-700">
                  <BadgeCheck className="h-4 w-4" /> Mark verified
                </button>
                <button onClick={() => verifyMutation.mutate('unverified')} disabled={verifyMutation.isPending} className="btn-outline w-full text-coral-600">
                  <ShieldQuestion className="h-4 w-4" /> Mark unverified
                </button>
                {verifyMutation.error && <p className="text-xs text-coral-600">Could not update verification status.</p>}
              </div>
            </div>
          )}

          {facility.lat && facility.lng && (
            <div className="card overflow-hidden p-0">
              <div className="h-64 w-full">
                <MapContainer center={[facility.lat, facility.lng]} zoom={15} className="h-full w-full">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  <Marker position={[facility.lat, facility.lng]}>
                    <Popup>{facility.name}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
