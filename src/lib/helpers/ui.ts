/**
 * Truncates text based on screen width
 * @param text - The text to truncate
 * @param screenWidth - The current screen width in pixels
 * @returns Truncated text with ellipsis
 */
export function truncateText(text: string, screenWidth: number): string {
  const minWidth = 320;
  const baseChars = 25;
  const maxLength = baseChars + Math.floor((screenWidth - minWidth) / 6);
  const finalMaxLength = Math.max(baseChars, maxLength);

  if (text.length <= finalMaxLength) {
    return text;
  }

  return text.slice(0, finalMaxLength) + '...';
}
