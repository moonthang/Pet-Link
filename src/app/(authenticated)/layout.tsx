
'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Skeleton } from '@/components/ui/skeleton'; 

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
    <>
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
         {children}
      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Pet Link. &copy; {new Date().getFullYear()}. Elaborado por Miguel Angel Sepulveda Burgos
          </p>
        </div>
      </footer>
    </>
  );
}
