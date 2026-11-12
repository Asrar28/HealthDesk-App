import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Building2, Plus, Upload, Download, Trash2, Pencil, FileSpreadsheet, X, Check, AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingState, EmptyState, ErrorState, Badge, Modal, ConfirmDialog, Spinner } from '@/components/ui';
import type { Facility, FacilityCategory } from '@/lib/types';

const CATEGORIES: FacilityCategory[] = [
  'Government Hospital', 'PHC', 'CHC', 'Private Hospital', 'Clinic',
  'Diagnostic Lab', 'Pharmacy', 'Blood Bank', 'Specialist', 'Emergency',
];

const SAMPLE_CSV = `name,category,address,locality,city,district,state,pincode,phone,website,lat,lng,services,emergency_info,verification_status,source
Sample PHC,PHC,Main Road Bhatkal,Bhatkal,Uttara Kannada,Karnataka,581320,9999999999,,13.8715,74.6184,OPD;Vaccination;First Aid,,pending,Manual entry`;

export function FacilityAdminPage() {
  const [tab, setTab] = useState<'list' | 'add' | 'import'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Manage Facilities</h1>
        <p className="text-sm text-navy-500">Add, edit, and verify healthcare facilities</p>
      </div>

      <div className="flex gap-1 rounded-lg border border-navy-200 bg-white p-1 w-fit">
        <button onClick={() => setTab('list')} className={`rounded-md px-4 py-2 text-sm font-medium ${tab === 'list' ? 'bg-teal-50 text-teal-700' : 'text-navy-500'}`}>All facilities</button>
        <button onClick={() => { setTab('add'); setEditingId(null); }} className={`rounded-md px-4 py-2 text-sm font-medium ${tab === 'add' ? 'bg-teal-50 text-teal-700' : 'text-navy-500'}`}>Add single</button>
        <button onClick={() => setTab('import')} className={`rounded-md px-4 py-2 text-sm font-medium ${tab === 'import' ? 'bg-teal-50 text-teal-700' : 'text-navy-500'}`}>CSV import</button>
      </div>

      {tab === 'list' && <FacilityList editingId={editingId} setEditingId={setEditingId} setDeleteId={setDeleteId} setTab={setTab} />}
      {tab === 'add' && <FacilityForm editingId={editingId} onClose={() => { setTab('list'); setEditingId(null); }} />}
      {tab === 'import' && <CSVImport onDone={() => setTab('list')} />}

      <ConfirmDialogWrap deleteId={deleteId} setDeleteId={setDeleteId} />
    </div>
  );
}

