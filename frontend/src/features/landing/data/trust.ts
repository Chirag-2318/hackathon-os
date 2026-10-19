export const TRUST_COPY = {
  eyebrow: 'trust',
  headingLead: 'Built to hold up',
  headingEm: 'at hour thirty-five.',
} as const;

// Every line is a verifiable product fact. Do not add badges, certifications or the words "enterprise-grade".
export const TRUST_ROWS = [
  { term: 'Zero client keys', meaning: 'No API key to find, paste or pay for. Nothing sensitive sits in your browser.', detail: 'AI gateway on the backend' },
  { term: 'Encrypted access', meaning: 'GitHub access is stored encrypted, and page scripts cannot read your session.', detail: 'AES-256-GCM · HttpOnly cookies' },
  { term: 'Works on bad wifi', meaning: 'Teammates see changes live. If the connection drops, your room, tasks and docs stay cached and reconnect on their own.', detail: 'Live sync · 20 s polling fallback' },
  { term: 'Yours to take', meaning: 'Export the whole room as a ZIP at any time.', detail: 'ZIP export' },
] as const;
