import { useEffect } from 'react';

type DocumentMeta = { title: string; description: string };

// Sets (or creates) one <meta> tag and returns a function that puts it back the way it was.
function setMeta(attribute: 'name' | 'property', key: string, content: string): () => void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  const created = element === null;
  const previous = element?.getAttribute('content') ?? null;
  if (element === null) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
  const target = element;
  return () => {
    if (created) target.remove();
    else if (previous !== null) target.setAttribute('content', previous);
  };
}

export function useDocumentMeta({ title, description }: DocumentMeta): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const undo = [
      setMeta('name', 'description', description),
      setMeta('property', 'og:type', 'website'),
      setMeta('property', 'og:title', title),
      setMeta('property', 'og:description', description),
      setMeta('name', 'twitter:card', 'summary'),
      setMeta('name', 'twitter:title', title),
      setMeta('name', 'twitter:description', description),
    ];
    return () => {
      document.title = previousTitle;
      undo.forEach((restore) => restore());
    };
  }, [title, description]);
}
