export function ToolsScreen() {
  return (
    <div className="l-ws l-ws--tools">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="l-ws-toolcell">
          <i />
          <span className="l-ws-skel" style={{ width: '60%' }} />
        </div>
      ))}
    </div>
  );
}
