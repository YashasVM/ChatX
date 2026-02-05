/**
 * Format a timestamp for display in the UI
 */
export function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Less than 1 minute ago
  if (diffMins < 1) {
    return 'Just now';
  }

  // Less than 1 hour ago
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }

  // Less than 24 hours ago
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  // Less than 7 days ago
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  // Otherwise show date
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format last seen time for user status
 */
export function formatLastSeen(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Active now';
  }

  if (diffMins < 60) {
    return `Last seen ${diffMins} min ago`;
  }

  if (diffHours < 24) {
    return `Last seen ${diffHours}h ago`;
  }

  if (diffDays === 1) {
    return 'Last seen yesterday';
  }

  if (diffDays < 7) {
    return `Last seen ${diffDays} days ago`;
  }

  return `Last seen ${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })}`;
}
