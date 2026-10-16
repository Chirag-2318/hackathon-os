import { Link } from 'react-router-dom';

export function GoodbyePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="bg-surface text-ink rounded-card p-8 max-w-md w-full text-center border border-border">
        <div className="font-serif text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
          Hackathon OS
        </div>
        <h1 className="font-serif text-2xl font-bold text-ink mb-3">
          Your account has been deleted.
        </h1>
        <p className="text-sm text-ink-2 mb-8 leading-relaxed">
          All your personal data, integration credentials, and private rooms have been permanently removed. If you sign in again in the future, a fresh account will be created.
        </p>
        <Link
          to="/signin"
          className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 bg-ink text-surface font-medium rounded-md text-sm hover:opacity-90 transition-opacity"
        >
          Return to sign in
        </Link>
      </div>
    </div>
  );
}
