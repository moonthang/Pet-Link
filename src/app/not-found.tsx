import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center px-4">
      <AlertTriangle className="w-24 h-24 text-destructive mb-6" />
      <h1 className="text-5xl font-bold mb-4">404 - Página no Encontrada</h1>
      <p className="text-xl text-muted-foreground mb-8">
        ¡Ups! La página que estás buscando no existe o ha sido movida.
      </p>
      <Link href="/" passHref>
        <Button size="lg">
          Volver a Inicio
        </Button>
      </Link>
    </div>
  )
}
