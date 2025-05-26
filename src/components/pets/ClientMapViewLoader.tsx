
'use client';

import type { ScanLocation } from '@/types';
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";

interface ClientMapViewLoaderProps {
  petName: string;
  latestScan: ScanLocation; 
}

const DynamicMapViewComponent = dynamic(
  () => import("@/components/pets/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full rounded-md" />,
  }
);

export function ClientMapViewLoader({ petName, latestScan }: ClientMapViewLoaderProps) {
  
  return <DynamicMapViewComponent 
            petName={petName} 
            scanLocation={{ lat: latestScan.latitude, lng: latestScan.longitude }} 
         />;
}
