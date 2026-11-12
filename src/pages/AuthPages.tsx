import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HeartPulse, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

type FormData = z.infer<typeof schema>;

function PasswordInput({ id, placeholder, registration }: { id: string; placeholder: string; registration: ReturnType<ReturnType<typeof useForm>['register']> }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className="input pl-10 pr-10"
        placeholder={placeholder}
        {...registration}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-500"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    const email = data.email.trim().toLowerCase();
    const password = data.password;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message?.toLowerCase().includes('email not confirmed')) {
        setServerError('Please confirm your email address first — check your inbox for a confirmation link.');
      } else {
        setServerError('Invalid email or password. Please try again.');
      }
      return;
    }
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';
    navigate(from, { replace: true });
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your family's health">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="flex items-center gap-2 rounded-lg bg-coral-50 px-4 py-3 text-sm text-coral-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {serverError}
          </div>
        )}

        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
            <input type="email" className="input pl-10" placeholder="you@example.com" {...register('email')} />
          </div>
          {errors.email && <p className="mt-1 text-xs text-coral-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Password</label>
          <PasswordInput id="login-password" placeholder="Your password" registration={register('password')} />
          {errors.password && <p className="mt-1 text-xs text-coral-600">{errors.password.message}</p>}
        </div>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-teal-600 hover:text-teal-700">
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting && <Spinner className="h-4 w-4" />}
          Sign in
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-navy-500">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-teal-600 hover:text-teal-700">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const registerSchema = z.object({
    display_name: z.string().min(2, 'Enter your name (at least 2 characters)'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    privacy: z.literal(true, { error: 'Please accept the privacy terms to continue' }),
  }).refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

  type RegisterFormData = z.infer<typeof registerSchema>;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    const email = data.email.trim().toLowerCase();
    const password = data.password;

    // 1. Create the account
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: data.display_name } },
    });
    if (signUpError) {
      setServerError('Could not create your account. This email may already be registered.');
      return;
    }

    // 2. Immediately sign in so user lands on dashboard without email confirmation
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      // Account created but login blocked (e.g. email confirmation required by Supabase project settings)
      setServerError(
        'Account created! Please check your inbox and confirm your email address, then sign in.'
      );
      return;
    }

    navigate('/dashboard', { replace: true });
  };

  return (
    <AuthShell title="Create your account" subtitle="Start managing your family's preventive health">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="flex items-center gap-2 rounded-lg bg-coral-50 px-4 py-3 text-sm text-coral-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {serverError}
          </div>
        )}

        <div>
          <label className="label">Your name</label>
          <input className="input" placeholder="e.g. Aisha" {...register('display_name')} />
          {errors.display_name && <p className="mt-1 text-xs text-coral-600">{errors.display_name.message}</p>}
        </div>

        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
            <input type="email" className="input pl-10" placeholder="you@example.com" {...register('email')} />
          </div>
          {errors.email && <p className="mt-1 text-xs text-coral-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Password</label>
          <PasswordInput id="reg-password" placeholder="At least 8 characters" registration={register('password')} />
          {errors.password && <p className="mt-1 text-xs text-coral-600">{errors.password.message}</p>}
        </div>

        <div>
          <label className="label">Confirm password</label>
          <PasswordInput id="reg-confirm-password" placeholder="Re-enter your password" registration={register('confirmPassword')} />
          {errors.confirmPassword && <p className="mt-1 text-xs text-coral-600">{errors.confirmPassword.message}</p>}
        </div>

        <label className="flex items-start gap-2.5 text-sm text-navy-600">
          <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-navy-300 text-teal-500 focus:ring-teal-500" {...register('privacy')} />
          <span>I understand that HealthDesk is not a medical device and does not replace professional medical advice.</span>
        </label>
        {errors.privacy && <p className="text-xs text-coral-600">{errors.privacy.message}</p>}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting && <Spinner className="h-4 w-4" />}
          Create account
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-navy-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const schema = z.object({
    email: z.string().email('Enter a valid email address'),
  });
  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      setServerError('Could not send reset email. Please try again later.');
      return;
    }
    setSent(true);
  };

  return (
    <AuthShell title="Reset your password" subtitle="We'll send you a link to reset your password">
      {sent ? (
        <div className="space-y-4 text-center">
          <div className="rounded-lg bg-mint-100 px-4 py-6">
            <p className="text-sm text-mint-700">
              If an account exists with that email, we've sent a password reset link.
              Check your inbox and follow the instructions.
            </p>
          </div>
          <Link to="/login" className="btn-outline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-coral-50 px-4 py-3 text-sm text-coral-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {serverError}
            </div>
          )}

          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
              <input type="email" className="input pl-10" placeholder="you@example.com" {...register('email')} />
            </div>
            {errors.email && <p className="mt-1 text-xs text-coral-600">{errors.email.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting && <Spinner className="h-4 w-4" />}
            Send reset link
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-navy-500">
        Remember your password?{' '}
        <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream-100 lg:flex-row">
      <div className="relative hidden bg-navy-800 lg:block lg:w-1/2">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-navy-800 to-teal-900" />
        <div className="absolute right-0 top-1/4 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative flex h-full flex-col justify-center p-12">
          <Link to="/" className="mb-12 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">HealthDesk</span>
          </Link>
          <h2 className="text-3xl font-bold leading-tight text-white">
            Your family's health,
            <span className="block text-mint-300">better connected.</span>
          </h2>
          <p className="mt-4 max-w-md text-navy-200">
            Plan preventive checkups, track vaccinations, and stay on top of your family's
            health — all in one place.
          </p>
          <div className="mt-8 space-y-3">
            {['Preventive health planner with reminders', 'Family member profiles', 'Local healthcare facility finder', 'Reviewed health articles library'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-navy-100">
                <div className="h-1.5 w-1.5 rounded-full bg-mint-300" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500">
                <HeartPulse className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-navy-800">HealthDesk</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-navy-800">{title}</h1>
          <p className="mt-2 text-sm text-navy-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
