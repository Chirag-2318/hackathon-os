import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@/design/api';
import { Button } from '@/components/ui/button';

interface FullCapacityCardProps {
  reason?: 'capacity' | 'closed' | string;
  isInline?: boolean;
  onSignIn?: () => void;
}

export function FullCapacityCard({ reason = 'capacity', isInline = false, onSignIn }: FullCapacityCardProps) {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // Honeypot
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isClosed = reason === 'closed';
  const headline = isClosed ? 'Sign-ups are paused for now.' : "We're at capacity.";
  const subline = isClosed
    ? "New sign-ups are temporarily paused. Leave your email and we'll let you know when they reopen."
    : "The first 1,000 spots are taken. Leave your email and we'll let you know when more open.";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch<{ message: string }>('/api/v1/public/waitlist', {
        method: 'POST',
        body: JSON.stringify({ email, website }),
      });
      setIsSuccess(true);
    } catch (err: any) {
      if (err?.code === 'TOO_MANY_REQUESTS' || err?.status === 429) {
        setError('Too many requests. Please try again later.');
      } else {
        // Fallback friendly message
        setIsSuccess(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`w-full max-w-[480px] rounded-xl border border-white/10 bg-[#070708] p-8 text-[#F4F1EA] shadow-2xl transition-all ${
        isInline ? 'my-4' : 'mx-auto'
      }`}
    >
      <h1
        className="text-2xl sm:text-3xl font-normal tracking-tight text-white mb-3"
        style={{ fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)' }}
      >
        {headline}
      </h1>
      <p className="text-sm leading-relaxed text-zinc-400 mb-6">{subline}</p>

      {isSuccess ? (
        <div className="py-4 text-center">
          <p className="font-mono text-sm font-medium text-emerald-400 mb-4">You're on the list.</p>
          <p className="text-xs text-zinc-500 mb-6">
            We'll notify you as soon as spots open up. No spam, ever.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {/* Honeypot field — invisible to users */}
          <div style={{ display: 'none' }} aria-hidden="true">
            <label htmlFor="website-field">Website</label>
            <input
              id="website-field"
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="name@work-email.com"
              required
              className="w-full rounded-md border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 font-mono"
            />
          </div>

          {error && <p className="text-xs text-rose-400 font-mono">{error}</p>}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-black hover:bg-zinc-200 transition-colors font-medium text-sm py-2.5"
          >
            {isSubmitting ? 'Submitting…' : 'Notify me'}
          </Button>
        </form>
      )}

      <div className="pt-2 text-center border-t border-white/10">
        {onSignIn ? (
          <button
            type="button"
            onClick={onSignIn}
            className="text-xs text-zinc-400 hover:text-white transition-colors underline-offset-4 hover:underline"
          >
            Already have an account? Sign in
          </button>
        ) : (
          <Link
            to="/signin"
            className="text-xs text-zinc-400 hover:text-white transition-colors underline-offset-4 hover:underline"
          >
            Already have an account? Sign in
          </Link>
        )}
      </div>
    </div>
  );
}
