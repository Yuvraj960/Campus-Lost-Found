import { useState, useEffect } from 'react';
import { matchService } from '../services/matchService.js';
import MatchCard from '../components/MatchCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { Sparkles } from 'lucide-react';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await matchService.getMyMatches();
        setMatches(data || []);
      } catch {
        //
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

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
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          Intelligent Item Pairing
        </div>
        <h1 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight">
          AI Suggested Matches
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Candidate items that match your active reports based on description, campus location, and date proximity.
        </p>
      </div>

      {matches.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No pending matches found"
          description="Our algorithm automatically checks new items. You will receive an in-app notification when a match is discovered."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onDismissed={(id) => setMatches((prev) => prev.filter((m) => m.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
