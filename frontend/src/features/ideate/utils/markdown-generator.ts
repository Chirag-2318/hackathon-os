import type { Room, Brief, RoomMember, Idea } from '@/services/types';

export function getFirstSentence(text: string, maxLen = 100): string {
  if (!text) return '';
  const first = text.split(/(?<=[.?!])\s+/)[0] || text;
  if (first.length > maxLen) {
    return first.slice(0, maxLen).trim() + '...';
  }
  return first.trim();
}

export function generateIdeasMarkdown(
  room: Room | null,
  brief: Brief | null,
  members: RoomMember[],
  ideas: Idea[]
): string {
  const roomName = room?.name || 'Hackathon OS';
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const problemStatement = brief?.fields?.problemStatement || 'Not added';
  const approvedIdeas = ideas.filter(i => i.status === 'approved');
  const primaryIdea = approvedIdeas.find(i => i.isPrimary) || approvedIdeas[0];

  let md = `# Ideas: ${roomName}
Generated from the plan on ${dateStr}

## Problem statement
${problemStatement}
`;

  if (primaryIdea) {
    const primaryAuthor = members.find(m => m.id === primaryIdea.authorId)?.displayName || 'Team';
    md += `\n## Primary idea\n${getFirstSentence(primaryIdea.text)} (By ${primaryAuthor})\n`;
  }

  md += `\n## Approved ideas\n`;

  if (approvedIdeas.length === 0) {
    md += 'No ideas approved yet.\n';
  } else {
    approvedIdeas.forEach((idea, idx) => {
      const author = members.find(m => m.id === idea.authorId)?.displayName || 'Team Member';
      const firstSentence = getFirstSentence(idea.text, 100);

      md += `\n### ${idx + 1}. ${firstSentence}\n\n`;
      md += `${idea.text}\n\n`;

      if (idea.links && idea.links.length > 0) {
        md += `Links:\n`;
        idea.links.forEach(l => {
          md += `- [${l.title || l.url}](${l.url})\n`;
        });
        md += `\n`;
      }

      if (idea.notes && idea.notes.length > 0) {
        md += `Notes:\n`;
        idea.notes.forEach(n => {
          md += `- ${n}\n`;
        });
        md += `\n`;
      }

      md += `By ${author}\n`;
    });
  }

  return md;
}

export function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
