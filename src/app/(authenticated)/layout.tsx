
'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Skeleton } from '@/components/ui/skeleton'; 
import Link from 'next/link';

const GitHubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);


export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { currentUser, isLoading, appUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push('/'); 
    }
  }, [currentUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <Skeleton className="h-6 w-6 mr-2 rounded-full" />
            <Skeleton className="h-6 w-32" />
            <div className="flex-1" />
            <Skeleton className="h-8 w-20" />
          </div>
        </header>
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </main>
        <footer className="py-6 md:px-8 md:py-0 border-t">
          <div className="container flex items-center justify-center md:h-24">
            <Skeleton className="h-4 w-48" />
          </div>
        </footer>
      </div>
    );
  }

  if (!currentUser) {
    return null; 
  }

  return (
    <div className="container mx-auto px-4 flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow py-8">
         {children}
      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Pet Link. &copy; {new Date().getFullYear()}. Elaborado por Miguel Angel Sepulveda Burgos.
          </p>
          <Link
            href="https://github.com/moonthang/Pet-Link"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <GitHubIcon className="h-4 w-4" />
            <span>GitHub</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}

