/**
 * EmptySubmission — mini visual showing an unsubmitted form with 0% progress.
 */
const FIELDS = ['Project title', 'Repo link', 'Demo video', 'Team members'] as const;

export function EmptySubmission() {
  return (
    <div className="l-mv l-mv--form" aria-hidden="true">
      <div className="l-mv-fields">
        {FIELDS.map((label) => (
          <div key={label} className="l-mv-field">
            <span>{label}</span>
            <span className="l-mv-input" />
          </div>
        ))}
      </div>
      <div className="l-mv-progress">
        <span>0%</span>
        <span className="l-mv-track">
          <span className="l-mv-fill" style={{ width: '0%' }} />
        </span>
      </div>
    </div>
  );
}
