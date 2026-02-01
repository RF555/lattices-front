/**
 * Returns a relative time string for recent dates and a short formatted date for older ones.
 *
 * - < 60 seconds: "just now"
 * - < 1 hour:     "Xm ago"
 * - < 24 hours:   "Xh ago"
 * - < 7 days:     "Xd ago"
 * - Same year:    "Jan 27"
 * - Other year:   "Jan 27, 2025"
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return 'just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/**
 * Returns a full localized datetime string, suitable for `title` tooltip attributes.
 * Example: "1/27/2026, 3:45:12 PM" (locale-dependent)
 */
export function formatDateFull(isoString: string): string {
  return new Date(isoString).toLocaleString();
}
