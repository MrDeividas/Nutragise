/**
 * Strips a trailing " Challenge" / " challenge" so we match both DB styles:
 * - New: "Gym"
 * - Legacy: "Gym Challenge"
 */
export function stripTrailingChallengeWord(title: string): string {
  return title.replace(/\s+challenge$/i, '').trim();
}
