// Finds screenshots that have a light and a dark version. Convention: light = "name.ext", dark = "name-dark.ext", same folder.
const modules = import.meta.glob('../bg/*.{avif,webp,png,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export type ThemedImage = { light: string; dark?: string };

function baseOf(path: string): string {
  const file = path.split('/').pop() ?? '';
  return file.replace(/\.[^.]+$/, '');
}

// themedImage('bg-1') returns the URL of bg-1.* and, when it exists, of dark-1.* or bg-1-dark.*
export function themedImage(baseName: string): ThemedImage | undefined {
  let light: string | undefined;
  let dark: string | undefined;
  for (const [path, url] of Object.entries(modules)) {
    const base = baseOf(path);
    if (base === baseName) light = url;
    else if (base === `${baseName}-dark` || (baseName.startsWith('bg-') && base === `dark-${baseName.slice(3)}`)) dark = url;
  }
  return light ? { light, dark } : undefined;
}
