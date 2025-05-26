
import { PetForm } from "@/components/pets/PetForm";
import { getPetById } from "@/actions/petActions";
import { notFound } from "next/navigation";

interface EditPetPageProps {
  params: { petId: string };
}

export default async function EditPetPage({ params }: EditPetPageProps) {
  const pet = await getPetById(params.petId);

  if (!pet) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-center">Editar Perfil de {pet.name}</h1>
      <PetForm pet={pet} />
    </div>
  );
}
