import { ReactNode } from 'react';
import { Persistent3DProvider } from '@/components/3d-environments/Persistent3DProvider';

export default function Skeleton3DLayout({ children }: { children: ReactNode }) {
  return <Persistent3DProvider>{children}</Persistent3DProvider>;
}
