/**
 * NoWifi — mini visual showing a disabled wifi icon with persistent connecting state.
 */
import { WifiOff } from 'lucide-react';

export function NoWifi() {
  return (
    <div className="l-mv l-mv--wifi" aria-hidden="true">
      <WifiOff size={32} strokeWidth={1.75} />
      <span className="l-mv-connecting">Connecting…</span>
    </div>
  );
}
