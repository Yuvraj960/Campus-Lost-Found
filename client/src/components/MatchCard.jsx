import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Check, X, ArrowRight } from 'lucide-react';
import Button from './ui/Button.jsx';
import Badge from './ui/Badge.jsx';
import { matchService } from '../services/matchService.js';
import toast from 'react-hot-toast';

export default function MatchCard({ match, onDismissed }) {
  const [dismissing, setDismissing] = useState(false);

  if (!match || match.status === 'DISMISSED') return null;

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await matchService.dismissMatch(match.id);
      toast.success('Match dismissed');
      onDismissed?.(match.id);
    } catch {
      toast.error('Failed to dismiss match');
    } finally {
      setDismissing(false);
    }
  };

  const candidate = match.otherItem;

  return (
    <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-white to-purple-50/30 p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          {match.score}% AI Match
        </div>
        <Badge variant={candidate?.type === 'LOST' ? 'lost' : 'found'} size="sm">
          {candidate?.type === 'LOST' ? 'Lost Item' : 'Found Item'}
        </Badge>
      </div>

      <h4 className="font-heading font-bold text-base text-slate-900 mb-2">
        {candidate?.title || 'Matching campus item'}
      </h4>

      {match.reasoning && (
        <p className="text-xs text-slate-600 mb-3 bg-white/80 p-2.5 rounded-xl border border-purple-100 leading-relaxed">
          {match.reasoning}
        </p>
      )}

      {/* Matching attributes checklist */}
      {match.matchingAttributes?.length > 0 && (
        <div className="mb-4 space-y-1">
          {match.matchingAttributes.map((attr, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
              <span className="flex h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 items-center justify-center shrink-0">
                <Check className="w-3 h-3 stroke-2" />
              </span>
              <span>{attr}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-purple-100 mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDismiss}
          disabled={dismissing}
          className="text-slate-500 hover:text-red-600"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Not a match
        </Button>

        {candidate?.id && (
          <Link to={`/items/${candidate.id}`}>
            <Button size="sm">
              View Item
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
