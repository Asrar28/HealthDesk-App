import { Link } from 'react-router-dom';
import { Bookmark, BookOpen, ArrowLeft, Clock } from 'lucide-react';
import { Badge } from '@/components/ui';
import { HEALTH_ARTICLES } from '@/lib/health-articles';

export function BookmarksPage() {
  // Use first 3 articles as featured saved articles
  const savedArticles = HEALTH_ARTICLES.slice(0, 3);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <Link to="/library" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft className="h-4 w-4" /> Back to library
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Saved & Bookmarked Articles</h1>
        <p className="text-sm text-slate-500">Quick access to essential preventive care and family guidelines.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {savedArticles.map((article) => (
          <Link
            key={article.id}
            to={`/library/${article.id}`}
            className="group rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-2xl">{article.icon}</span>
                <Badge variant="teal">{article.category}</Badge>
              </div>

              <h3 className="font-bold text-slate-900 group-hover:text-teal-700 transition line-clamp-2">
                {article.title}
              </h3>
              <p className="mt-2 text-xs text-slate-500 line-clamp-3">
                {article.summary}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.readTime}
              </span>
              <span className="font-bold text-teal-600">Read &rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
