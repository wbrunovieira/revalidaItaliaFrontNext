// types/lottie-player.d.ts
import type {
  DetailedHTMLProps,
  HTMLAttributes,
} from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lottie-player': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
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
export {};
