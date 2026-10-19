export function SummaryScreen() {
  return (
    <div className="l-ws l-ws--summary">
      <div>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className="l-ws-skel" style={{ width: '45%', height: '12px' }} />
            <span className="l-ws-skel" style={{ width: '70%', height: '6px' }} />
          </div>
        ))}
      </div>
      <div>
        <div className="l-ws-mix" style={{ width: '100%' }}>
          <span className="l-ws-mixseg" style={{ flexGrow: 3, transform: 'none' }} />
          <span className="l-ws-mixseg l-ws-mixseg--existing" style={{ flexGrow: 2, transform: 'none' }} />
          <span className="l-ws-mixseg l-ws-mixseg--mocked" style={{ flexGrow: 2, transform: 'none' }} />
          <span className="l-ws-mixseg l-ws-mixseg--planned" style={{ flexGrow: 1, transform: 'none' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          <span className="l-ws-skel" style={{ width: '90%' }} />
          <span className="l-ws-skel" style={{ width: '75%' }} />
          <span className="l-ws-skel" style={{ width: '85%' }} />
          <span className="l-ws-skel" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
}
