/**
 * Deterministic generative cover gradients for rooms.
 * Generates 2-3 muted HSL color stops seeded from the roomId.
 */
export interface RoomCover {
  stops: [string, string, string];
  gradient: string;
  meshGradient: string;
  accent: string;
}

export function getRoomCover(roomId: string): RoomCover {
  if (!roomId) {
    const defaultStops: [string, string, string] = [
      'hsl(215, 30%, 82%)',
      'hsl(245, 25%, 80%)',
      'hsl(280, 28%, 85%)',
    ];
    return {
      stops: defaultStops,
      gradient: `linear-gradient(135deg, ${defaultStops[0]} 0%, ${defaultStops[1]} 55%, ${defaultStops[2]} 100%)`,
      meshGradient: `radial-gradient(at 0% 0%, ${defaultStops[0]} 0px, transparent 60%), radial-gradient(at 100% 0%, ${defaultStops[1]} 0px, transparent 65%), radial-gradient(at 100% 100%, ${defaultStops[2]} 0px, transparent 60%), ${defaultStops[0]}`,
      accent: 'hsl(215, 45%, 45%)',
    };
  }

  let hash = 0;
  for (let i = 0; i < roomId.length; i++) {
    hash = (hash << 5) - hash + roomId.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);

  const hue1 = positive % 360;
  const hue2 = (hue1 + 32 + ((positive >> 3) % 36)) % 360;
  const hue3 = (hue2 + 36 + ((positive >> 6) % 32)) % 360;

  // Muted tones: saturation 28-38%, lightness 78-86%
  const stop1 = `hsl(${hue1}, 32%, 82%)`;
  const stop2 = `hsl(${hue2}, 28%, 79%)`;
  const stop3 = `hsl(${hue3}, 34%, 84%)`;

  const gradient = `linear-gradient(135deg, ${stop1} 0%, ${stop2} 55%, ${stop3} 100%)`;
  const meshGradient = `radial-gradient(at 10% 15%, ${stop1} 0px, transparent 55%), radial-gradient(at 90% 10%, ${stop2} 0px, transparent 55%), radial-gradient(at 80% 90%, ${stop3} 0px, transparent 60%), ${stop1}`;
  const accent = `hsl(${hue1}, 52%, 42%)`;

  return {
    stops: [stop1, stop2, stop3],
    gradient,
    meshGradient,
    accent,
  };
}
