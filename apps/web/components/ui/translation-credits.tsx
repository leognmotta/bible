'use client'

import { ExternalLink } from 'lucide-react'

interface TranslationCreditsProps {
  translationKey?: string
  className?: string
}

export default function TranslationCredits({
  translationKey = 'nva',
  className = '',
}: TranslationCreditsProps) {
  // For now we only have NVA, but this can be extended for other translations
  const getTranslationInfo = (key: string) => {
    switch (key) {
      case 'nva':
        return {
          name: 'Nova Versão de Acesso Livre (NVA)',
          shortName: 'NVA',
          url: 'https://www.biblianva.com.br/',
          license: 'Licença Livre',
          description: 'Tradução bíblica de acesso livre e gratuito',
        }
      default:
        return {
          name: 'Nova Versão de Acesso Livre (NVA)',
          shortName: 'NVA',
          url: 'https://www.biblianva.com.br/',
          license: 'Licença Livre',
          description: 'Tradução bíblica de acesso livre e gratuito',
        }
    }
  }

  const translation = getTranslationInfo(translationKey)

  return (
    <div className={`bg-muted/30 border-t py-4 text-center ${className}`}>
      <div className="text-muted-foreground space-y-2 text-xs md:text-sm">
        <p>
          Texto bíblico da{' '}
          <a
            href={translation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
          >
            {translation.name}
            <ExternalLink className="h-3 w-3" />
          </a>
        </p>
        <p className="text-xs">
          {translation.description} • {translation.license}
        </p>
      </div>
    </div>
  )
}
