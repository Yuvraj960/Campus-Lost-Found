import { Mail, Phone, User, CheckCircle2 } from 'lucide-react';

export default function ContactCard({ contact, title = 'Direct Contact Information' }) {
  if (!contact) return null;

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <h4 className="font-heading font-bold text-sm text-emerald-950">{title}</h4>
      </div>
      <p className="text-xs text-emerald-800 mb-4">
        Your claim has been approved! Use the contact details below to coordinate handover.
      </p>

      <div className="space-y-2.5 bg-white p-4 rounded-xl border border-emerald-100 text-sm">
        {contact.name && (
          <div className="flex items-center gap-2.5 text-slate-800">
            <User className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{contact.name}</span>
          </div>
        )}
        {contact.email && (
          <div className="flex items-center gap-2.5 text-slate-700">
            <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
            <a
              href={`mailto:${contact.email}`}
              className="text-indigo-600 hover:underline font-medium"
            >
              {contact.email}
            </a>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-2.5 text-slate-700">
            <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
            <a href={`tel:${contact.phone}`} className="text-indigo-600 hover:underline">
              {contact.phone}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
