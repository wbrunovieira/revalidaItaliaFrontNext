'use client';

import { Fragment } from 'react';

interface LinkifyTextProps {
  text: string;
  className?: string;
}

/**
 * Component that automatically converts URLs in text to clickable links
 * Opens links in a new tab with proper security attributes
 */
export function LinkifyText({ text, className }: LinkifyTextProps) {
  // Regex to match URLs (http, https, and www)
  const urlRegex = /(https?:\/\/[^\s<>\"\']+|www\.[^\s<>\"\']+)/gi;

  // Split text by URLs while keeping the URLs in the result
  const parts = text.split(urlRegex);

  // Build result array alternating between text and links
  const result: React.ReactNode[] = [];

  parts.forEach((part, index) => {
    if (!part) return;

    // Check if this part is a URL
    if (urlRegex.test(part)) {
      // Reset regex lastIndex after test
      urlRegex.lastIndex = 0;

      // Ensure URL has protocol
      const href = part.startsWith('http') ? part : `https://${part}`;

      result.push(
        <a
          key={`link-${index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary hover:text-secondary/80 underline underline-offset-2 transition-colors break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    } else {
      result.push(<Fragment key={`text-${index}`}>{part}</Fragment>);
    }
  });

  return <span className={className}>{result}</span>;
}

export default LinkifyText;
