
import type { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      {children}
    </main>
  );
}
