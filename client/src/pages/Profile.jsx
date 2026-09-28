import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Button from '../components/ui/Button.jsx';
import { User, Shield, Camera } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2).max(60),
  department: z.string().optional(),
  year: z.string().optional(),
  phone: z.string().optional(),
  studentId: z.string().optional(),
});

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5 MB or smaller.');
      return;
    }
    const formData = new FormData();
    formData.append('profileImage', file);
    try {
      setUploadingAvatar(true);
      await updateUser(formData);
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

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
          <div className="relative group">
            <div className="h-16 w-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl overflow-hidden shadow-2xs">
              {user?.profileImage?.url ? (
                <img src={user.profileImage.url} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>
            <button
              type="button"
              disabled={uploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
              aria-label="Upload profile photo"
              className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-indigo-600 text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-slate-900">{user?.name}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-3xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Role: {user?.role}
              </span>
              {uploadingAvatar && (
                <span className="text-3xs text-indigo-600 animate-pulse font-medium">Uploading photo...</span>
              )}
            </div>
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
