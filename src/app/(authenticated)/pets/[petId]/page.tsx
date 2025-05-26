
'use client';

import React, { useEffect, useState, use } from "react";
import { getPetById } from "@/actions/petActions";
import { notFound, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, CalendarClock, ListChecks, Heart, PawPrint, Cake, FilePenLine, ChevronLeft, ChevronRight, Maximize, Dog, Cat } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ClientMapViewLoader } from "@/components/pets/ClientMapViewLoader";
import { PetDisplayImage } from "@/components/pets/PetDisplayImage";
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { calculateAge } from "@/lib/utils";
import type { PetProfile, ScanLocation } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ViewPetPageProps {
  params: { petId: string };
}


export default function ViewPetPage({ params }: ViewPetPageProps) {
  const resolvedParams = use(params as any);
  const { petId } = resolvedParams;

  const [pet, setPet] = useState<PetProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!petId || typeof petId !== 'string') {
      console.error("[ViewPetPage] petId no encontrado en params o no es un string válido");
      setIsLoading(false);
      notFound();
      return;
    }

    async function fetchPet() {
      setIsLoading(true);
      try {
        const petData = await getPetById(petId);
        if (!petData) {
          setPet(null);
          notFound();
        } else {
          setPet(petData);
          if (typeof document !== 'undefined') {
            if (petData.name) {
              document.title = `${petData.name} - Perfil de Mascota - Pet Link`;
            } else {
              document.title = `Perfil de Mascota - Pet Link`;
            }
          }
        }
      } catch (error) {
        console.error("Error cargando mascota:", error);
        setPet(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPet();
  }, [petId]);


  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-80 md:h-[28rem] w-full rounded-t-lg" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!pet) {
    return <p className="text-center text-muted-foreground mt-10">Mascota no encontrada o no se pudo cargar el perfil.</p>;
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

  const sortedScanHistory = pet.scanHistory || [];
  const latestScan = sortedScanHistory.length > 0 ? sortedScanHistory[0] : null;

  const directlyShownPreviousScans = sortedScanHistory.slice(1, 3);
  const accordionScans = sortedScanHistory.length > 3 ? sortedScanHistory.slice(3) : [];


  const formatTimestamp = (timestamp: string) => {
    try {
      const dateToFormat = new Date(timestamp);
      return dateToFormat.toLocaleString("es-CO", { 
        dateStyle: 'medium', 
        timeStyle: 'short'
      });
    } catch (error) {
      console.error("Error formateando fecha:", error);
      return new Date(timestamp).toLocaleString();
    }
  };

  const PetIcon = pet.tipoAnimal === "Gato" ? Cat : pet.tipoAnimal === "Perro" ? Dog : PawPrint;


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="overflow-hidden shadow-xl">
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
        <CardHeader className="text-center pt-8">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <PetIcon className="h-10 w-10 text-primary" />
            <CardTitle className="text-4xl font-bold">{pet.name}</CardTitle>
          </div>
          <CardDescription className="text-lg flex flex-wrap justify-center items-center gap-2">
            {pet.tipoAnimal && <Badge variant="secondary" className="text-md px-3 py-1 capitalize">{pet.tipoAnimal}</Badge>}
            {pet.breed && pet.breed !== "Raza Pendiente" && <Badge variant="outline" className="text-md px-3 py-1">{pet.breed}</Badge>}
            {pet.sexo && <Badge variant="outline" className="text-md px-3 py-1 capitalize">{pet.sexo}</Badge>}
            {ageDisplay && <Badge variant="outline" className="text-md px-3 py-1">{ageDisplay}</Badge>}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-8 space-y-6">
          {pet.caracteristicaEspecial && (
            <>
              <Separator />
              <div>
                <h3 className="text-xl font-semibold mb-3 text-primary flex items-center">
                  <Heart className="h-6 w-6 mr-2" /> Característica Especial
                </h3>
                <p className="text-muted-foreground pl-8">{pet.caracteristicaEspecial}</p>
              </div>
            </>
          )}
           <Separator />
           <div>
            <h3 className="text-xl font-semibold mb-3 text-primary flex items-center">
              <Cake className="h-6 w-6 mr-2" /> Fecha de Nacimiento
            </h3>
            <p className="text-muted-foreground pl-8">
              {pet.fechaNacimiento ? format(new Date(pet.fechaNacimiento), "PPP", { locale: es }) : 'No especificada'}
            </p>
          </div>

          <Separator />
          <div>
            <h3 className="text-xl font-semibold mb-3 text-primary flex items-center">
              <User className="h-6 w-6 mr-2" /> Información del Dueño
            </h3>
            <div className="space-y-2 text-muted-foreground pl-8">
              {pet.ownerName && pet.ownerName !== "Dueño Pendiente (Cliente completará)" && (
                <p className="flex items-center">
                  <User className="h-5 w-5 mr-3 text-primary/80 invisible" />
                  <span className="font-medium text-foreground">{pet.ownerName}</span>
                </p>
              )}
             {pet.ownerPhone1 && pet.ownerPhone1 !== "0000000" && (
                <p className="flex items-center">
                    <Phone className="h-5 w-5 mr-3 text-primary/80" />
                    <a
                    href={`tel:${pet.ownerPhone1}`}
                    className="font-medium text-foreground hover:underline"
                    >
                    {pet.ownerPhone1} (Principal)
                    </a>
                </p>
             )}
              {pet.ownerPhone2 && (
                <p className="flex items-center">
                  <Phone className="h-5 w-5 mr-3 text-primary/80" />
                  <a
                    href={`tel:${pet.ownerPhone2}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {pet.ownerPhone2} (Secundario)
                  </a>
                </p>
              )}
              {pet.ownerEmail && (
                <p className="flex items-center">
                  <Mail className="h-5 w-5 mr-3 text-primary/80" />
                  <a
                    href={`mailto:${pet.ownerEmail}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {pet.ownerEmail}
                  </a>
                </p>
              )}
              {(!pet.ownerName || pet.ownerName === "Dueño Pendiente (Cliente completará)") && (!pet.ownerPhone1 || pet.ownerPhone1 === "0000000") && !pet.ownerPhone2 && !pet.ownerEmail && (
                <p className="text-muted-foreground">Información del dueño pendiente de completar.</p>
              )}
            </div>
          </div>
          <Separator />
          <div>
            <h3 className="text-xl font-semibold mb-4 text-primary flex items-center">
              <MapPin className="h-6 w-6 mr-2" /> Historial de Escaneos
            </h3>
            <div className="pl-8">
              {!latestScan && (
                <p className="text-muted-foreground">Sin registro de escaneos.</p>
              )}
              {latestScan && (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-foreground font-medium flex items-center mb-2">
                       <CalendarClock className="h-5 w-5 mr-2 text-primary/80" />
                       Último escaneo: {formatTimestamp(latestScan.timestamp)}
                    </p>
                    <ClientMapViewLoader petName={pet.name} latestScan={latestScan} />
                  </div>
                </>
              )}
              {directlyShownPreviousScans.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-3 text-primary/90 flex items-center">
                    <ListChecks className="h-5 w-5 mr-2" /> Escaneos Anteriores
                  </h4>
                  <ul className="space-y-3 text-sm text-muted-foreground list-none pl-0">
                    {directlyShownPreviousScans.map((scan) => (
                      <li key={scan.id} className="p-3 border rounded-md bg-muted/50">
                        <p className="flex items-center font-medium text-foreground">
                          <CalendarClock className="h-4 w-4 mr-2 text-primary/70" />
                          {formatTimestamp(scan.timestamp)}
                        </p>
                        <p className="text-xs mt-1">
                          Coordenadas: Lat: {scan.latitude.toFixed(4)}, Lng: {scan.longitude.toFixed(4)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {accordionScans.length > 0 && (
                 <div className="mt-6">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="older-scans">
                        <AccordionTrigger className="text-lg font-semibold text-primary/90 hover:no-underline flex justify-start">
                          <div className="flex items-center">
                            <ListChecks className="h-5 w-5 mr-2" />
                            Escaneos Más Antiguos ({accordionScans.length})
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-3 text-sm text-muted-foreground list-none pl-0 pt-2">
                            {accordionScans.map((scan) => (
                              <li key={scan.id} className="p-3 border rounded-md bg-muted/50">
                                <p className="flex items-center font-medium text-foreground">
                                  <CalendarClock className="h-4 w-4 mr-2 text-primary/70" />
                                  {formatTimestamp(scan.timestamp)}
                                </p>
                                <p className="text-xs mt-1">
                                  Coordenadas: Lat: {scan.latitude.toFixed(4)}, Lng: {scan.longitude.toFixed(4)}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                 </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-6 pb-6 pt-4 border-t flex justify-end">
           <Link href={`/pets/${pet.id}/edit`} passHref legacyBehavior>
            <Button variant="outline">
              <FilePenLine className="mr-2 h-4 w-4" />
              Editar Perfil de {pet.name}
            </Button>
          </Link>
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
