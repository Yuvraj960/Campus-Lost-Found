import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Button from '../components/ui/Button.jsx';
import { User, Shield } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2).max(60),
  department: z.string().optional(),
  year: z.string().optional(),
  phone: z.string().optional(),
  studentId: z.string().optional(),
});

export default function Profile() {
  const { user, updateUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      department: user?.department || '',
      year: user?.year ? String(user.year) : '',
      phone: user?.phone || '',
      studentId: user?.studentId || '',
    },
  });

  const onSubmit = async (values) => {
    await updateUser({
      ...values,
      year: values.year ? Number(values.year) : null,
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight">
          Student Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal university credentials and contact preferences.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* User avatar header */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="h-16 w-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl overflow-hidden shadow-2xs">
            {user?.profileImage?.url ? (
              <img src={user.profileImage.url} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <User className="w-8 h-8" />
            )}
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-slate-900">{user?.name}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="inline-flex items-center gap-1 text-3xs font-bold uppercase tracking-wider px-2 py-0.5 mt-1 rounded bg-slate-100 text-slate-600">
              Role: {user?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full Name" error={errors.name?.message} {...register('name')} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Student ID" error={errors.studentId?.message} {...register('studentId')} />
            <Select label="Year of Study" error={errors.year?.message} {...register('year')}>
              <option value="">Select year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
              <option value="5">5th+ Year</option>
            </Select>
          </div>

          <Input label="Department" error={errors.department?.message} {...register('department')} />

          <div className="space-y-1">
            <Input
              label="Phone Number"
              placeholder="+1-555-0100"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <p className="text-3xs text-slate-400 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-600" />
              Private: Only revealed to claimants after an approved claim.
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button type="submit" loading={isSubmitting}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
