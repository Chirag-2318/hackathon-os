import type { ToolsResponse, ToolCategory, ToolCost, ToolLicense, Tool } from './types';

interface ToolFilters {
  category?: ToolCategory;
  cost?: ToolCost;
  license?: ToolLicense;
}

export const CURATED_TOOLS: Tool[] = [
  // ── Recording ──
  {
    id: 'tool-screenity',
    name: 'Screenity',
    oneLineUse: 'Free, open-source screen and camera recorder with drawing tools and export to MP4/GIF.',
    category: 'Recording',
    cost: 'Free',
    license: 'Open source',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://github.com/alyssaxuu/screenity',
  },
  {
    id: 'tool-obs',
    name: 'OBS Studio',
    oneLineUse: 'Powerful open-source software for video recording and multi-source window capture.',
    category: 'Recording',
    cost: 'Free',
    license: 'Open source',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://obsproject.com',
  },
  {
    id: 'tool-loom',
    name: 'Loom',
    oneLineUse: 'Instant screen recording with camera bubble and rapid shareable cloud links.',
    category: 'Recording',
    cost: 'Freemium',
    license: 'Proprietary',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://www.loom.com',
  },
  {
    id: 'tool-recordly',
    name: 'Recordly',
    oneLineUse: 'Lightweight screen recorder and editor designed for quick product demos and tutorials.',
    category: 'Recording',
    cost: 'Free',
    license: 'Open source',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://github.com/recordly/recordly',
  },
  {
    id: 'tool-sharex',
    name: 'ShareX',
    oneLineUse: 'Screen capture, annotated callouts, and GIF recordings for presentation decks and READMEs.',
    category: 'Recording',
    cost: 'Free',
    license: 'Open source',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://getsharex.com',
  },

  // ── Video ──
  {
    id: 'tool-remotion',
    name: 'Remotion',
    oneLineUse: 'Create real MP4 demonstration videos programmatically using React, HTML, and CSS.',
    category: 'Video',
    cost: 'Freemium',
    license: 'Open source',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://www.remotion.dev',
  },
  {
    id: 'tool-repoclip',
    name: 'RepoClip',
    oneLineUse: 'Automated repo-to-promo-video tool that generates short demonstration reels from GitHub code.',
    category: 'Video',
    cost: 'Freemium',
    license: 'Proprietary',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://repoclip.com',
  },
  {
    id: 'tool-capcut',
    name: 'CapCut',
    oneLineUse: 'Fast desktop & web video editor with auto-captions, voiceovers, and transitions.',
    category: 'Video',
    cost: 'Free',
    license: 'Proprietary',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://www.capcut.com',
  },
  {
    id: 'tool-shotcut',
    name: 'Shotcut',
    oneLineUse: 'Cross-platform video editor with 4K support and timeline scrubbing for demo cutdowns.',
    category: 'Video',
    cost: 'Free',
    license: 'Open source',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://shotcut.org',
  },

  // ── Diagrams ──
  {
    id: 'tool-mermaid',
    name: 'Mermaid Live Editor',
    oneLineUse: 'In-browser editor and live preview tool for Mermaid architecture graphs and sequence diagrams.',
    category: 'Diagrams',
    cost: 'Free',
    license: 'Open source',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://mermaid.live',
  },
  {
    id: 'tool-excalidraw',
    name: 'Excalidraw',
    oneLineUse: 'Collaborative whiteboard tool that lets you sketch system architectures with a hand-drawn feel.',
    category: 'Diagrams',
    cost: 'Free',
    license: 'Open source',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://excalidraw.com',
  },
  {
    id: 'tool-diagramsnet',
    name: 'diagrams.net',
    oneLineUse: 'Full-featured diagramming tool (formerly draw.io) supporting detailed cloud architectures.',
    category: 'Diagrams',
    cost: 'Free',
    license: 'Open source',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://app.diagrams.net',
  },
  {
    id: 'tool-eraser',
    name: 'Eraser.io',
    oneLineUse: 'Markdown & AI-assisted diagrams for technical design docs and pitch deck architecture slides.',
    category: 'Diagrams',
    cost: 'Freemium',
    license: 'Proprietary',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://www.eraser.io',
  },

  // ── Design ──
  {
    id: 'tool-figma',
    name: 'Figma',
    oneLineUse: 'Collaborative interface design, rapid wireframing, and interactive UI prototyping tool.',
    category: 'Design',
    cost: 'Freemium',
    license: 'Proprietary',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://www.figma.com',
  },
  {
    id: 'tool-penpot',
    name: 'Penpot',
    oneLineUse: 'Open-source web-based design and prototyping tool built entirely on open web standards.',
    category: 'Design',
    cost: 'Free',
    license: 'Open source',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://penpot.app',
  },
  {
    id: 'tool-canva',
    name: 'Canva',
    oneLineUse: 'Fast graphic and slide presentation editor with thousands of ready-made hackathon templates.',
    category: 'Design',
    cost: 'Freemium',
    license: 'Proprietary',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://www.canva.com',
  },
  {
    id: 'tool-coolors',
    name: 'Coolors',
    oneLineUse: 'Lightning-fast palette generator for cohesive, high-contrast UI color schemes.',
    category: 'Design',
    cost: 'Free',
    license: 'Proprietary',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://coolors.co',
  },
  {
    id: 'tool-lucide',
    name: 'Lucide Icons',
    oneLineUse: 'Consistent, clean SVG icon suite for web applications and hackathon pitch visuals.',
    category: 'Design',
    cost: 'Free',
    license: 'Open source',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://lucide.dev',
  },

  // ── API ──
  {
    id: 'tool-swagger',
    name: 'Swagger Editor',
    oneLineUse: 'Browser-based editor for designing and documenting APIs using OpenAPI Specification.',
    category: 'API',
    cost: 'Free',
    license: 'Open source',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://editor.swagger.io',
  },
  {
    id: 'tool-hoppscotch',
    name: 'Hoppscotch',
    oneLineUse: 'Open-source, lightweight API request ecosystem and fast alternative to desktop clients.',
    category: 'API',
    cost: 'Free',
    license: 'Open source',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://hoppscotch.com',
  },
  {
    id: 'tool-postman',
    name: 'Postman',
    oneLineUse: 'Industry-standard API platform for sending requests, inspecting responses, and testing endpoints.',
    category: 'API',
    cost: 'Freemium',
    license: 'Proprietary',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://www.postman.com',
  },
  {
    id: 'tool-bruno',
    name: 'Bruno',
    oneLineUse: 'Fast, offline-first open-source API client that stores collections directly in your Git repository.',
    category: 'API',
    cost: 'Free',
    license: 'Open source',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://www.usebruno.com',
  },

  // ── Deployment ──
  {
    id: 'tool-vercel',
    name: 'Vercel',
    oneLineUse: 'Frontend cloud platform for static sites and full-stack frameworks with instant preview links.',
    category: 'Deployment',
    cost: 'Freemium',
    license: 'Proprietary',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://vercel.com',
  },
  {
    id: 'tool-supabase',
    name: 'Supabase',
    oneLineUse: 'Open source Firebase alternative providing instant PostgreSQL database, Auth, and Storage.',
    category: 'Deployment',
    cost: 'Freemium',
    license: 'Open source',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://supabase.com',
  },
  {
    id: 'tool-railway',
    name: 'Railway',
    oneLineUse: 'Deploy full-stack web servers, workers, and databases instantly from any GitHub repo.',
    category: 'Deployment',
    cost: 'Freemium',
    license: 'Proprietary',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://railway.app',
  },
  {
    id: 'tool-render',
    name: 'Render',
    oneLineUse: 'Unified cloud to build and run all your web apps and background jobs with free SSL certificates.',
    category: 'Deployment',
    cost: 'Freemium',
    license: 'Proprietary',
    lastChecked: '2026-10-11',
    verified: true,
    url: 'https://render.com',
  },
];

