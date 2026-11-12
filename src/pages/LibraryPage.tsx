import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Clock,
  ArrowRight,
  Filter,
  Sparkles,
  Bookmark,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { HEALTH_ARTICLES } from '@/lib/health-articles';

const CATEGORIES = [
  'All',
  'Preventive',
  'Diabetes',
  'BP & Heart',
  'Nutrition',
  'Activity',
  'Vaccination',
  'Mental Wellbeing',
];

export function LibraryPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filteredArticles = useMemo(() => {
    return HEALTH_ARTICLES.filter((a) => {
      if (selectedCategory !== 'All' && a.category !== selectedCategory) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const t = a.title.toLowerCase();
        const s = a.summary.toLowerCase();
        const tags = (a.tags || []).join(' ').toLowerCase();
        if (!t.includes(q) && !s.includes(q) && !tags.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [selectedCategory, search]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Health Library</h1>
            <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Evidence-Based
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Doctor-reviewed preventive health articles, nutrition guidelines, and chronic care management tips.
          </p>
        </div>
      </div>

      {/* Categories & Search */}
      <div className="space-y-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-gray-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-gray-100 flex items-center gap-3">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by topic, disease, or dietary question (e.g. blood pressure, walking, insulin)..."
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

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            className="group rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-3xl p-2 rounded-xl bg-slate-50 border border-gray-100 group-hover:scale-105 transition-transform">
                  {article.icon}
                </span>
                <Badge
                  variant={
                    article.category === 'Diabetes'
                      ? 'amber'
                      : article.category === 'BP & Heart'
                      ? 'rose'
                      : article.category === 'Nutrition'
                      ? 'mint'
                      : 'teal'
                  }
                >
                  {article.category}
                </Badge>
              </div>

              <h2 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition leading-snug">
                {article.title}
              </h2>

              <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-3">
                {article.summary}
              </p>

              {article.tags && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {article.tags.map((t) => (
                    <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.readTime}
              </span>

              <Link
                to={`/library/${article.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-800"
              >
                Read Article <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
