import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { Eye, EyeOff, Shield, User } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const redirect = searchParams.get('redirect') || '/dashboard';

  // Toggle demo credentials based on environment variable or dev mode (hidden in production)
  const showDemoCredentials =
    import.meta.env.VITE_SHOW_DEMO_CREDENTIALS !== undefined
      ? import.meta.env.VITE_SHOW_DEMO_CREDENTIALS === 'true'
      : import.meta.env.DEV || import.meta.env.MODE === 'test';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values) => {
    try {
      await login(values);
      navigate(redirect, { replace: true });
    } catch {
      // Toast handles error display
    }
  };

  const handleQuickLogin = (email, password = 'Password123!') => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xl mx-auto shadow-md">
          CL
        </div>
        <h2 className="mt-4 font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Sign in to your account
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-500">
          Or{' '}
          <Link to={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-indigo-600 font-semibold hover:underline">
            create a new student account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="student@campus.test"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button type="submit" loading={isSubmitting} size="lg" className="w-full">
              Sign In
            </Button>
          </form>

          {/* Quick Demo Logins (Visible in development mode only) */}
          {showDemoCredentials && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
                Demo Credentials (Click to prefill)
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('john.doe@campus.test')}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-left flex items-center gap-1.5 transition cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="truncate">Student (John)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('priya.sharma@campus.test')}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-left flex items-center gap-1.5 transition cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="truncate">Student (Priya)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@campus.test', 'Admin@12345')}
                  className="col-span-2 p-2 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/50 text-left flex items-center gap-1.5 transition cursor-pointer text-indigo-900"
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-semibold">Administrator (Sarah Jenkins)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
