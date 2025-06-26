import { Book, Home } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
        <div className="px-4 py-3 md:container md:mx-auto md:max-w-4xl md:px-8 md:py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Book className="text-primary h-5 w-5 md:h-6 md:w-6" />
              <h1 className="text-lg font-semibold md:text-xl">Bíblia NVA</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-8 md:container md:mx-auto md:max-w-2xl md:px-8">
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Capítulo não encontrado
            </h1>
            <p className="text-muted-foreground">
              O livro ou capítulo que você está procurando não existe ou não
              está disponível.
            </p>
          </div>

          <Card className="mx-auto max-w-md">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-muted mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                  <Book className="text-muted-foreground h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Sugestões:</h3>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• Verifique se o nome do livro está correto</li>
                    <li>• Confirme se o número do capítulo existe</li>
                    <li>• Use códigos de livro (ex: gn, ex, mt, jo)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/gn/1">
              <Button className="w-full gap-2 sm:w-auto">
                <Book className="h-4 w-4" />
                Ir para Gênesis 1
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full gap-2 sm:w-auto">
                <Home className="h-4 w-4" />
                Página inicial
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
