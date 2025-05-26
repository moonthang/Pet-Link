
'use client';

import { useEffect, useState, use } from "react";
import { getPetById } from "@/actions/petActions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Heart, PawPrint, Cake, Dog, Cat, ChevronLeft, ChevronRight, Maximize } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PetDisplayImage } from "@/components/pets/PetDisplayImage";
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { Button } from "@/components/ui/button";
import { calculateAge } from "@/lib/utils";
import type { PetProfile } from "@/types";
import { ScanLocationRecorder } from "@/components/pets/ScanLocationRecorder";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";

interface PublicPetProfilePageProps {
  params: { petId: string };
}

export default function PublicPetProfilePage({ params }: PublicPetProfilePageProps) {
  const resolvedParams = use(params as any);
  const { petId } = resolvedParams;

  const [pet, setPet] = useState<PetProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!petId || typeof petId !== 'string') {
      setIsLoading(false);
      notFound();
      return;
    }
    async function fetchPet() {
      setIsLoading(true);
      const petData = await getPetById(petId);
      if (petData) {
        setPet(petData);
      } else {
        notFound();
      }
      setIsLoading(false);
    }
    fetchPet();
  }, [petId]);

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Skeleton className="h-64 w-full rounded-t-lg" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (!pet) {
    return <p className="text-center text-muted-foreground mt-10">Mascota no encontrada.</p>;
  }

  const petImages: string[] = [];
  if (pet.photoUrl && pet.photoUrl.startsWith('http')) petImages.push(pet.photoUrl);
  if (pet.photoUrl2 && pet.photoUrl2.startsWith('http')) petImages.push(pet.photoUrl2);

  const displayedImageSrc = petImages.length > 0
    ? petImages[currentImageIndex]
    : `https://placehold.co/600x400.png?text=${encodeURIComponent(pet.name || "Mascota")}`;
  const displayedImageAiHint = `${pet.tipoAnimal?.toLowerCase() || 'animal'} mascota`;

  const handleNextImage = () => {
    if (petImages.length > 1) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % petImages.length);
    }
  };

  const handlePrevImage = () => {
    if (petImages.length > 1) {
      setCurrentImageIndex((prevIndex) => (prevIndex - 1 + petImages.length) % petImages.length);
    }
  };

  const handleOpenImageModal = () => {
    if (petImages.length > 0 && petImages[currentImageIndex]) {
      setModalImageUrl(petImages[currentImageIndex]);
      setIsImageModalOpen(true);
    }
  };

  const ageDisplay = calculateAge(pet.fechaNacimiento);
  const PetIcon = pet.tipoAnimal === "Gato" ? Cat : pet.tipoAnimal === "Perro" ? Dog : PawPrint;

  return (
    <div className="max-w-lg mx-auto">
      <ScanLocationRecorder petId={pet.id} />
      <Card className="overflow-hidden shadow-lg">
         <div className="relative h-80 md:h-[28rem] w-full bg-muted/30 group">
           {petImages.length === 0 ? (
             <div className="w-full h-full relative">
              <PetDisplayImage
                src={displayedImageSrc} 
                alt={pet.name}
                petName={pet.name}
                fill
                className="object-cover"
                data-ai-hint={displayedImageAiHint}
              />
             </div>
           ) : (
             <>
              <PetDisplayImage
                src={displayedImageSrc}
                alt={`${pet.name} - Foto ${currentImageIndex + 1}`}
                petName={pet.name}
                fill
                priority={currentImageIndex === 0}
                className="object-cover"
                data-ai-hint={displayedImageAiHint}
              />
              {petImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                    aria-label="Siguiente imagen"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenImageModal}
                className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
                aria-label="Ampliar imagen"
              >
                <Maximize className="h-5 w-5" />
              </Button>
             </>
           )}
        </div>
        <CardHeader className="text-center pt-6">
          <div className="flex items-center justify-center space-x-3 mb-1">
            <PetIcon className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold">{pet.name}</CardTitle>
          </div>
          <CardDescription className="text-md flex flex-wrap justify-center items-center gap-2">
            {pet.tipoAnimal && <Badge variant="secondary" className="capitalize">{pet.tipoAnimal}</Badge>}
            {pet.breed && pet.breed !== "Raza Pendiente" && <Badge variant="outline">{pet.breed}</Badge>}
            {pet.sexo && <Badge variant="outline" className="capitalize">{pet.sexo}</Badge>}
            {ageDisplay && <Badge variant="outline">{ageDisplay}</Badge>}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-6 space-y-4">
          {pet.caracteristicaEspecial && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-primary flex items-center">
                  <Heart className="h-5 w-5 mr-2" /> Característica Especial
                </h3>
                <p className="text-muted-foreground pl-7">{pet.caracteristicaEspecial}</p>
              </div>
            </>
          )}
          <Separator />
           <div>
            <h3 className="text-lg font-semibold mb-2 text-primary flex items-center">
              <Cake className="h-5 w-5 mr-2" /> Fecha de Nacimiento
            </h3>
            <p className="text-muted-foreground pl-7">
              {pet.fechaNacimiento ? format(new Date(pet.fechaNacimiento), "PPP", { locale: es }) : 'No especificada'}
            </p>
          </div>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-2 text-primary flex items-center">
              <User className="h-5 w-5 mr-2" /> Contactar Dueño
            </h3>
            <div className="space-y-1 text-muted-foreground pl-7">
              {pet.ownerName && pet.ownerName !== "Dueño Pendiente (Cliente completará)" && (
                <p className="font-medium text-foreground">{pet.ownerName}</p>
              )}
              {pet.ownerPhone1 && pet.ownerPhone1 !== "0000000" && (
                <p className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-primary/80" />
                  <a href={`tel:${pet.ownerPhone1}`} className="hover:underline">{pet.ownerPhone1} (Principal)</a>
                </p>
              )}
              {pet.ownerPhone2 && (
                <p className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-primary/80" />
                  <a href={`tel:${pet.ownerPhone2}`} className="hover:underline">{pet.ownerPhone2} (Secundario)</a>
                </p>
              )}
              {pet.ownerEmail && (
                 <p className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-primary/80" />
                  <a href={`mailto:${pet.ownerEmail}`} className="hover:underline">{pet.ownerEmail}</a>
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-4 text-center">
          <p className="text-xs text-muted-foreground w-full">
            Si has encontrado esta mascota, por favor contacta al dueño usando la información provista.
          </p>
        </CardFooter>
      </Card>
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogTitle className="sr-only">Imagen Ampliada de {pet?.name || 'Mascota'}</DialogTitle>
        <DialogContent className="max-w-3xl w-full h-auto max-h-[85vh] p-1 sm:p-2 md:p-4 flex items-center justify-center bg-background border-border shadow-lg rounded-lg">
          {modalImageUrl && (
            <div className="relative w-auto h-auto max-w-full max-h-[80vh]">
              <Image
                src={modalImageUrl}
                alt={`Imagen ampliada de ${pet?.name || 'mascota'}`}
                width={1200}
                height={900}
                className="object-contain w-auto h-auto max-w-full max-h-[78vh] rounded"
                priority
                data-ai-hint={`${pet?.tipoAnimal?.toLowerCase() || 'animal'} grande`}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
