import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from './ui/Modal.jsx';
import Textarea from './ui/Textarea.jsx';
import Button from './ui/Button.jsx';
import { claimService } from '../services/claimService.js';
import toast from 'react-hot-toast';
import { ShieldAlert } from 'lucide-react';

const claimSchema = z.object({
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(500, 'Message cannot exceed 500 characters'),
  proof: z
    .string()
    .min(10, 'Proof details must be at least 10 characters')
    .max(500, 'Proof details cannot exceed 500 characters'),
});

export default function ClaimModal({ item, open, onClose, onSubmitted }) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      message: '',
      proof: '',
    },
  });

  const onSubmit = async (values) => {
    if (!item?.id) return;
    setLoading(true);
    try {
      await claimService.createClaim({
        itemId: item.id,
        message: values.message,
        proof: values.proof,
      });
      toast.success('Claim submitted successfully!');
      reset();
      onSubmitted?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to submit claim');
    } finally {
      setLoading(false);
    }
  };

  const isFound = item?.type === 'FOUND';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isFound ? 'Claim this item ("This might be mine")' : 'Report Found ("I found this")'}
      description={`Submitting claim for: ${item?.title || ''}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>Verification Note:</strong> In the proof field, provide a detail or distinguishing feature that is <em>not</em> mentioned in the public listing.
          </p>
        </div>

        <Textarea
          label="Claim Message"
          placeholder="Explain where and when you lost/found this, and why you believe it matches."
          rows={3}
          error={errors.message?.message}
          {...register('message')}
        />

        <Textarea
          label="Proof & Identifying Details"
          placeholder="E.g., specific scratches, lock screen picture, contents inside, unique keychain charm, etc."
          rows={3}
          helperText="Visible only to the item reporter upon reviewing your claim."
          error={errors.proof?.message}
          {...register('proof')}
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Submit Claim
          </Button>
        </div>
      </form>
    </Modal>
  );
}
