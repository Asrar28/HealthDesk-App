import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BookOpen, Plus, Pencil, Send, Check, X, Archive, FileText, AlertCircle, Eye,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { canReviewArticles, canPublishArticles } from '@/lib/permissions';
import {
  LoadingState, EmptyState, ErrorState, Badge, Modal, ConfirmDialog, Spinner,
} from '@/components/ui';
import type { Article, ArticleCategory, ReviewStatus } from '@/lib/types';

const CATEGORIES: ArticleCategory[] = [
  'Preventive', 'Diabetes', 'BP & Heart', 'Nutrition', 'Activity', 'Hygiene',
  'Communicable Disease', 'Vaccination', 'Mental Wellbeing', 'Healthy Ageing',
  "Women's Health", "Children's Health",
];

const STATUS_LABELS: Record<ReviewStatus, string> = {
  draft: 'Draft', submitted: 'Submitted', awaiting_review: 'Awaiting Review',
  approved: 'Approved', published: 'Published', rejected: 'Rejected', archived: 'Archived',
};

const STATUS_VARIANTS: Record<ReviewStatus, 'neutral' | 'teal' | 'amber' | 'mint' | 'navy' | 'coral'> = {
  draft: 'neutral', submitted: 'amber', awaiting_review: 'amber',
  approved: 'teal', published: 'mint', rejected: 'coral', archived: 'navy',
};

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  summary: z.string().min(10, 'Summary must be at least 10 characters'),
  body: z.string().min(50, 'Body must be at least 50 characters'),
  category: z.enum([
    'Preventive', 'Diabetes', 'BP & Heart', 'Nutrition', 'Activity', 'Hygiene',
    'Communicable Disease', 'Vaccination', 'Mental Wellbeing', 'Healthy Ageing',
    "Women's Health", "Children's Health",
  ]),
  tags: z.string().optional(),
  language: z.string().default('en'),
  source_title: z.string().optional(),
  source_url: z.string().optional().refine((v) => !v || /^https?:\/\//.test(v), 'Must start with http:// or https://'),
});

type FormData = z.infer<typeof schema>;

