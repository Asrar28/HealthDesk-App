import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Share2,
  Bookmark,
  CheckCircle2,
  HeartPulse,
} from 'lucide-react';
import { Badge, showToast } from '@/components/ui';
import { HEALTH_ARTICLES } from '@/lib/health-articles';

export function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const article = HEALTH_ARTICLES.find((a) => a.id === id);

  if (!article) {
    return (
      <div className="py-16 text-center max-w-md mx-auto animate-fade-in">
        <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Article Not Found</h2>
        <p className="mt-1 text-sm text-slate-500">
          The requested health article could not be found in our library.
        </p>
        <button onClick={() => navigate('/library')} className="btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" /> Back to Library
        </button>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast({ title: 'Article link copied to clipboard', type: 'success' });
    }
  };

  const handleBookmark = () => {
    showToast({ title: 'Article saved to your bookmarks', type: 'success' });
  };

  const paragraphs = article.body.split('\n\n');

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/library')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Health Library
        </button>
      </div>

      {/* Article Container */}
      <article className="rounded-3xl bg-white p-6 sm:p-10 shadow-sm border border-gray-100 space-y-8">
        {/* Header */}
        <div className="space-y-4 pb-6 border-b border-gray-100">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl p-1.5 rounded-xl bg-slate-50 border border-gray-100">
                {article.icon}
              </span>
              <Badge variant="teal">{article.category}</Badge>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBookmark}
                className="rounded-xl border border-gray-200 p-2 text-slate-500 hover:bg-slate-50 transition"
                title="Bookmark article"
              >
                <Bookmark className="h-4 w-4" />
              </button>
              <button
                onClick={handleShare}
                className="rounded-xl border border-gray-200 p-2 text-slate-500 hover:bg-slate-50 transition"
                title="Share article"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1 font-medium text-slate-600">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {article.readTime}
            </span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
              Reviewed by HealthDesk Medical Board
            </span>
          </div>

          <div className="rounded-2xl bg-teal-50/50 p-4 border border-teal-100 text-xs sm:text-sm text-teal-900 leading-relaxed font-medium">
            💡 <strong>Key Takeaway:</strong> {article.summary}
          </div>
        </div>

        {/* Formatted Article Body */}
        <div className="space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed font-normal">
          {paragraphs.map((para, i) => (
            <p key={i} className="whitespace-pre-line">
              {para}
            </p>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 rounded-2xl bg-slate-50 p-5 border border-gray-100 text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700 flex items-center gap-1.5">
            <HeartPulse className="h-4 w-4 text-teal-600" /> Medical Disclaimer
          </p>
          <p>
            This article is intended for educational and preventive awareness only. Always consult a licensed physician or specialist before making significant dietary changes or modifying prescribed medication regimens.
          </p>
        </div>

        {/* Next Read / Return to library */}
        <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => navigate('/library')}
            className="btn-outline text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to All Articles
          </button>

          <Link
            to="/planner"
            className="btn-primary text-xs"
          >
            Create Health Reminder
          </Link>
        </div>
      </article>
    </div>
  );
}
