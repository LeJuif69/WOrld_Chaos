export type HapticPatternName =
  | 'lightTap'
  | 'dodge'
  | 'attackSwing'
  | 'heavySwing'
  | 'hitImpact'
  | 'heavyHitImpact'
  | 'shieldBlock'
  | 'playerDamaged'
  | 'abilityShockwave'
  | 'abilityGravity'
  | 'abilityShield';

const HAPTIC_PATTERNS: Record<HapticPatternName, number | number[]> = {
  lightTap: 12,
  dodge: 16,
  attackSwing: 14,
  heavySwing: [24, 18, 34],
  hitImpact: 28,
  heavyHitImpact: [38, 22, 54],
  shieldBlock: [22, 16, 30],
  playerDamaged: [45, 25, 45],
  abilityShockwave: [32, 24, 48],
  abilityGravity: [20, 20, 28],
  abilityShield: [24, 18, 36],
};

export function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function triggerHaptic(pattern: HapticPatternName, enabled = true): boolean {
  if (!enabled || !isVibrationSupported()) {
    return false;
  }
  try {
    return navigator.vibrate(HAPTIC_PATTERNS[pattern]);
  } catch {
    return false;
  }
}