export function EditorDashboardPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'my-articles' | 'review-queue' | 'create'>('my-articles');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const isReviewer = canReviewArticles(profile?.role);
  const canPublish = canPublishArticles(profile?.role);

  const { data: myArticles = [], isLoading: myLoading } = useQuery<Article[]>({
    queryKey: ['articles', 'my'],
    queryFn: async () => {
      const { data, error } = await supabase.from('articles').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      return data as Article[];
    },
  });

  const { data: reviewQueue = [], isLoading: reviewLoading } = useQuery<Article[]>({
    queryKey: ['articles', 'review-queue'],
    queryFn: async () => {
      const { data, error } = await supabase.from('articles').select('*').eq('review_status', 'submitted').order('updated_at', { ascending: false });
      if (error) throw error;
      return data as Article[];
    },
    enabled: isReviewer,
  });

  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('submit_article_for_review', { p_article_id: id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['articles'] }),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
      const { error } = await supabase.rpc('review_article', { p_article_id: id, p_action: action });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['articles'] }),
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('publish_article', { p_article_id: id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['articles'] }),
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('archive_article', { p_article_id: id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['articles'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('articles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['articles'] }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const words = data.body.split(/\s+/).length;
      const readingTime = Math.max(1, Math.round(words / 200));
      const tags = (data.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean);
      const { error } = await supabase.from('articles').insert({
        title: data.title,
        summary: data.summary,
        body: data.body,
        category: data.category,
        tags,
        language: data.language,
        source_title: data.source_title || null,
        source_url: data.source_url || null,
        reading_time: readingTime,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['articles'] }); setShowForm(false); setTab('my-articles'); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const words = data.body.split(/\s+/).length;
      const readingTime = Math.max(1, Math.round(words / 200));
      const tags = (data.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean);
      const { error } = await supabase.from('articles').update({
        title: data.title,
        summary: data.summary,
        body: data.body,
        category: data.category,
        tags,
        language: data.language,
        source_title: data.source_title || null,
        source_url: data.source_url || null,
        reading_time: readingTime,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['articles'] }); setShowForm(false); setEditingId(null); },
  });

  const editingArticle = myArticles.find((a) => a.id === editingId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Editor Dashboard</h1>
        <p className="text-sm text-navy-500">Create and manage health articles</p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-navy-200 bg-white p-1 w-fit">
        <button onClick={() => setTab('my-articles')} className={`rounded-md px-4 py-2 text-sm font-medium ${tab === 'my-articles' ? 'bg-teal-50 text-teal-700' : 'text-navy-500'}`}>My articles</button>
        {isReviewer && <button onClick={() => setTab('review-queue')} className={`rounded-md px-4 py-2 text-sm font-medium ${tab === 'review-queue' ? 'bg-teal-50 text-teal-700' : 'text-navy-500'}`}>Review queue</button>}
        <button onClick={() => { setEditingId(null); setShowForm(true); }} className="rounded-md px-4 py-2 text-sm font-medium text-teal-600">
          <Plus className="inline h-3.5 w-3.5" /> New article
        </button>
      </div>

      {tab === 'my-articles' && (myLoading ? <LoadingState /> : (
        <div className="space-y-2">
          {myArticles.length === 0 ? (
            <div className="card"><EmptyState icon={<FileText className="h-12 w-12" />} title="No articles yet" description="Create your first health article to get started." action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="h-4 w-4" /> New article</button>} /></div>
          ) : myArticles.map((a) => (
            <div key={a.id} className="card flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-navy-800">{a.title}</h3>
                  <Badge variant={STATUS_VARIANTS[a.review_status]}>{STATUS_LABELS[a.review_status]}</Badge>
                </div>
                <p className="mt-1 text-sm text-navy-500 line-clamp-1">{a.summary}</p>
                <p className="mt-1 text-xs text-navy-400">{a.category} · {a.reading_time} min · v{a.version}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1.5">
                {(a.review_status === 'draft' || a.review_status === 'rejected') && (
                  <button onClick={() => submitMutation.mutate(a.id)} disabled={submitMutation.isPending} className="btn-ghost text-xs text-teal-600">
                    <Send className="h-3.5 w-3.5" /> Submit
                  </button>
                )}
                {canPublish && a.review_status === 'approved' && (
                  <button onClick={() => publishMutation.mutate(a.id)} disabled={publishMutation.isPending} className="btn-ghost text-xs text-mint-700">
                    <Check className="h-3.5 w-3.5" /> Publish
                  </button>
                )}
                {canPublish && a.review_status === 'published' && (
                  <button onClick={() => archiveMutation.mutate(a.id)} disabled={archiveMutation.isPending} className="btn-ghost text-xs">
                    <Archive className="h-3.5 w-3.5" /> Archive
                  </button>
                )}
                <button onClick={() => { setEditingId(a.id); setShowForm(true); }} className="btn-ghost text-xs"><Pencil className="h-3.5 w-3.5" /></button>
                {a.review_status === 'draft' && (
                  <button onClick={() => deleteMutation.mutate(a.id)} disabled={deleteMutation.isPending} className="btn-ghost text-xs text-coral-600"><X className="h-3.5 w-3.5" /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

      {tab === 'review-queue' && isReviewer && (reviewLoading ? <LoadingState /> : (
        <div className="space-y-3">
          {reviewQueue.length === 0 ? (
            <div className="card"><EmptyState icon={<BookOpen className="h-12 w-12" />} title="Nothing to review" description="Submitted articles will appear here for review." /></div>
          ) : reviewQueue.map((a) => (
            <div key={a.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-navy-800">{a.title}</h3>
                    <Badge variant="amber">{STATUS_LABELS[a.review_status]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-navy-500">{a.summary}</p>
                  <p className="mt-1 text-xs text-navy-400">{a.category} · {a.reading_time} min read</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-navy-100 pt-3">
                <button onClick={() => reviewMutation.mutate({ id: a.id, action: 'approve' })} disabled={reviewMutation.isPending} className="btn-outline text-xs text-mint-700">
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
                <button onClick={() => reviewMutation.mutate({ id: a.id, action: 'reject' })} disabled={reviewMutation.isPending} className="btn-outline text-xs text-coral-600">
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
                {canPublish && (
                  <span className="ml-auto text-xs text-navy-400">After approval, publish from My Articles</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

      {showForm && (
        <ArticleForm
          editing={editingArticle ?? null}
          onSubmit={(data) => {
            if (editingId) updateMutation.mutate({ id: editingId, data });
            else createMutation.mutate(data);
          }}
          onClose={() => { setShowForm(false); setEditingId(null); }}
          loading={createMutation.isPending || updateMutation.isPending}
          error={createMutation.error?.message || updateMutation.error?.message}
        />
      )}
    </div>
  );
}

function ArticleForm({ editing, onSubmit, onClose, loading, error }: {
  editing: Article | null;
  onSubmit: (data: FormData) => void;
  onClose: () => void;
  loading: boolean;
  error?: string;
}) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editing ? {
      title: editing.title,
      summary: editing.summary,
      body: editing.body,
      category: editing.category,
      tags: editing.tags.join(', '),
      language: editing.language,
      source_title: editing.source_title ?? '',
      source_url: editing.source_url ?? '',
    } : {
      title: '', summary: '', body: '', category: 'Preventive',
      tags: '', language: 'en', source_title: '', source_url: '',
    },
  });

  return (
    <Modal open={true} onClose={onClose} title={editing ? 'Edit article' : 'New article'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <div className="flex items-center gap-2 rounded-lg bg-coral-50 px-4 py-3 text-sm text-coral-700"><AlertCircle className="h-4 w-4" />{error}</div>}

        <div>
          <label className="label">Title</label>
          <input className="input" {...register('title')} />
          {errors.title && <p className="mt-1 text-xs text-coral-600">{errors.title.message}</p>}
        </div>

        <div>
          <label className="label">Summary</label>
          <textarea className="input min-h-16" rows={2} {...register('summary')} />
          {errors.summary && <p className="mt-1 text-xs text-coral-600">{errors.summary.message}</p>}
        </div>

        <div>
          <label className="label">Body</label>
          <textarea className="input min-h-48" rows={10} placeholder="Write the article content. Separate paragraphs with blank lines." {...register('body')} />
          {errors.body && <p className="mt-1 text-xs text-coral-600">{errors.body.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Category</label>
            <Controller control={control} name="category" render={({ field }) => (
              <select className="input" value={field.value} onChange={field.onChange}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )} />
          </div>
          <div>
            <label className="label">Language</label>
            <select className="input" {...register('language')}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="kn">Kannada</option>
              <option value="ur">Urdu</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Tags (comma-separated)</label>
          <input className="input" placeholder="e.g. diabetes, prevention, diet" {...register('tags')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Source title</label>
            <input className="input" {...register('source_title')} />
          </div>
          <div>
            <label className="label">Source URL</label>
            <input className="input" placeholder="https://" {...register('source_url')} />
            {errors.source_url && <p className="mt-1 text-xs text-coral-600">{errors.source_url.message}</p>}
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          Articles must be submitted for review and approved by a reviewer before they can be published. Editors cannot self-publish.
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading && <Spinner className="h-4 w-4" />}
            {editing ? 'Save changes' : 'Create draft'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
