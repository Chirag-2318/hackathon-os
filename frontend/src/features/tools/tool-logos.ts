const files = import.meta.glob('/src/assets/tool-logos/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export function getToolLogo(name: string): string | undefined {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return files[`/src/assets/tool-logos/${slug}.svg`];
}