function normalizeCategory(rawCat: string): ToolCategory {
  const c = (rawCat || '').toLowerCase();
  if (c.includes('record')) return 'Recording';
  if (c.includes('video')) return 'Video';
  if (c.includes('diagram')) return 'Diagrams';
  if (c.includes('design')) return 'Design';
  if (c.includes('api')) return 'API';
  if (c.includes('deploy') || c.includes('host') || c.includes('cloud') || c.includes('data') || c.includes('util')) return 'Deployment';
  return 'Diagrams';
}

function normalizeCost(rawCost: string): ToolCost {
  const c = (rawCost || '').toUpperCase();
  if (c === 'OPEN_SOURCE' || c === 'FREE') return 'Free';
  if (c === 'FREEMIUM') return 'Freemium';
  if (c === 'PAID') return 'Paid';
  return 'Free';
}

function normalizeLicense(rawLic: string): ToolLicense {
  const l = (rawLic || '').toLowerCase();
  if (l.includes('mit') || l.includes('apache') || l.includes('gpl') || l.includes('open') || l.includes('bsd')) {
    return 'Open source';
  }
  return 'Proprietary';
}

export async function fetchTools(filters?: ToolFilters): Promise<ToolsResponse> {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.cost)     params.set('cost', filters.cost);
  if (filters?.license)  params.set('license', filters.license);

  try {
    const res = await fetch(`/api/v1/tools?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      const rawTools = Array.isArray(data.tools) ? data.tools : (Array.isArray(data.items) ? data.items : []);
      if (rawTools.length > 0) {
        const normalized: Tool[] = rawTools.map((t: any) => ({
          id: String(t.id || t.name),
          name: t.name,
          oneLineUse: t.oneLineUse || t.description || t.notes || 'Vetted tool for hackathon teams.',
          category: normalizeCategory(t.category),
          cost: normalizeCost(t.cost),
          license: normalizeLicense(t.license),
          lastChecked: t.lastChecked ? String(t.lastChecked) : '2026-10-11',
          verified: t.verified ?? true,
          url: t.url || 'https://google.com',
        }));
        return { tools: normalized };
      }
    }
  } catch (err) {
    console.warn('Backend tools endpoint unreachable, falling back to curated tools catalog:', err);
  }

  // Resilient fallback: return full curated tools catalog matching filters
  let tools = [...CURATED_TOOLS];
  if (filters?.category) {
    tools = tools.filter(t => t.category.toLowerCase() === filters.category!.toLowerCase());
  }
  if (filters?.cost) {
    tools = tools.filter(t => t.cost.toLowerCase() === filters.cost!.toLowerCase());
  }
  if (filters?.license) {
    tools = tools.filter(t => t.license.toLowerCase() === filters.license!.toLowerCase());
  }
  return { tools };
}
