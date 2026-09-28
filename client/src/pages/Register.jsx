import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Button from '../components/ui/Button.jsx';
import { Eye, EyeOff } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Please enter a valid university email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  studentId: z.string().optional(),
  department: z.string().optional(),
  year: z.string().optional(),
});

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      studentId: '',
      department: '',
      year: '',
    },
  });

  const onSubmit = async (values) => {
    try {
      await registerAuth(values);
      navigate(redirect, { replace: true });
    } catch {
      // Toast handles error display
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xl mx-auto shadow-md">
          CL
        </div>
        <h2 className="mt-4 font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Create student account
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-500">
          Already have an account?{' '}
          <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-indigo-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Alex Morgan"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Campus Email"
              type="email"
              placeholder="student@campus.test"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters with letter & number"
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

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Student ID"
                placeholder="Optional"
                error={errors.studentId?.message}
                {...register('studentId')}
              />

              <Select label="Year of Study" {...register('year')}>
                <option value="">Select year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="5">5th+ Year</option>
              </Select>
            </div>

            <Input
              label="Department"
              placeholder="e.g. Computer Science"
              error={errors.department?.message}
              {...register('department')}
            />

            <Button type="submit" loading={isSubmitting} size="lg" className="w-full mt-2">
              Complete Registration
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
