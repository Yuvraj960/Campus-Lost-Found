/**
 * Escapes special regex characters in a user-provided string to prevent regex injection.
 */
export const escapeRegex = (str) => {
  if (typeof str !== 'string') {
    return '';
  }
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
