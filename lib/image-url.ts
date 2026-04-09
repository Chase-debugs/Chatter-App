/**
 * Converts a blob pathname to a URL that can be used to display the image.
 * For private blobs, this routes through /api/file to handle authentication.
 */
export function getImageUrl(pathname: string | null | undefined): string | null {
  if (!pathname) return null
  
  // If it's already a full URL (legacy public blob or external URL), return as-is
  if (pathname.startsWith('http://') || pathname.startsWith('https://')) {
    return pathname
  }
  
  // For private blob pathnames, route through our API
  return `/api/file?pathname=${encodeURIComponent(pathname)}`
}
