/**
 * Preset avatars manifest.
 * Imports the 10 preset images located in frontend/images/
 */
const EXTENSION = 'jfif' as const;

import avatar1 from '../../../images/1.jfif';
import avatar2 from '../../../images/2.jfif';
import avatar3 from '../../../images/3.jfif';
import avatar4 from '../../../images/4.jfif';
import avatar5 from '../../../images/5.jfif';
import avatar6 from '../../../images/6.jfif';
import avatar7 from '../../../images/7.jfif';
import avatar8 from '../../../images/8.jfif';
import avatar9 from '../../../images/9.jfif';
import avatar10 from '../../../images/10.jfif';

export const PRESET_AVATARS_EXTENSION = EXTENSION;

export const PRESET_AVATARS: readonly string[] = [
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  avatar5,
  avatar6,
  avatar7,
  avatar8,
  avatar9,
  avatar10,
] as const;

/**
 * Returns the URL for a 1-based preset index (1..10).
 */
export function getPresetAvatarUrl(presetNumber?: number | null): string | null {
  if (!presetNumber || presetNumber < 1 || presetNumber > PRESET_AVATARS.length) {
    return null;
  }
  return PRESET_AVATARS[presetNumber - 1] ?? null;
}
