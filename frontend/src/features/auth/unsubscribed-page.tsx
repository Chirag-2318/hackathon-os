import { Link } from 'react-router-dom';

export function UnsubscribedPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center p-4">
      <div className="bg-[#F6F3EC] text-[#2C2A26] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border border-[#E2DDD3]">
        <div className="font-serif text-sm font-bold text-[#8E8980] uppercase tracking-wider mb-3">
          Hackathon OS
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#0B0B0C] mb-3">
          Reminders Paused
        </h1>
        <p className="text-sm leading-relaxed text-[#4A4740] mb-8">
          You have been unsubscribed from deadline and countdown reminder emails.
          Direct team invites and essential transactional updates will still be delivered.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-[#0B0B0C] text-[#F6F3EC] rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Return to Hackathon OS
        </Link>
      </div>
    </div>
  );
}
