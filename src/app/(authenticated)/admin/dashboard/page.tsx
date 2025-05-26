
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3 mb-2">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold">Panel de Administración</CardTitle>
          </div>
          <CardDescription>Bienvenido al Panel de Administración de Pet Link.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Funcionalidades futuras incluirán:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6 text-muted-foreground">
            <li>Administración de veterinarias asociadas.</li>
            <li>Estadísticas.</li>
          </ul>
          <Link href="/home" passHref>
            <Button variant="outline">Ir a la Página de Inicio</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
