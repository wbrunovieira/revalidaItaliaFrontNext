// Custom image loader for S3 CDN
export default function imageLoader({ src }: { src: string }) {
  // If the image is already a full URL, return it as is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  // Use CDN URL from environment variable
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || '';
  
  // If no CDN URL is configured, fall back to relative path
  if (!cdnUrl) {
    return src;
  }
  
  // Handle images that already have /public in path
  if (src.startsWith('/public/')) {
    return `${cdnUrl}${src.substring(7)}`;
  }
  
  // For other paths, prepend CDN URL
  if (src.startsWith('/')) {
    return `${cdnUrl}${src}`;
  }
  
  // Default case - add slash if needed
  return `${cdnUrl}/${src}`;
}