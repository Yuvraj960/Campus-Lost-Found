import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { itemService } from '../services/itemService.js';
import { claimService } from '../services/claimService.js';
import { matchService } from '../services/matchService.js';
import { reportService } from '../services/reportService.js';
import { useAuth } from '../context/AuthContext.jsx';
import ImageGallery from '../components/ImageGallery.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import MatchCard from '../components/MatchCard.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Textarea from '../components/ui/Textarea.jsx';
import Select from '../components/ui/Select.jsx';
import ClaimModal from '../components/ClaimModal.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import {
  MapPin,
  Calendar,
  User,
  Shield,
  Flag,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ItemDetails() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [claims, setClaims] = useState([]);
  const [matches, setMatches] = useState([]);
  const [rematching, setRematching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reportReason, setReportReason] = useState('FAKE_LISTING');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchItemData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await itemService.getItemById(id);
      setItem(data);
      if (user && data.owner?.id === user.id) {
        const [claimList, matchList] = await Promise.all([
          itemService.getItemClaims(id).catch(() => []),
          matchService.getMyMatches().catch(() => []),
        ]);
        setClaims(claimList || []);
        setMatches((matchList || []).filter((m) => m.myItem?.id === id));
      }
    } catch (err) {
      toast.error(err.message || 'Item not found');
      navigate('/lost');
    } finally {
      setLoading(false);
    }
  }, [id, user, navigate]);

  const handleRematch = async () => {
    setRematching(true);
    try {
      const res = await matchService.rematchItem(item.id);
      toast.success(res.created ? `Discovered ${res.created} new match(es)!` : 'AI scan complete. No new matches found.');
      fetchItemData();
    } catch {
      toast.error('Failed to run matching');
    } finally {
      setRematching(false);
    }
  };

  useEffect(() => {
    fetchItemData();
  }, [fetchItemData]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!item) return null;

  const isOwner = user && item.owner?.id === user.id;
  const isLost = item.type === 'LOST';
  const isItemActive = item.status === 'ACTIVE';

  const handleStatusChange = async (newStatus) => {
    setSubmittingAction(true);
    try {
      await itemService.updateItemStatus(item.id, newStatus);
      toast.success(`Item status updated to ${newStatus}`);
      fetchItemData();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDeleteItem = async () => {
    setSubmittingAction(true);
    try {
      await itemService.deleteItem(item.id);
      toast.success('Item listing deleted');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to delete item');
    } finally {
      setSubmittingAction(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleClaimDecision = async (claimId, status) => {
    try {
      await claimService.updateClaimStatus(claimId, {
        status,
        decisionNote: status === 'APPROVED' ? 'Approved by item reporter' : 'Declined',
      });
      toast.success(`Claim ${status.toLowerCase()}`);
      fetchItemData();
    } catch {
      toast.error('Failed to process claim');
    }
  };

  const handleSubmitAbuseReport = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to report a listing.');
      navigate('/login');
      return;
    }
    setSubmittingAction(true);
    try {
      await reportService.createReport({
        itemId: item.id || item._id,
        reason: reportReason,
        details: reportDetails,
      });
      toast.success('Listing report submitted for admin review.');
      setReportModalOpen(false);
      setReportDetails('');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.message || 'Failed to submit report');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-indigo-600">
            Home
          </Link>
          <span>/</span>
          <Link to={isLost ? '/lost' : '/found'} className="hover:text-indigo-600">
            {isLost ? 'Lost Items' : 'Found Items'}
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-medium truncate max-w-[200px]">{item.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isLost ? 'lost' : 'found'}>
            {isLost ? 'Lost Report' : 'Found Listing'}
          </Badge>
          <StatusBadge status={item.status} />
        </div>
      </div>

      {/* Main Grid: Gallery + Item Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Gallery (5 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <ImageGallery images={item.images} />

          {/* Privacy Notice Box */}
          <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Shield className="w-4 h-4 text-emerald-600" />
              Verified Handover Protocol
            </div>
            <p className="leading-relaxed">
              Contact info remains private until a claim is reviewed and approved. Handover should occur at the central campus security station.
            </p>
          </div>
        </div>

        {/* Right Column: Information & Actions (7 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-1">
              {item.category?.replace(/_/g, ' ')}
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {item.title}
            </h1>
          </div>

          {/* Meta Details */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs text-xs sm:text-sm">
            <div className="space-y-1">
              <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">
                Campus Location
              </span>
              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{item.location}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">
                Date {isLost ? 'Lost' : 'Found'}
              </span>
              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{item.date ? format(new Date(item.date), 'MMMM d, yyyy') : ''}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-heading text-xs font-bold text-slate-900 uppercase tracking-wider">
              Description
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-2xl border border-slate-200">
              {item.description}
            </p>
          </div>

          {/* Reporter details */}
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                {item.owner?.name?.charAt(0) || <User className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900">{item.owner?.name}</p>
                <p className="text-2xs text-slate-500">
                  {item.owner?.department || 'University Member'} &bull; Year {item.owner?.year || 'N/A'}
                </p>
              </div>
            </div>

            {!isOwner && (
              <button
                type="button"
                onClick={() => setReportModalOpen(true)}
                className="text-2xs font-semibold text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                Report Listing
              </button>
            )}
          </div>

          {/* Actions: Owner vs Non-Owner */}
          {isOwner ? (
            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
              <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Listing Management (Reporter Actions)
              </p>
              <div className="flex flex-wrap gap-2.5">
                <Link to={`/items/${item.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    Edit Details
                  </Button>
                </Link>

                {item.status === 'ACTIVE' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusChange('RESOLVED')}
                    loading={submittingAction}
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Mark Resolved
                  </Button>
                )}

                {item.status !== 'CLOSED' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStatusChange('CLOSED')}
                    loading={submittingAction}
                  >
                    Close Listing
                  </Button>
                )}

                {item.status === 'ACTIVE' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRematch}
                    loading={rematching}
                    className="text-purple-700 border-purple-200 hover:bg-purple-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-600" />
                    AI Match
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="text-red-600 hover:bg-red-50 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {isItemActive ? (
                isAuthenticated ? (
                  <Button
                    size="lg"
                    variant={isLost ? 'found' : 'lost'}
                    onClick={() => setClaimModalOpen(true)}
                    className="w-full text-base font-bold shadow-md"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    {isLost ? 'I found this item' : 'This might be mine (Claim)'}
                  </Button>
                ) : (
                  <div className="p-4 bg-slate-100 rounded-2xl text-center space-y-2">
                    <p className="text-xs text-slate-600">
                      Sign in to submit a claim or report finding this item.
                    </p>
                    <Link to={`/login?redirect=/items/${item.id}`}>
                      <Button size="sm">Sign In to Claim</Button>
                    </Link>
                  </div>
                )
              ) : (
                <div className="p-4 bg-slate-100 rounded-2xl text-center text-xs text-slate-500 font-medium">
                  This listing is currently {item.status.toLowerCase()} and is not accepting claims.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Discovered Matches Section */}
      {isOwner && matches.length > 0 && (
        <section className="mt-12 pt-8 border-t border-purple-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Intelligent Match Engine
              </div>
              <h2 className="font-heading text-xl font-bold text-slate-900 tracking-tight">
                Potential Matches for this Listing ({matches.length})
              </h2>
              <p className="text-xs text-slate-500">
                These candidate items share location, dates, or keywords with your report.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                onDismissed={(matchId) => setMatches((prev) => prev.filter((entry) => entry.id !== matchId))}
              />
            ))}
          </div>
        </section>
      )}

      {/* Owner Claims Review Section */}
      {isOwner && (
        <section className="mt-12 pt-8 border-t border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold text-slate-900 tracking-tight">
                Submitted Claims ({claims.length})
              </h2>
              <p className="text-xs text-slate-500">
                Review proof submitted by students to verify ownership.
              </p>
            </div>
          </div>

          {claims.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              No claims submitted for this listing yet.
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {claim.claimant?.name || 'Student'}
                      </span>
                      <span className="text-2xs text-slate-400">
                        ({claim.claimant?.department || 'Department'})
                      </span>
                    </div>
                    <StatusBadge status={claim.status} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-600 block mb-1">Message:</span>
                      <p className="text-slate-800">{claim.message}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600 block mb-1">Proof details:</span>
                      <p className="text-slate-800 font-medium">{claim.proof}</p>
                    </div>
                  </div>

                  {claim.status === 'PENDING' && (
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClaimDecision(claim.id, 'REJECTED')}
                        className="text-red-600"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Decline
                      </Button>
                      <Button
                        variant="found"
                        size="sm"
                        onClick={() => handleClaimDecision(claim.id, 'APPROVED')}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Approve &amp; Share Contact
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Claim Modal */}
      <ClaimModal
        item={item}
        open={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        onSubmitted={() => fetchItemData()}
      />

      {/* Report Suspicious Listing Modal */}
      <Modal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Report Suspicious Listing"
        description="Help campus admins maintain trusted listings."
      >
        <form onSubmit={handleSubmitAbuseReport} className="space-y-4">
          <Select
            label="Reason for Report"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          >
            <option value="FAKE_LISTING">Fake or Fraudulent Listing</option>
            <option value="SPAM">Spam or Duplicate Post</option>
            <option value="INAPPROPRIATE">Inappropriate Content</option>
            <option value="WRONG_INFO">Incorrect Information</option>
            <option value="OTHER">Other Reason</option>
          </Select>

          <Textarea
            label="Additional Details"
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            placeholder="Explain why this listing is being flagged..."
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setReportModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" loading={submittingAction}>
              Submit Report
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteItem}
        title="Delete this listing?"
        description="Are you sure you want to delete this listing? All claims associated with it will also be removed."
        confirmText="Delete Listing"
        loading={submittingAction}
      />
    </div>
  );
}
