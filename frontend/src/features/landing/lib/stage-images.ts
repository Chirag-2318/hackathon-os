const modules = import.meta.glob('../assets/how/*.{avif,webp,png,jpg,jpeg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export type StageImages = { light: string; dark?: string };

// Returns the screenshot of a stage index like '01' (stage-01.*) and, when it exists, its dark version (stage-01-dark.*).
export function stageImages(index: string): StageImages | undefined {
  const entries = Object.entries(modules);
  const light = entries.find(([path]) => path.includes(`/stage-${index}.`));
  if (!light) return undefined;
  const dark = entries.find(([path]) => path.includes(`/stage-${index}-dark.`));
  return { light: light[1], dark: dark?.[1] };
}
