import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { FullCapacityCard } from './full-capacity-card';
import { BRAND_NAME } from '@/shared/constants/copy';

export function FullPage() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason') || 'capacity';

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#070708] text-[#F4F1EA] select-none">
      <div className="w-full flex justify-center mb-8">
        <span className="font-bold text-lg tracking-wider text-white">{BRAND_NAME}</span>
      </div>

      <FullCapacityCard reason={reason} isInline={false} />

      <footer className="mt-12 text-center text-xs text-zinc-600">
        &copy; {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
      </footer>
    </div>
  );
}
