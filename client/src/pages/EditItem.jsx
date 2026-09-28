import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useNavigate } from 'react-router-dom';
import { CATEGORY, CATEGORY_LABELS } from '../constants/enums.js';
import { CAMPUS_LOCATIONS } from '../constants/locations.js';
import { itemService } from '../services/itemService.js';
import Input from '../components/ui/Input.jsx';
import Textarea from '../components/ui/Textarea.jsx';
import Select from '../components/ui/Select.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const editSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  category: z.string().min(1),
  location: z.string().min(2).max(120),
  date: z.string().min(1),
  contactPreference: z.enum(['IN_APP', 'EMAIL']).default('IN_APP'),
});

export default function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const item = await itemService.getItemById(id);
        reset({
          title: item.title,
          description: item.description,
          category: item.category,
          location: item.location,
          date: item.date ? item.date.split('T')[0] : '',
          contactPreference: item.contactPreference || 'IN_APP',
        });
      } catch (err) {
        toast.error(err.message || 'Failed to load item');
        navigate('/my-reports');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id, reset, navigate]);

  const onSubmit = async (values) => {
    try {
      await itemService.updateItem(id, values);
      toast.success('Listing updated successfully!');
      navigate(`/items/${id}`);
    } catch {
      toast.error('Failed to update listing');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Cancel Edit
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-6">
        <h1 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight">
          Edit Listing Details
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" error={errors.title?.message} {...register('title')} />
          <Textarea label="Description" rows={4} error={errors.description?.message} {...register('description')} />

          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" error={errors.category?.message} {...register('category')}>
              {Object.entries(CATEGORY).map(([k, val]) => (
                <option key={k} value={val}>
                  {CATEGORY_LABELS[val] || val}
                </option>
              ))}
            </Select>
            <Input label="Location" list="locations" error={errors.location?.message} {...register('location')} />
            <datalist id="locations">
              {CAMPUS_LOCATIONS.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" error={errors.date?.message} {...register('date')} />
            <Select label="Contact Preference" error={errors.contactPreference?.message} {...register('contactPreference')}>
              <option value="IN_APP">In-App</option>
              <option value="EMAIL">Email &amp; In-App</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
