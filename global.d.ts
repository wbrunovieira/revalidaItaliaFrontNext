// global.d.ts
import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lottie-player': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src: string;
          background?: string;
          speed?: number | string;
          loop?: boolean;
          autoplay?: boolean;
        },
        HTMLElement
      >;
    }
  }
}
