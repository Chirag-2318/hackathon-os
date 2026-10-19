/**
 * EmptyDemo — mini visual showing a blank URL bar with an infinite loading spinner.
 */
export function EmptyDemo() {
  return (
    <div className="l-mv l-mv--demo" aria-hidden="true">
      <div className="l-mv-urlbar">
        <span>live url</span>
        <span>—</span>
      </div>
      <div className="l-mv-stage">
        <span className="l-mv-spinner" />
      </div>
    </div>
  );
}
