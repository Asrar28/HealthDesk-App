import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui';
import { AuthShell } from '@/pages/AuthPages';

export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isRecovery, setIsRecovery] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    // 1. Listen for PASSWORD_RECOVERY event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setIsRecovery(true);
        setCheckingToken(false);
      }
    });

    // 2. Check if URL contains recovery tokens (#access_token or type=recovery or ?code=)
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const hasRecoveryInHash = hash.includes('type=recovery') || hash.includes('access_token');
    const hasCodeInSearch = search.includes('code=');

    if (hasRecoveryInHash || hasCodeInSearch) {
      setIsRecovery(true);
      setCheckingToken(false);
    } else {
      // 3. Check existing session
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setIsRecovery(true);
        }
        setCheckingToken(false);
      });
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!password) {
      setServerError('Please enter a new password');
      return;
    }

    if (password.length < 8) {
      setServerError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setServerError('Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setServerError(error.message || 'Failed to update password. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // On success, sign out and navigate to /login with message
      await supabase.auth.signOut();
      navigate('/login', {
        state: { message: 'Password changed, please login' },
        replace: true,
      });
    } catch (err: any) {
      setServerError(err?.message || 'An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Set new password"
      subtitle="Enter a new password for your HealthDesk account"
    >
      {checkingToken ? (
        <div className="py-12 text-center text-navy-400">
          <Spinner className="h-8 w-8 text-teal-500 mx-auto" />
          <p className="mt-3 text-sm">Verifying password reset session...</p>
        </div>
      ) : !isRecovery ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Reset link invalid or expired</p>
                <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                  No active recovery session was detected. Password reset links expire after a short period. Please request a fresh reset link.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link to="/forgot-password" className="btn-primary w-full text-center">
              Request new reset link
            </Link>
          </div>

          <p className="mt-4 text-center text-sm text-navy-500">
            Remember your password?{' '}
            <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700">
              Sign in
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-coral-50 px-4 py-3 text-sm text-coral-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {serverError}
            </div>
          )}

          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input pl-10 pr-10"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-500"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="input pl-10 pr-10"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-500"
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full"
          >
            {isSubmitting && <Spinner className="h-4 w-4" />}
            Reset Password
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </button>

          <p className="mt-6 text-center text-sm text-navy-500">
            Remember your password?{' '}
            <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}

export default ResetPassword;
