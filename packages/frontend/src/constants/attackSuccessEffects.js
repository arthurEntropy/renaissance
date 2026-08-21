/**
 * Hardcoded attack success effects per the game rules.
 * Each entry describes the bonus damage at that success tier.
 * Index corresponds to success count - 1 (i.e. index 0 = 1 success ✨).
 */
export const ATTACK_SUCCESS_EFFECTS = [
  { successes: 1, description: 'The attack deals additional damage equal to half your BODY score.' },
  { successes: 2, description: 'The attack deals additional damage equal to your BODY score.' },
  { successes: 3, description: 'The attack deals additional damage equal to twice your BODY score.' },
  { successes: 4, description: 'The attack deals additional damage equal to three times your BODY score.' },
  { successes: 5, description: 'The attack deals additional damage equal to four times your BODY score.' },
]
