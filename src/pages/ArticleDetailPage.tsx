import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, Bookmark, Clock, Tag, ExternalLink, AlertTriangle, ArrowRight, BookOpen,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingState, ErrorState, Badge, EmptyState } from '@/components/ui';
import type { Article, ArticleBookmark } from '@/lib/types';

export function ArticleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: ['article', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('articles').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Not found');
      return data as Article;
    },
    enabled: !!id,
  });

  const { data: bookmarks = [] } = useQuery<ArticleBookmark[]>({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('article_bookmarks').select('*');
      if (error) throw error;
      return data as ArticleBookmark[];
    },
  });

  const isBookmarked = bookmarks.some((b) => b.article_id === id);

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        const existing = bookmarks.find((b) => b.article_id === id);
        if (existing) {
          const { error } = await supabase.from('article_bookmarks').delete().eq('id', existing.id);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.from('article_bookmarks').insert({ article_id: id });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  const { data: related = [] } = useQuery<Article[]>({
    queryKey: ['articles', 'related', article?.category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('review_status', 'published')
        .eq('category', article!.category)
        .neq('id', id!)
        .limit(3);
      if (error) throw error;
      return data as Article[];
    },
    enabled: !!article && article.review_status === 'published',
  });

  if (isLoading) return <LoadingState message="Loading article..." />;
  if (error || !article) return <ErrorState message="Could not load this article." onRetry={() => navigate('/library')} />;

  const isUnreviewed = !article.reviewer_role && article.review_status === 'published';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/library" className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700">
        <ChevronLeft className="h-4 w-4" /> Back to library
      </Link>

      <article className="card">
        <div className="flex items-center justify-between gap-4">
          <Badge variant="teal">{article.category}</Badge>
          <button
            onClick={() => bookmarkMutation.mutate()}
            disabled={bookmarkMutation.isPending}
            className={`btn-ghost text-sm ${isBookmarked ? 'text-teal-600' : ''}`}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-teal-600' : ''}`} />
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
        </div>

        <h1 className="mt-4 text-3xl font-bold text-navy-800">{article.title}</h1>
        <p className="mt-2 text-lg text-navy-500">{article.summary}</p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-navy-400">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {article.reading_time} min read</span>
          <span>Updated {new Date(article.updated_at).toLocaleDateString()}</span>
          {article.language !== 'en' && <Badge variant="neutral">{article.language}</Badge>}
        </div>

        {isUnreviewed && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            Awaiting Medical Review — this article has not yet been reviewed by a medical professional.
          </div>
        )}

        <div className="mt-6 prose prose-sm max-w-none text-navy-700">
          {article.body.split('\n').map((paragraph, i) => (
            paragraph.trim() ? <p key={i} className="mb-4 leading-relaxed">{paragraph}</p> : null
          ))}
        </div>

        {article.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-navy-100 pt-4">
            <Tag className="h-4 w-4 text-navy-400" />
            {article.tags.map((tag) => <Badge key={tag} variant="neutral">{tag}</Badge>)}
          </div>
        )}

        {(article.source_title || article.source_url) && (
          <div className="mt-4 border-t border-navy-100 pt-4">
            <p className="text-xs text-navy-400">Source:</p>
            {article.source_url ? (
              <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700">
                {article.source_title || article.source_url}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <p className="text-sm text-navy-600">{article.source_title}</p>
            )}
          </div>
        )}
      </article>

      {related.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-navy-800">Related articles</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} to={`/library/${r.id}`} className="card transition-shadow hover:shadow-card-hover">
                <Badge variant="teal">{r.category}</Badge>
                <h4 className="mt-2 text-sm font-semibold text-navy-800 line-clamp-2">{r.title}</h4>
                <p className="mt-1 text-xs text-navy-400 line-clamp-2">{r.summary}</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-teal-600">
                  Read <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
