import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bookmark, BookOpen, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { LoadingState, EmptyState, ErrorState, Badge } from '@/components/ui';
import type { Article, ArticleBookmark } from '@/lib/types';

export function BookmarksPage() {
  const { user } = useAuth();

  const { data: bookmarks = [], isLoading, error } = useQuery<ArticleBookmark[]>({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('article_bookmarks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as ArticleBookmark[];
    },
    enabled: !!user,
  });

  const { data: articles = [] } = useQuery<Article[]>({
    queryKey: ['articles', 'bookmarked', bookmarks.map((b) => b.article_id)],
    queryFn: async () => {
      const ids = bookmarks.map((b) => b.article_id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase.from('articles').select('*').in('id', ids);
      if (error) throw error;
      return data as Article[];
    },
    enabled: !!user && bookmarks.length > 0,
  });

  if (isLoading) return <LoadingState message="Loading bookmarks..." />;
  if (error) return <ErrorState message="Could not load your bookmarks." />;

  return (
    <div className="space-y-6">
      <Link to="/library" className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700">
        <ChevronLeft className="h-4 w-4" /> Back to library
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-navy-800">Bookmarked Articles</h1>
        <p className="text-sm text-navy-500">Articles you've saved for later</p>
      </div>

      {articles.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Bookmark className="h-12 w-12" />}
            title="No bookmarks yet"
            description="Bookmark articles from the Health Library to save them here for easy access."
            action={<Link to="/library" className="btn-primary"><BookOpen className="h-4 w-4" /> Browse library</Link>}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link key={article.id} to={`/library/${article.id}`} className="card flex flex-col transition-shadow hover:shadow-card-hover">
              <div className="flex items-center gap-2">
                <Badge variant="teal">{article.category}</Badge>
                <Bookmark className="h-3.5 w-3.5 text-teal-600 fill-teal-600" />
              </div>
              <h3 className="mt-3 font-semibold text-navy-800 line-clamp-2">{article.title}</h3>
              <p className="mt-1.5 text-sm text-navy-500 line-clamp-3 flex-1">{article.summary}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
