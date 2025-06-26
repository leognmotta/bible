import { notFound, redirect } from 'next/navigation'

import {
  convertBookNameToCode,
  getBookName,
  isValidBookCode,
} from '@/lib/utils/book-utils'

import VerseShareClient from './VerseShareClient'

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

interface PageProps {
  params: Promise<{
    book: string
    chapter: string
    verses: string
  }>
}

async function getChapter(
  book: string,
  chapter: number,
): Promise<ChapterResponse | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/bible/nva/${book}/${chapter}`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour for sharing
      },
    )

    if (!response.ok) {
      throw new Error('Failed to fetch chapter')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching chapter:', error)
    return null
  }
}

function parseVerseRange(
  versesParam: string,
): { from: number; to: number } | null {
  // Support formats: "5", "5-7", "5-5" (single verse)
  const match = versesParam.match(/^(\d+)(?:-(\d+))?$/)
  if (!match) return null

  const from = parseInt(match[1], 10)
  const to = match[2] ? parseInt(match[2], 10) : from

  if (from < 1 || to < from) return null

  return { from, to }
}

function formatVerseReference(
  bookName: string,
  chapter: number,
  from: number,
  to: number,
): string {
  if (from === to) {
    return `${bookName} ${chapter}:${from}`
  }
  return `${bookName} ${chapter}:${from}-${to}`
}

export default async function VersePage(props: PageProps) {
  // Await params in Next.js 15
  const params = await props.params
  const { book, chapter, verses } = params

  // Validate chapter number
  const chapterNum = parseInt(chapter, 10)
  if (isNaN(chapterNum) || chapterNum < 1) {
    notFound()
  }

  // Convert book name to code if needed (backward compatibility)
  const bookCode = convertBookNameToCode(book.toLowerCase())

  // If the URL uses old book names, redirect to book code
  if (bookCode !== book.toLowerCase()) {
    redirect(`/${bookCode}/${chapterNum}/${verses}`)
  }

  // Validate book code
  if (!isValidBookCode(bookCode)) {
    notFound()
  }

  // Parse verse range
  const verseRange = parseVerseRange(verses)
  if (!verseRange) {
    notFound()
  }

  // Get book name for API calls (API still expects English names)
  const bookName = getBookName(bookCode)
  if (!bookName) {
    notFound()
  }

  // Fetch chapter data
  const chapterData = await getChapter(bookName.toLowerCase(), chapterNum)
  if (!chapterData) {
    notFound()
  }

  // Filter verses based on range
  const selectedVerses = chapterData.verses.filter(
    (verse) => verse.verse >= verseRange.from && verse.verse <= verseRange.to,
  )

  // Validate verse range exists
  if (selectedVerses.length === 0) {
    notFound()
  }

  const verseReference = formatVerseReference(
    chapterData.book.name,
    chapterNum,
    verseRange.from,
    verseRange.to,
  )

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${bookCode}/${chapter}/${verses}`

  return (
    <VerseShareClient
      chapterData={chapterData}
      selectedVerses={selectedVerses}
      verseReference={verseReference}
      shareUrl={shareUrl}
      bookCode={bookCode}
      chapter={chapter}
    />
  )
}

// Generate metadata for SEO and social sharing
export async function generateMetadata(props: PageProps) {
  const params = await props.params
  const { book, chapter, verses } = params

  try {
    const chapterNum = parseInt(chapter, 10)
    const verseRange = parseVerseRange(verses)

    if (!verseRange) {
      return {
        title: 'Versículo não encontrado - Bíblia NVA',
        description: 'Versículo não encontrado na Bíblia NVA',
      }
    }

    // Convert book name to code if needed
    const bookCode = convertBookNameToCode(book.toLowerCase())
    const bookName = getBookName(bookCode)

    if (!bookName) {
      return {
        title: 'Livro não encontrado - Bíblia NVA',
        description: 'Livro não encontrado na Bíblia NVA',
      }
    }

    const chapterData = await getChapter(bookName.toLowerCase(), chapterNum)

    if (chapterData) {
      const selectedVerses = chapterData.verses.filter(
        (verse) =>
          verse.verse >= verseRange.from && verse.verse <= verseRange.to,
      )

      if (selectedVerses.length > 0) {
        const verseReference = formatVerseReference(
          chapterData.book.name,
          chapterNum,
          verseRange.from,
          verseRange.to,
        )

        const verseText = selectedVerses.map((v) => v.text).join(' ')
        const description =
          verseText.length > 150 ? `${verseText.slice(0, 150)}...` : verseText

        return {
          title: `${verseReference} - Bíblia NVA`,
          description: `"${description}" - ${chapterData.translation.name}`,
          openGraph: {
            title: `${verseReference} - Bíblia NVA`,
            description: `"${description}" - ${chapterData.translation.name}`,
            type: 'article',
            url: `/${bookCode}/${chapter}/${verses}`,
          },
          twitter: {
            card: 'summary_large_image',
            title: `${verseReference} - Bíblia NVA`,
            description: `"${description}" - ${chapterData.translation.name}`,
          },
        }
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
  }

  return {
    title: `${book} ${chapter}:${verses} - Bíblia NVA`,
    description: 'Leia a Bíblia online na Nova Versão de Acesso Livre',
  }
}
