export type LedgerStatus = 'built' | 'existing' | 'mocked' | 'planned';

export const LEDGER_STATUSES: { id: LedgerStatus; label: string }[] = [
  { id: 'built', label: 'Built' },
  { id: 'existing', label: 'Existing' },
  { id: 'mocked', label: 'Mocked' },
  { id: 'planned', label: 'Planned' },
];

export type LedgerRow = { id: string; name: string; initial: LedgerStatus; breaks: string };

// Invented components for the fictional "Club budget tracker" project. `breaks` is the honest line shown when the row is Mocked.
export const LEDGER_ROWS: LedgerRow[] = [
  { id: 'dashboard', name: 'Budget dashboard', initial: 'built', breaks: 'Dashboard numbers are sample data. Say so first.' },
  { id: 'scanner', name: 'Receipt scanner', initial: 'mocked', breaks: 'Receipt scanner returns sample data. Say so first.' },
  { id: 'payments', name: 'Payments', initial: 'existing', breaks: 'Payments run in test mode. Say so first.' },
  { id: 'roles', name: 'Club roles', initial: 'built', breaks: 'Club roles are hard-coded. Say so first.' },
  { id: 'reminders', name: 'Email reminders', initial: 'planned', breaks: 'Email reminders are not sent yet. Say so first.' },
  { id: 'export', name: 'Export to Sheets', initial: 'mocked', breaks: 'Export to Sheets shows a preview only. Say so first.' },
];

export const LEDGER_TEXT = {
  barLabel: 'Reality ledger',
  breaksTitle: 'What breaks first',
  breaksEmpty: 'Nothing is mocked. Be ready to show every part live.',
  caption: 'Example ledger with sample data.',
} as const;
