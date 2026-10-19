/**
 * UnreadRubric — mini visual showing an unread PDF with warning tag.
 */
export function UnreadRubric() {
  return (
    <div className="l-mv l-mv--rubric" aria-hidden="true">
      <div className="l-mv-head">
        <span>Rubric.pdf</span>
        <span className="l-mv-unread" />
      </div>
      <div className="l-mv-bars">
        <span className="l-mv-bar" style={{ width: '92%' }} />
        <span className="l-mv-bar" style={{ width: '100%' }} />
        <span className="l-mv-bar" style={{ width: '74%' }} />
        <span className="l-mv-bar" style={{ width: '86%' }} />
      </div>
      <span className="l-mv-tag l-mv-tag--danger">video missing</span>
    </div>
  );
}
