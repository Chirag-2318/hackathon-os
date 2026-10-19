import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
  LEDGER_ROWS,
  LEDGER_STATUSES,
  LEDGER_TEXT,
} from '../data/ledger-demo';
import type { LedgerStatus } from '../data/ledger-demo';

export function LedgerDemo() {
  const [statuses, setStatuses] = useState<Record<string, LedgerStatus>>(() =>
    Object.fromEntries(LEDGER_ROWS.map((row) => [row.id, row.initial])),
  );
  const optionRefs = useRef<Record<string, (HTMLButtonElement | null)[]>>({});

  const counts: Record<LedgerStatus, number> = {
    built: 0,
    existing: 0,
    mocked: 0,
    planned: 0,
  };
  for (const s of Object.values(statuses)) {
    counts[s] = (counts[s] ?? 0) + 1;
  }

  const mockedRows = LEDGER_ROWS.filter((row) => statuses[row.id] === 'mocked');

  const setStatus = (rowId: string, status: LedgerStatus) => {
    setStatuses((previous) => ({ ...previous, [rowId]: status }));
  };

  const onRadioKey = (event: KeyboardEvent<HTMLDivElement>, rowId: string) => {
    const currentStatus = statuses[rowId];
    const currentIndex = LEDGER_STATUSES.findIndex((s) => s.id === currentStatus);
    const last = LEDGER_STATUSES.length - 1;
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = currentIndex === last ? 0 : currentIndex + 1;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = currentIndex === 0 ? last : currentIndex - 1;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = last;
    } else {
      return;
    }
    event.preventDefault();
    const nextStatus = LEDGER_STATUSES[nextIndex].id;
    setStatus(rowId, nextStatus);
    optionRefs.current[rowId]?.[nextIndex]?.focus();
  };

  return (
    <div className="l-dive-frame">
      <div className="l-dive-frame-top">
        <span className="l-demo-bar-label">{LEDGER_TEXT.barLabel}</span>
      </div>
      <div className="l-ledger-bar" aria-hidden="true">
        {LEDGER_STATUSES.map((status) => (
          <span
            key={status.id}
            className="l-ledger-seg"
            data-status={status.id}
            style={{ flexGrow: counts[status.id] }}
          />
        ))}
      </div>
      <ul className="l-ledger-legend">
        {LEDGER_STATUSES.map((status) => (
          <li key={status.id}>
            <span className="l-ledger-swatch" data-status={status.id} aria-hidden="true" />
            {`${status.label} ${counts[status.id]}`}
          </li>
        ))}
      </ul>
      <ul className="l-ledger-rows">
        {LEDGER_ROWS.map((row) => (
          <li key={row.id} className="l-ledger-row">
            <span className="l-ledger-name">{row.name}</span>
            <div
              className="l-pick"
              role="radiogroup"
              aria-label={`${row.name} status`}
              onKeyDown={(event) => onRadioKey(event, row.id)}
            >
              {LEDGER_STATUSES.map((status, index) => (
                <button
                  key={status.id}
                  ref={(element) => {
                    const list = optionRefs.current[row.id] ?? [];
                    list[index] = element;
                    optionRefs.current[row.id] = list;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={statuses[row.id] === status.id}
                  tabIndex={statuses[row.id] === status.id ? 0 : -1}
                  className="l-pick-option"
                  onClick={() => setStatus(row.id, status.id)}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <div className="l-breaks">
        <p className="l-breaks-title">{LEDGER_TEXT.breaksTitle}</p>
        {mockedRows.length > 0 ? (
          <ul className="l-breaks-list">
            {mockedRows.map((row) => (
              <li key={row.id} className="l-rise">
                <span className="l-breaks-dot" aria-hidden="true" />
                {row.breaks}
              </li>
            ))}
          </ul>
        ) : (
          <p className="l-breaks-empty">{LEDGER_TEXT.breaksEmpty}</p>
        )}
      </div>
      <p className="l-sr-only" aria-live="polite">
        {`${counts.built} built, ${counts.existing} existing, ${counts.mocked} mocked, ${counts.planned} planned`}
      </p>
    </div>
  );
}
