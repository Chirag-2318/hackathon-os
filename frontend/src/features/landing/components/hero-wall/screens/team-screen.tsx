const members = [
  { initial: 'A', role: 'Frontend', skills: ['React', 'CSS'] },
  { initial: 'M', role: 'Backend',  skills: ['API', 'Data'] },
  { initial: 'R', role: 'Design',   skills: ['Figma'] },
  { initial: 'S', role: 'Pitch',    skills: ['Speaking', 'Video'] },
];

export function TeamScreen() {
  return (
    <div className="l-ws l-ws--team">
      <div className="l-ws-head">
        <span className="l-ws-title">Team</span>
        <span className="l-ws-chip l-ws-chip--brand">4 members</span>
      </div>
      <div className="l-ws-rows">
        {members.map((m) => (
          <div key={m.initial} className="l-ws-person">
            <span className="l-ws-avatar">{m.initial}</span>
            <span className="l-ws-personrole">{m.role}</span>
            <span className="l-ws-skills">
              {m.skills.map((s) => (
                <span key={s} className="l-ws-tag">
                  {s}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
      <div className="l-ws-gap">
        <span className="l-ws-chip l-ws-chip--warn l-ws-gap__off">Gap: demo video, unassigned</span>
        <span className="l-ws-chip l-ws-chip--ok l-ws-gap__on">Demo video: assigned to S</span>
      </div>
    </div>
  );
}
