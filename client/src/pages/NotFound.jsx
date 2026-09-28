import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
        404 — Page Not Found
      </h1>
      <p className="mt-3 text-base text-slate-500 max-w-md">
        Looks like you took a wrong turn on campus. The page you are looking for has been moved or doesn’t exist.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
        <Link to="/lost">
          <Button>Browse Lost Directory</Button>
        </Link>
      </div>
    </div>
  );
}
