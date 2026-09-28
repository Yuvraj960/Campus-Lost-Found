import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { claimService } from '../services/claimService.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ContactCard from '../components/ui/ContactCard.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { FileCheck2, ArrowRight, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function MyClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const data = await claimService.getMyClaims();
      setClaims(data.items || []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const handleWithdraw = async (claimId) => {
    try {
      await claimService.updateClaimStatus(claimId, { status: 'WITHDRAWN' });
      toast.success('Claim withdrawn');
      loadClaims();
    } catch {
      toast.error('Failed to withdraw claim');
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight">
          My Submitted Claims
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Track the status of ownership claims you have filed for campus items.
        </p>
      </div>

      {claims.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No claims submitted"
          description="When you find or identify your lost item on the board, submit a claim to start verification."
          action={
            <Link to="/lost">
              <Button size="sm">Browse Listings</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Target Listing
                  </span>
                  <Link
                    to={`/items/${claim.item?.id}`}
                    className="font-heading font-bold text-base text-slate-900 hover:text-indigo-600 transition-colors inline-flex items-center gap-1"
                  >
                    {claim.item?.title}
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xs text-slate-400">
                    {format(new Date(claim.createdAt), 'MMM d, yyyy')}
                  </span>
                  <StatusBadge status={claim.status} />
                </div>
              </div>

              {/* Message & Proof Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="font-semibold text-slate-600 block mb-1">Your Message:</span>
                  <p className="text-slate-800">{claim.message}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-600 block mb-1">Confidential Proof Provided:</span>
                  <p className="text-slate-800">{claim.proof}</p>
                </div>
              </div>

              {/* Revealed Contact Card if APPROVED */}
              {claim.status === 'APPROVED' && claim.item?.owner && (
                <ContactCard
                  contact={{
                    name: claim.item.owner.name,
                    email: claim.item.owner.email || `${claim.item.owner.name?.toLowerCase().replace(/\s+/g, '.')}@campus.test`,
                    phone: claim.item.owner.phone || '+1-555-0141',
                  }}
                  title="Item Reporter Contact Information"
                />
              )}

              {/* Action: Withdraw pending */}
              {claim.status === 'PENDING' && (
                <div className="flex justify-end pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWithdraw(claim.id)}
                    className="text-slate-500 hover:text-red-600"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Withdraw Claim
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
