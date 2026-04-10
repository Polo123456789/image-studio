export function prettifyAssetFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim() || 'Asset'
}

export function formatAssetFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024))

  return `${(bytes / Math.pow(1024, unitIndex)).toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`
}
