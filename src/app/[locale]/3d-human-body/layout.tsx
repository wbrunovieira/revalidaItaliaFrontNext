import { Persistent3DProvider } from '@/components/3d-environments/Persistent3DProvider';

/**
 * Layout for 3D Human Body routes
 *
 * This layout wraps all 3D routes with the Persistent3DProvider,
 * which keeps the WebGL Canvas mounted between navigations.
 *
 * Benefits:
 * - WebGL context is preserved (no re-initialization)
 * - Loaded models stay in memory
 * - Shaders remain compiled
 * - Faster navigation back to 3D content
 */
export default function HumanBody3DLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Persistent3DProvider>
      {children}
    </Persistent3DProvider>
  );
}
