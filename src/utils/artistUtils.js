/**
 * Splits an artist string into individual artist names, handling exceptions.
 * 
 * Exceptions:
 * - "Tyler, The Creator" (keeps the comma)
 * 
 * @param {string} artistString - The raw artist string from metadata (e.g. "Artist A, Artist B")
 * @returns {string[]} - Array of individual artist names
 */
export function splitArtistString(artistString) {
    if (!artistString) return [];

    // 1. Protect exceptions by replacing their internal commas with a placeholder
    // We handle "Tyler, The Creator" (case insensitive for "The")
    let protectedString = artistString.replace(/Tyler, ?[tT]he Creator/g, 'Tyler{{COMMA}} The Creator');

    // 2. Split by standard separators: comma, semicolon, ampersand
    const parts = protectedString.split(/[,;&]/);

    // 3. Restore exceptions and trim whitespace
    return parts.map(part => {
        return part.replace('{{COMMA}}', ',').trim();
    }).filter(Boolean);
}
