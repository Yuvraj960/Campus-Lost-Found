import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { itemService } from '../services/itemService.js';
import ItemCard from '../components/ItemCard.jsx';
import Button from '../components/ui/Button.jsx';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';

export default function Landing() {
  const [searchTerm, setSearchTerm] = useState('');
  const [latestItems, setLatestItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const data = await itemService.getItems({ limit: 4, sort: 'newest' });
        setLatestItems(data.items || []);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/lost?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/lost');
    }
  };

  return (
    <div className="space-y-16 py-6 sm:py-12">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Campus-Wide Recovery Network
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-3xl mx-auto leading-tight sm:leading-none">
          Lost it on campus? <br />
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Let’s get it back to you.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Report lost belongings, list items you’ve found, and verify ownership through confidential claims and smart AI matching.
        </p>

        {/* Hero Search Box */}
        <form onSubmit={handleHeroSearch} className="mt-8 max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-2.5 p-2 bg-white rounded-2xl border border-slate-200 shadow-md">
            <div className="flex-1 flex items-center pl-3">
              <Search className="w-5 h-5 text-slate-400 shrink-0 mr-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search laptop, student ID, keys, water bottle..."
                className="w-full py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
              />
            </div>
            <Button type="submit" size="lg" className="sm:w-auto w-full">
              Search Listings
            </Button>
          </div>
        </form>

        {/* Action CTAs */}
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto">
          <Link to="/report/lost" className="flex-1">
            <Button variant="lost" size="lg" className="w-full">
              I Lost Something
            </Button>
          </Link>
          <Link to="/report/found" className="flex-1">
            <Button variant="found" size="lg" className="w-full">
              I Found Something
            </Button>
          </Link>
        </div>
      </section>

      {/* Live Stats Strip */}
      <section className="bg-white border-y border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">850+</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Items Recovered</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-indigo-600 tracking-tight">94%</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Match Accuracy</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600 tracking-tight">12</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Campus Hubs</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">&lt; 24h</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Avg Claim Handover</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (3 Steps) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1">
            Simple 3-Step Process
          </h2>
          <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How Campus Recovery Works
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 font-extrabold text-base flex items-center justify-center mb-4">
              1
            </div>
            <h4 className="font-heading font-bold text-lg text-slate-900 mb-2">1. Post a Report</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Describe what you lost or found with campus location, date, and general photos. Contact info stays private.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-700 font-extrabold text-base flex items-center justify-center mb-4">
              2
            </div>
            <h4 className="font-heading font-bold text-lg text-slate-900 mb-2">2. Match &amp; Claim</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Our AI alerts both parties on strong candidate pairs. Claimants submit unlisted proof only visible to the finder.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-base flex items-center justify-center mb-4">
              3
            </div>
            <h4 className="font-heading font-bold text-lg text-slate-900 mb-2">3. Verified Handover</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Upon approval, direct contact information is revealed to coordinate handover at the campus security desk.
            </p>
          </div>
        </div>
      </section>

      {/* Latest Items Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1">
              Recent Activity
            </h2>
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Latest Listings Across Campus
            </h3>
          </div>
          <Link
            to="/lost"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group"
          >
            Browse all listings
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : latestItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400">No items reported recently.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Trust & Privacy Notice */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-indigo-900 text-white p-8 sm:p-12 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Privacy-First Platform
            </div>
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight">
              Your contact info is never public.
            </h3>
            <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
              We never expose personal phone numbers or email addresses in public listings. Personal contact is unlocked only after a claim with private verification proof is explicitly approved.
            </p>
          </div>
          <Link to="/register" className="shrink-0">
            <Button size="lg" className="bg-white text-indigo-950 hover:bg-slate-100 font-bold">
              Join Campus Portal
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
