import { useState } from 'react';

// A screenshot that has a light and a dark version. Both are rendered and CSS shows the one that matches the page
// theme (see the `.l-shot` rules in landing.css). With no dark version the light one is dimmed in the dark theme.
type ThemedShotProps = {
  light: string;
  dark?: string;
  probeDark?: boolean;               // for images served as plain URLs: try "name-dark.ext" and fall back silently if it does not exist
  alt?: string;                      // empty means decorative
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  dim?: 'filter' | 'opacity';        // how the light picture is dimmed in the dark theme when no dark version exists
};

// Puts "-dark" before the file extension of a URL: /a/b.webp -> /a/b-dark.webp
function darkUrlOf(url: string): string {
  return url.replace(/(\.[^./?#]+)([?#].*)?$/, '-dark$1$2');
}

export function ThemedShot({ light, dark, probeDark = false, alt = '', className = '', width, height, loading = 'lazy', dim = 'filter' }: ThemedShotProps) {
  const [probeFailed, setProbeFailed] = useState(false);
  const darkSrc = dark ?? (probeDark && !probeFailed ? darkUrlOf(light) : undefined);
  const decorative = alt === '';

  if (!darkSrc) {
    return (
      <img
        className={`l-shot l-shot--light l-shot--solo ${className}`.trim()}
        data-dim={dim}
        src={light}
        alt={alt}
        aria-hidden={decorative ? true : undefined}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
      />
    );
  }

  return (
    <>
      <img
        className={`l-shot l-shot--light ${className}`.trim()}
        src={light}
        alt={alt}
        aria-hidden={decorative ? true : undefined}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
      />
      <img
        className={`l-shot l-shot--dark ${className}`.trim()}
        src={darkSrc}
        alt={alt}
        aria-hidden={decorative ? true : undefined}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        onError={() => setProbeFailed(true)}
      />
    </>
  );
}
