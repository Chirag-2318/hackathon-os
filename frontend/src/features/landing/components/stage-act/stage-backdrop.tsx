// The theatre around the window. Four soft top lights (one per cue) crossfade by opacity only, so scene changes stay cheap.
export function StageBackdrop({ scene, submitted }: { scene: number; submitted: boolean }) {
  return (
    <div className="l-sgbg" aria-hidden="true">
      <span className="l-sgbg-glow" data-tone="violet" data-on={scene <= 0 ? 'true' : 'false'} />
      <span className="l-sgbg-glow" data-tone="amber" data-on={scene === 1 ? 'true' : 'false'} />
      <span className="l-sgbg-glow" data-tone="mint" data-on={scene === 2 ? 'true' : 'false'} />
      <span className="l-sgbg-glow" data-tone="red" data-on={scene === 3 ? 'true' : 'false'} data-hot={submitted ? 'true' : 'false'} />
      <span className="l-sgbg-beam" />
      <span className="l-sgbg-grid" />
      <span className="l-sgbg-floor" />
      <span className="l-sgbg-vignette" />
    </div>
  );
}
