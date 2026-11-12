import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Bookmark, X, Filter, Clock, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { canEditArticles } from '@/lib/permissions';
import { LoadingState, EmptyState, ErrorState, Badge } from '@/components/ui';
import type { Article, ArticleCategory, ArticleBookmark } from '@/lib/types';

const CATEGORIES: ArticleCategory[] = [
  'Preventive', 'Diabetes', 'BP & Heart', 'Nutrition', 'Activity', 'Hygiene',
  'Communicable Disease', 'Vaccination', 'Mental Wellbeing', 'Healthy Ageing',
  "Women's Health", "Children's Health",
];

const CATEGORY_COLORS: Record<string, string> = {
  'Preventive': 'teal', 'Diabetes': 'coral', 'BP & Heart': 'coral', 'Nutrition': 'mint',
  'Activity': 'teal', 'Hygiene': 'navy', 'Communicable Disease': 'amber', 'Vaccination': 'teal',
  'Mental Wellbeing': 'navy', 'Healthy Ageing': 'amber', "Women's Health": 'coral', "Children's Health": 'mint',
};

export function LibraryPage() {
  const { user, profile } = useAuth();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const { data: articles = [], isLoading, error, refetch } = useQuery<Article[]>({
    queryKey: ['articles', 'published'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('review_status', 'published')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as Article[];
    },
    enabled: !!user,
  });

  const { data: bookmarks = [] } = useQuery<ArticleBookmark[]>({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('article_bookmarks').select('*');
      if (error) throw error;
      return data as ArticleBookmark[];
    },
    enabled: !!user,
  });

  const bookmarkIds = new Set(bookmarks.map((b) => b.article_id));

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (search) {
        const q = search.toLowerCase();
        if (!a.title.toLowerCase().includes(q) && !a.summary.toLowerCase().includes(q) && !a.tags.some((t) => t.toLowerCase().includes(q))) return false;
      }
      if (filterCategory !== 'all' && a.category !== filterCategory) return false;
      return true;
    });
  }, [articles, search, filterCategory]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Health Library</h1>
          <p className="text-sm text-navy-500">Reviewed health articles for your family</p>
        </div>
        <div className="flex gap-2">
          <Link to="/library/bookmarks" className="btn-outline">
            <Bookmark className="h-4 w-4" /> Bookmarks
          </Link>
          {canEditArticles(profile?.role) && (
            <Link to="/library/editor" className="btn-primary">
              Editor Dashboard
            </Link>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
            <input className="input pl-10" placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input sm:w-56" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {(search || filterCategory !== 'all') && (
          <button onClick={() => { setSearch(''); setFilterCategory('all'); }} className="mt-3 flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700">
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>

      {isLoading && <LoadingState message="Loading articles..." />}
      {error && <ErrorState message="Could not load articles." onRetry={() => refetch()} />}

      {!isLoading && !error && articles.length === 0 && (
        <div className="card">
          <EmptyState icon={<BookOpen className="h-12 w-12" />} title="No articles yet" description="Health articles will appear here once editors publish them." />
        </div>
      )}

      {!isLoading && !error && articles.length > 0 && filtered.length === 0 && (
        <div className="card">
          <EmptyState icon={<Filter className="h-12 w-12" />} title="No articles match your filters" description="Try adjusting or clearing your filters." />
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article) => (
            <Link key={article.id} to={`/library/${article.id}`} className="card flex flex-col transition-shadow hover:shadow-card-hover">
              <div className="flex items-center gap-2">
                <Badge variant={(CATEGORY_COLORS[article.category] as 'teal' | 'coral' | 'mint' | 'navy' | 'amber') ?? 'neutral'}>{article.category}</Badge>
                {bookmarkIds.has(article.id) && <Bookmark className="h-3.5 w-3.5 text-teal-600 fill-teal-600" />}
              </div>
              <h3 className="mt-3 font-semibold text-navy-800 line-clamp-2">{article.title}</h3>
              <p className="mt-1.5 text-sm text-navy-500 line-clamp-3 flex-1">{article.summary}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-navy-400 border-t border-navy-100 pt-3">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {article.reading_time} min read</span>
                {article.tags.length > 0 && <span>{article.tags.slice(0, 2).join(', ')}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
