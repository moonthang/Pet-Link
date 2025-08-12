
'use client'; 

import { getAllPets } from "@/actions/petActions";
import { PetList } from "@/components/pets/PetList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback } from "react";
import type { PetProfile } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";


export default function AuthenticatedHomePage() {
  const { appUser, isLoading: authLoading } = useAuth();
  const [allPets, setAllPets] = useState<PetProfile[]>([]);
  const [filteredPets, setFilteredPets] = useState<PetProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingPets, setIsLoadingPets] = useState(true);

  const fetchPets = useCallback(async () => {
    if (appUser && !authLoading) {
      setIsLoadingPets(true);
      try {
        const userPets = await getAllPets(appUser); 
        setAllPets(userPets);
        setFilteredPets(userPets);
      } catch (error) {
        setAllPets([]); 
        setFilteredPets([]);
      } finally {
        setIsLoadingPets(false);
      }
    } else if (!authLoading && !appUser) {
      setIsLoadingPets(false);
      setAllPets([]);
      setFilteredPets([]);
    }
  }, [appUser, authLoading]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredPets(allPets);
      return;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = allPets.filter(pet =>
      (pet.name?.toLowerCase().includes(lowercasedFilter)) ||
      (pet.ownerName?.toLowerCase().includes(lowercasedFilter)) ||
      (pet.ownerPhone1?.toLowerCase().includes(lowercasedFilter)) ||
      (pet.ownerEmail?.toLowerCase().includes(lowercasedFilter))
    );
    setFilteredPets(filtered);
  }, [searchTerm, allPets]);
  
  const handlePetDeleted = useCallback((deletedPetId: string) => {
    setAllPets(currentPets => currentPets.filter(pet => pet.id !== deletedPetId));
  }, []);


  if (authLoading || (!appUser && !authLoading && isLoadingPets)) { 
     return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-56" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Mascotas</h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto max-w-xs flex-grow">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por mascota, dueño, tel, email..."
              className="pl-8 w-full h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar mascotas"
            />
          </div>
          {appUser?.nivel === 'admin' || appUser?.nivel === 'demo' ? (
            <Link href="/pets/new" passHref>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Nueva Mascota
              </Button>
            </Link>
          ) : (
            <Link href="/pets/new" passHref>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Mascota
              </Button>
            </Link>
          )}
        </div>
      </div>

      {isLoadingPets && appUser ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <PetList pets={filteredPets} onPetDeleted={handlePetDeleted} />
      )}
    </div>
  );
}

