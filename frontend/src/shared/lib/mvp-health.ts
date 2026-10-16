/**
 * MVP Health checklist helper
 * Computes done and total strictly from checklist items, ignoring numeric metadata.
 */

export interface MvpHealthSummary {
  done: number;
  total: number;
  allPassed: boolean;
  ratio: number;
}

export function computeMvpHealth(health: any): MvpHealthSummary {
  if (!health) {
    return { done: 0, total: 4, allPassed: false, ratio: 0 };
  }

  // If health is an array of items (e.g. { pass: boolean } or { checked: boolean })
  if (Array.isArray(health)) {
    const total = health.length;
    const done = health.filter((item) => Boolean(item?.pass || item?.checked || item?.done)).length;
    return {
      done,
      total,
      allPassed: total > 0 && done === total,
      ratio: total > 0 ? done / total : 0,
    };
  }

  // If nested under checks
  if (health.checks && typeof health.checks === 'object') {
    return computeMvpHealth(health.checks);
  }

  // If health is an object with boolean flags: ignore numeric/string metadata
  const ignoredKeys = new Set(['passed', 'total', 'updatedAt', 'roomId', 'id', '__typename']);
  const booleanEntries = Object.entries(health).filter(
    ([key, val]) => !ignoredKeys.has(key) && typeof val === 'boolean'
  );

  if (booleanEntries.length > 0) {
    const total = booleanEntries.length;
    const done = booleanEntries.filter(([, val]) => Boolean(val)).length;
    return {
      done,
      total,
      allPassed: total > 0 && done === total,
      ratio: total > 0 ? done / total : 0,
    };
  }

  // Fallback to numeric passed/total if explicitly provided and valid
  const total = typeof health.total === 'number' && health.total > 0 ? health.total : 4;
  const done = typeof health.passed === 'number' ? Math.min(health.passed, total) : 0;
  return {
    done,
    total,
    allPassed: total > 0 && done === total,
    ratio: total > 0 ? done / total : 0,
  };
}
