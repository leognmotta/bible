'use client'

import { ArrowLeft, Book, Copy, Share2 } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Translation {
  key: string
  name: string
  language: string
}

interface BookData {
  code: string
  name: string
  summary: string
  chapters: number
}

interface Chapter {
  number: number
  name: string
  totalVerses: number
}

interface Verse {
  verse: number
  text: string
}

interface ChapterResponse {
  translation: Translation
  book: BookData
  chapter: Chapter
  verses: Verse[]
}

interface VerseShareClientProps {
  chapterData: ChapterResponse
  selectedVerses: Verse[]
  verseReference: string
  shareUrl: string
  bookCode: string
  chapter: string
}

export default function VerseShareClient({
  chapterData,
  selectedVerses,
  verseReference,
  shareUrl,
  bookCode,
  chapter,
}: VerseShareClientProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: verseReference,
          text: selectedVerses.map((v) => v.text).join(' '),
          url: shareUrl,
        })
      } catch (error) {
        // User cancelled or error occurred, fallback to clipboard
        await navigator.clipboard.writeText(shareUrl)
      }
    } else {
      await navigator.clipboard.writeText(shareUrl)
    }
  }

  const handleCopyText = async () => {
    const text = `${verseReference}\n\n${selectedVerses.map((v) => `${v.verse} ${v.text}`).join('\n')}\n\n- ${chapterData.translation.name}`
    await navigator.clipboard.writeText(text)
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
        <div className="px-4 py-3 md:container md:mx-auto md:max-w-4xl md:px-8 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/${bookCode}/${chapter}`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao capítulo
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Book className="text-primary h-5 w-5 md:h-6 md:w-6" />
              <h1 className="text-lg font-semibold md:text-xl">Bíblia NVA</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-8 md:container md:mx-auto md:max-w-4xl md:px-8">
        <div className="space-y-6">
          {/* Verse Reference Header */}
          <div className="text-center">
            <h1 className="text-primary mb-2 text-2xl font-bold md:text-4xl">
              {verseReference}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              {chapterData.translation.name}
            </p>
          </div>

          {/* Verses Card */}
          <Card className="mx-auto max-w-3xl">
            <CardContent className="p-6 md:p-8">
              <div className="space-y-4">
                {selectedVerses.map((verse) => (
                  <div key={verse.verse} className="flex gap-4">
                    <Badge
                      variant="outline"
                      className="mt-1 h-6 min-w-[2rem] flex-shrink-0 justify-center text-xs font-medium"
                    >
                      {verse.verse}
                    </Badge>
                    <p className="text-base leading-relaxed md:text-lg md:leading-relaxed">
                      {verse.text}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Book Summary */}
          <Card className="mx-auto max-w-3xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Book className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                <div>
                  <h3 className="mb-2 text-base font-medium">
                    Sobre {chapterData.book.name}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {chapterData.book.summary}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share Actions */}
          <div className="flex flex-col gap-3 md:flex-row md:justify-center">
            <Button variant="outline" className="gap-2" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              onClick={handleCopyText}
            >
              <Copy className="h-4 w-4" />
              Copiar texto
            </Button>

            <Link href={`/${bookCode}/${chapter}`}>
              <Button className="w-full gap-2 md:w-auto">
                <Book className="h-4 w-4" />
                Ler capítulo completo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
