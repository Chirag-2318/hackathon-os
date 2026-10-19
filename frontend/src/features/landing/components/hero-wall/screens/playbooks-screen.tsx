import { PLAYBOOKS } from '../../../data/playbooks';

const PLAYBOOK_NAMES = [
  PLAYBOOKS.find((p) => p.id === 'sih')?.name ?? 'Smart India Hackathon',
  PLAYBOOKS.find((p) => p.id === 'mlh')?.name ?? 'MLH weekend sprint',
  PLAYBOOKS.find((p) => p.id === 'devpost')?.name ?? 'Devpost online event',
];

export function PlaybooksScreen() {
  return (
    <div className="l-ws l-ws--playbooks">
      {PLAYBOOK_NAMES.map((name) => (
        <div key={name} className="l-ws-minicard">
          <div>
            <strong>{name}</strong>
            <span className="l-ws-skel" style={{ width: '80%', marginTop: '8px' }} />
            <span className="l-ws-skel" style={{ width: '60%', marginTop: '4px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <span className="l-ws-skel" style={{ width: '36px' }} />
            <svg viewBox="0 0 22 22" width="22" height="22" aria-hidden="true">
              <circle cx="11" cy="11" r="9" fill="none" stroke="var(--border)" strokeWidth="2.5" />
              <circle
                cx="11"
                cy="11"
                r="9"
                fill="none"
                stroke="var(--brand-from)"
                strokeWidth="2.5"
                strokeDasharray="56.5"
                strokeDashoffset="18"
                strokeLinecap="round"
                transform="rotate(-90 11 11)"
              />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
