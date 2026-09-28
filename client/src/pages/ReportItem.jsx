import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { CATEGORY, CATEGORY_LABELS } from '../constants/enums.js';
import { CAMPUS_LOCATIONS } from '../constants/locations.js';
import { itemService } from '../services/itemService.js';
import Input from '../components/ui/Input.jsx';
import Textarea from '../components/ui/Textarea.jsx';
import Select from '../components/ui/Select.jsx';
import Button from '../components/ui/Button.jsx';
import ImageUploader from '../components/ImageUploader.jsx';
import { Sparkles, HelpCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const reportSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description cannot exceed 1000 characters'),
  category: z.string().min(1, 'Please select a category'),
  location: z
    .string()
    .min(2, 'Location must be at least 2 characters')
    .max(120, 'Location cannot exceed 120 characters'),
  date: z.string().min(1, 'Please specify the date'),
  contactPreference: z.enum(['IN_APP', 'EMAIL']).default('IN_APP'),
});

export default function ReportItem({ forcedType }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine type: prop or URL pathname
  const itemType = forcedType || (location.pathname.includes('/lost') ? 'LOST' : 'FOUND');
  const isLost = itemType === 'LOST';

  const [files, setFiles] = useState([]);
  const [aiSuggesting, setAiSuggesting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      location: '',
      date: new Date().toISOString().split('T')[0],
      contactPreference: 'IN_APP',
    },
  });

  const descriptionValue = watch('description');

  // AI Assist feature: "Help me describe it"
  const handleAiAssist = async () => {
    if (!descriptionValue || descriptionValue.length < 5) {
      toast('Type a few messy words in the description first!', { icon: '💡' });
      return;
    }
    setAiSuggesting(true);
    // Simulate AI assist parsing
    setTimeout(() => {
      const lower = descriptionValue.toLowerCase();
      if (lower.includes('phone') || lower.includes('samsung') || lower.includes('iphone')) {
        setValue('category', CATEGORY.ELECTRONICS, { shouldValidate: true });
        setValue('title', isLost ? 'Lost Smartphone on Campus' : 'Found Smartphone on Campus', { shouldValidate: true });
      } else if (lower.includes('key')) {
        setValue('category', CATEGORY.KEYS, { shouldValidate: true });
        setValue('title', isLost ? 'Lost Set of Keys' : 'Found Set of Keys', { shouldValidate: true });
      } else if (lower.includes('water') || lower.includes('bottle') || lower.includes('flask')) {
        setValue('category', CATEGORY.SPORTS, { shouldValidate: true });
        setValue('title', isLost ? 'Lost Water Bottle' : 'Found Water Bottle', { shouldValidate: true });
      } else {
        setValue('category', CATEGORY.OTHER, { shouldValidate: true });
        setValue('title', `${isLost ? 'Lost' : 'Found'} Campus Item`, { shouldValidate: true });
      }
      toast.success('AI suggestion applied to title & category!');
      setAiSuggesting(false);
    }, 500);
  };

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => formData.append(k, v));
      formData.append('type', itemType);
      files.forEach((file) => formData.append('images', file));

      await itemService.createItem(formData);
      toast.success(`${isLost ? 'Lost report' : 'Found item'} submitted!`);
      navigate('/my-reports');
    } catch (err) {
      if (err.details && Array.isArray(err.details)) {
        err.details.forEach((d) => {
          if (d.path) {
            setError(d.path, { type: 'server', message: d.message });
          }
        });
      }
      toast.error(err.message || 'Failed to submit report');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 bg-slate-100 text-slate-700">
            {isLost ? 'Lost Item Report' : 'Found Item Listing'}
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isLost ? 'What did you misplace?' : 'Found something? Help its owner find it.'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Provide details below so our smart matching engine can connect you with the right person.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <Input
            label="Listing Title"
            placeholder={isLost ? 'e.g. Silver iPad Air with blue magnetic case' : 'e.g. Found calculator in Library study carrel'}
            error={errors.title?.message}
            {...register('title')}
          />

          {/* Description with AI Assist */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Detailed Description
              </label>
              <button
                type="button"
                onClick={handleAiAssist}
                disabled={aiSuggesting}
                className="inline-flex items-center gap-1 text-2xs font-bold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {aiSuggesting ? 'Analyzing...' : 'Help me describe it (AI)'}
              </button>
            </div>
            <Textarea
              rows={4}
              placeholder="Describe color, size, brands, or notable marks. If FOUND, keep private details unlisted so claimants can prove ownership."
              error={errors.description?.message}
              {...register('description')}
            />
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Item Category"
              error={errors.category?.message}
              {...register('category')}
            >
              <option value="">Select a category</option>
              {Object.entries(CATEGORY).map(([key, val]) => (
                <option key={key} value={val}>
                  {CATEGORY_LABELS[val] || val}
                </option>
              ))}
            </Select>

            <div>
              <Input
                label="Campus Location"
                placeholder="e.g. Library, Cafeteria, Sports Complex"
                list="location-options"
                error={errors.location?.message}
                {...register('location')}
              />
              <datalist id="location-options">
                {CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Date & Contact Preference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`Date ${isLost ? 'Lost' : 'Found'}`}
              type="date"
              max={new Date().toISOString().split('T')[0]}
              error={errors.date?.message}
              {...register('date')}
            />

            <Select
              label="Contact Preference (After Approval)"
              error={errors.contactPreference?.message}
              {...register('contactPreference')}
            >
              <option value="IN_APP">In-App Notifications Only</option>
              <option value="EMAIL">Campus Email &amp; In-App</option>
            </Select>
          </div>

          {/* Image Upload */}
          <ImageUploader
            files={files}
            onChange={setFiles}
            max={5}
          />

          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-xs text-indigo-950 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p>
              Your listing will be instantly added to campus directories and checked against matching records.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isLost ? 'lost' : 'found'}
              loading={isSubmitting}
              size="lg"
            >
              Publish {isLost ? 'Lost Report' : 'Found Listing'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
