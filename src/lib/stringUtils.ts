/**
 * Utility functions for text formatting and string manipulation.
 */

/**
 * Capitalizes the first letter of a string, preserving the rest of the text.
 * Example: "salário mensal" -> "Salário mensal"
 */
export function capitalizeFirstLetter(str: string): string {
  if (!str || typeof str !== 'string') return '';
  const trimmed = str.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Capitalizes the first letter of each word (Title Case).
 * Example: "carlos silva" -> "Carlos Silva"
 */
export function toTitleCase(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
