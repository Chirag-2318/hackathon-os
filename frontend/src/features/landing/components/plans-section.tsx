/**
 * PlansSection — S01 item 5.
 * Source: PRD §3.1 item 5.
 *
 * Three-row comparison table: Free (Prompt Bridge) · Bring your key · Pro.
 * "Honest" (D§6 S01). No price, statistic, testimonial.
 * Uses C15 visual anatomy (header row 40, Label style, rows 56, zebra off).
 * No sort, filter, pagination, or column menu.
 */
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { COPY } from '@/shared/constants/copy';

/** Column definitions — all TBD */
const columns = [
  { key: 'plan', label: 'Plan' },
  { key: 'col1', label: COPY.landing.plansTitle },
  { key: 'col2', label: COPY.landing.plansTitle },
  { key: 'col3', label: COPY.landing.plansTitle },
];

/** Row data — labels from design.md, cells TBD */
const rows = COPY.landing.planRows.map((label) => ({
  plan: label,
  col1: COPY.landing.plansTitle,
  col2: COPY.landing.plansTitle,
  col3: COPY.landing.plansTitle,
}));

export function PlansSection() {
  return (
    <section
      id="plans"
      className="py-16 md:py-24"
      aria-label="Plans comparison"
    >
      <h2 className="text-h1 text-ink-strong mb-8 md:mb-12">
        {COPY.landing.plansTitle}
      </h2>

      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className="h-10 text-label text-ink-muted"
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.plan} className="h-14 hover:bg-transparent">
                <TableCell className="text-body-strong text-ink">
                  {row.plan}
                </TableCell>
                <TableCell className="text-body text-ink-muted">
                  {row.col1}
                </TableCell>
                <TableCell className="text-body text-ink-muted">
                  {row.col2}
                </TableCell>
                <TableCell className="text-body text-ink-muted">
                  {row.col3}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
