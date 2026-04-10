export function prettifyAssetFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim() || 'Asset'
}