function FacilityList({ editingId, setEditingId, setDeleteId, setTab }: {
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  setDeleteId: (id: string | null) => void;
  setTab: (t: 'list' | 'add' | 'import') => void;
}) {
  const queryClient = useQueryClient();
  const { data: facilities = [], isLoading, error, refetch } = useQuery<Facility[]>({
    queryKey: ['facilities', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase.from('facilities').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Facility[];
    },
  });

  if (isLoading) return <LoadingState message="Loading facilities..." />;
  if (error) return <ErrorState message="Could not load facilities." onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-navy-500">{facilities.length} facilities total</p>
        <button onClick={() => { setEditingId(null); setTab('add'); }} className="btn-primary">
          <Plus className="h-4 w-4" /> Add facility
        </button>
      </div>

      {facilities.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Building2 className="h-12 w-12" />} title="No facilities yet" description="Add facilities one at a time or import via CSV." action={<button onClick={() => setTab('add')} className="btn-primary"><Plus className="h-4 w-4" /> Add facility</button>} />
        </div>
      ) : (
        <div className="space-y-2">
          {facilities.map((f) => (
            <div key={f.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-navy-800 truncate">{f.name}</p>
                  <p className="text-xs text-navy-400">{f.category} · {f.pincode ?? 'No PIN'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {f.verification_status === 'verified' && <Badge variant="mint">Verified</Badge>}
                {f.verification_status === 'pending' && <Badge variant="amber">Pending</Badge>}
                {f.verification_status === 'unverified' && <Badge variant="coral">Unverified</Badge>}
                <button onClick={() => { setEditingId(f.id); setTab('add'); }} className="btn-ghost text-xs"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => setDeleteId(f.id)} className="btn-ghost text-coral-600 text-xs"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FacilityForm({ editingId, onClose }: { editingId: string | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: existing } = useQuery<Facility | null>({
    queryKey: ['facility', editingId],
    queryFn: async () => {
      if (!editingId) return null;
      const { data, error } = await supabase.from('facilities').select('*').eq('id', editingId).maybeSingle();
      if (error) throw error;
      return data as Facility | null;
    },
    enabled: !!editingId,
  });

  const [formState, setFormState] = useState({
    name: existing?.name ?? '',
    category: existing?.category ?? ('Government Hospital' as FacilityCategory),
    address: existing?.address ?? '',
    locality: existing?.locality ?? '',
    city: existing?.city ?? 'Bhatkal',
    district: existing?.district ?? 'Uttara Kannada',
    state: existing?.state ?? 'Karnataka',
    pincode: existing?.pincode ?? '',
    phone: existing?.phone ?? '',
    website: existing?.website ?? '',
    lat: existing?.lat?.toString() ?? '',
    lng: existing?.lng?.toString() ?? '',
    services: existing?.services.join('; ') ?? '',
    emergency_info: existing?.emergency_info ?? '',
    verification_status: existing?.verification_status ?? ('pending' as const),
    source: existing?.source ?? '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      setError('');
      const payload = {
        name: formState.name,
        category: formState.category,
        address: formState.address,
        locality: formState.locality || null,
        city: formState.city || null,
        district: formState.district || null,
        state: formState.state || null,
        pincode: formState.pincode || null,
        phone: formState.phone || null,
        website: formState.website || null,
        lat: formState.lat ? parseFloat(formState.lat) : null,
        lng: formState.lng ? parseFloat(formState.lng) : null,
        services: formState.services.split(';').map((s) => s.trim()).filter(Boolean),
        emergency_info: formState.emergency_info || null,
        verification_status: formState.verification_status,
        source: formState.source || null,
      };

      if (editingId) {
        const { error } = await supabase.rpc('admin_update_facility', {
          p_facility_id: editingId,
          p_data: payload,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('admin_insert_facility', { p_data: payload });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    },
    onError: (err: { message?: string }) => {
      setError(err.message ?? 'Could not save facility');
    },
    onSettled: () => setLoading(false),
  });

  const handleChange = (key: string, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const valid = formState.name.trim() && formState.address.trim();

  return (
    <div className="card max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-navy-800">{editingId ? 'Edit facility' : 'Add facility'}</h3>
        <button onClick={onClose} className="btn-ghost"><X className="h-4 w-4" /></button>
      </div>

      {error && <div className="flex items-center gap-2 rounded-lg bg-coral-50 px-4 py-3 text-sm text-coral-700"><AlertCircle className="h-4 w-4" />{error}</div>}
      {success && <div className="flex items-center gap-2 rounded-lg bg-mint-100 px-4 py-3 text-sm text-mint-700"><Check className="h-4 w-4" />Saved successfully</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Name *</label>
          <input className="input" value={formState.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="e.g. Bhatkal Community Health Centre" />
        </div>
        <div>
          <label className="label">Category *</label>
          <select className="input" value={formState.category} onChange={(e) => handleChange('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Verification status</label>
          <select className="input" value={formState.verification_status} onChange={(e) => handleChange('verification_status', e.target.value)}>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Address *</label>
          <input className="input" value={formState.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="Street address" />
        </div>
        <div><label className="label">Locality</label><input className="input" value={formState.locality} onChange={(e) => handleChange('locality', e.target.value)} /></div>
        <div><label className="label">City</label><input className="input" value={formState.city} onChange={(e) => handleChange('city', e.target.value)} /></div>
        <div><label className="label">District</label><input className="input" value={formState.district} onChange={(e) => handleChange('district', e.target.value)} /></div>
        <div><label className="label">State</label><input className="input" value={formState.state} onChange={(e) => handleChange('state', e.target.value)} /></div>
        <div><label className="label">PIN code</label><input className="input" value={formState.pincode} onChange={(e) => handleChange('pincode', e.target.value)} maxLength={6} /></div>
        <div><label className="label">Phone</label><input className="input" value={formState.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="e.g. 08385221001" /></div>
        <div className="sm:col-span-2"><label className="label">Website</label><input className="input" value={formState.website} onChange={(e) => handleChange('website', e.target.value)} placeholder="https://" /></div>
        <div><label className="label">Latitude</label><input className="input" value={formState.lat} onChange={(e) => handleChange('lat', e.target.value)} placeholder="13.8715" /></div>
        <div><label className="label">Longitude</label><input className="input" value={formState.lng} onChange={(e) => handleChange('lng', e.target.value)} placeholder="74.6184" /></div>
        <div className="sm:col-span-2">
          <label className="label">Services (separate with semicolons)</label>
          <input className="input" value={formState.services} onChange={(e) => handleChange('services', e.target.value)} placeholder="OPD; Vaccination; First Aid" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Emergency info</label>
          <textarea className="input min-h-16" rows={2} value={formState.emergency_info} onChange={(e) => handleChange('emergency_info', e.target.value)} placeholder="e.g. 24/7 emergency services available" />
        </div>
        <div><label className="label">Source</label><input className="input" value={formState.source} onChange={(e) => handleChange('source', e.target.value)} placeholder="e.g. Manual entry" /></div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-outline">Cancel</button>
        <button onClick={() => saveMutation.mutate()} disabled={loading || !valid} className="btn-primary">
          {loading && <Spinner className="h-4 w-4" />}
          {editingId ? 'Save changes' : 'Add facility'}
        </button>
      </div>
    </div>
  );
}

function CSVImport({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ valid: Record<string, string>[]; invalid: { row: number; error: string; data: Record<string, string> }[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [error, setError] = useState('');

  const handleFile = (file: File) => {
    setError('');
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) {
        setError('CSV must have a header row and at least one data row');
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim());
      const validRows: Record<string, string>[] = [];
      const invalidRows: { row: number; error: string; data: Record<string, string> }[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });

        if (!row.name) { invalidRows.push({ row: i + 1, error: 'Missing name', data: row }); continue; }
        if (!row.address) { invalidRows.push({ row: i + 1, error: 'Missing address', data: row }); continue; }
        if (!CATEGORIES.includes(row.category as FacilityCategory)) { invalidRows.push({ row: i + 1, error: `Invalid category: ${row.category}`, data: row }); continue; }

        validRows.push(row);
      }
      setPreview({ valid: validRows, invalid: invalidRows });
    };
    reader.readAsText(file);
  };

  const doImport = async () => {
    if (!preview) return;
    setImporting(true);
    setError('');
    let success = 0;
    let failed = 0;

    for (const row of preview.valid) {
      const payload = {
        name: row.name,
        category: row.category,
        address: row.address,
        locality: row.locality || null,
        city: row.city || null,
        district: row.district || null,
        state: row.state || null,
        pincode: row.pincode || null,
        phone: row.phone || null,
        website: row.website || null,
        lat: row.lat ? parseFloat(row.lat) : null,
        lng: row.lng ? parseFloat(row.lng) : null,
        services: (row.services || '').split(';').map((s) => s.trim()).filter(Boolean),
        emergency_info: row.emergency_info || null,
        verification_status: row.verification_status || 'pending',
        source: row.source || 'CSV import',
      };
      const { error } = await supabase.rpc('admin_insert_facility', { p_data: payload });
      if (error) { failed++; } else { success++; }
    }

    setImporting(false);
    setResult({ success, failed });
    queryClient.invalidateQueries({ queryKey: ['facilities'] });
    if (failed === 0) setTimeout(() => onDone(), 2000);
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'facility_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-navy-800">
          <FileSpreadsheet className="h-5 w-5 text-teal-600" /> CSV Import
        </h3>
        <p className="mb-4 text-sm text-navy-500">
          Upload a CSV file to bulk-add facilities. Download the template to see the expected format.
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={downloadSample} className="btn-outline">
            <Download className="h-4 w-4" /> Download template
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-primary">
            <Upload className="h-4 w-4" /> Choose CSV file
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      </div>

      {error && <div className="flex items-center gap-2 rounded-lg bg-coral-50 px-4 py-3 text-sm text-coral-700"><AlertCircle className="h-4 w-4" />{error}</div>}

      {result && (
        <div className="card">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 text-mint-600" />
            <p className="text-sm text-navy-700">Import complete: {result.success} added, {result.failed} failed.</p>
          </div>
        </div>
      )}

      {preview && !result && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-navy-800">Preview</h3>
              <div className="flex gap-2">
                <Badge variant="mint">{preview.valid.length} valid</Badge>
                {preview.invalid.length > 0 && <Badge variant="coral">{preview.invalid.length} invalid</Badge>}
              </div>
            </div>

            {preview.valid.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-navy-100 text-left text-xs text-navy-400">
                    <th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Category</th><th className="py-2 pr-3">Address</th><th className="py-2 pr-3">PIN</th>
                  </tr></thead>
                  <tbody>
                    {preview.valid.slice(0, 10).map((r, i) => (
                      <tr key={i} className="border-b border-navy-50">
                        <td className="py-2 pr-3 text-navy-700">{r.name}</td>
                        <td className="py-2 pr-3 text-navy-500">{r.category}</td>
                        <td className="py-2 pr-3 text-navy-500 truncate max-w-48">{r.address}</td>
                        <td className="py-2 pr-3 text-navy-500">{r.pincode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.valid.length > 10 && <p className="mt-2 text-xs text-navy-400">+{preview.valid.length - 10} more rows</p>}
              </div>
            )}

            {preview.invalid.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-medium text-coral-700">Invalid rows (will be skipped)</h4>
                <div className="space-y-1">
                  {preview.invalid.slice(0, 5).map((r, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-coral-50 px-3 py-2 text-xs">
                      <AlertCircle className="h-3.5 w-3.5 text-coral-500 flex-shrink-0" />
                      <span className="text-coral-700">Row {r.row}: {r.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setPreview(null)} className="btn-outline">Cancel</button>
              <button onClick={doImport} disabled={importing || preview.valid.length === 0} className="btn-primary">
                {importing && <Spinner className="h-4 w-4" />}
                Import {preview.valid.length} facilities
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmDialogWrap({ deleteId, setDeleteId }: { deleteId: string | null; setDeleteId: (id: string | null) => void }) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('admin_delete_facility', { p_facility_id: id });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['facilities'] }); setDeleteId(null); },
  });

  return (
    <ConfirmDialog
      open={!!deleteId}
      onClose={() => setDeleteId(null)}
      onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      title="Delete facility"
      message="This will permanently remove the facility from the directory."
      confirmLabel="Delete"
      danger
      loading={deleteMutation.isPending}
    />
  );
}
