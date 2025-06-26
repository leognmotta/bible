import { notFound, redirect } from 'next/navigation'

import ScriptureReader from '@/components/ScriptureReader'
import { Skeleton } from '@/components/ui/skeleton'
import {
  convertBookNameToCode,
  getBookName,
  isValidBookCode,
} from '@/lib/utils/book-utils'

interface Book {
  code: string
  name: string
  displayName: string
  chapters: number
  aliases: string[]
  abbreviations: string[]
}

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

interface Pagination {
  prevChapter?: {
    number: number
    reference: string
    verses: number
    book?: string
    bookName?: string
  } | null
  nextChapter?: {
    number: number
    reference: string
    verses: number
    book?: string
    bookName?: string
  } | null
}

interface ChapterResponse {
  translation: Translation
  book: BookData
  chapter: Chapter
  verses: Verse[]
  pagination: Pagination
}

interface PageProps {
  params: Promise<{
    book: string
    chapter: string
  }>
}

async function getBooks(): Promise<Book[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/bible/nva/books`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      },
    )

    if (!response.ok) {
      throw new Error('Failed to fetch books')
    }

    const data = await response.json()
    return data.books
  } catch (error) {
    console.error('Error fetching books:', error)
    return []
  }
}

async function getChapter(
  book: string,
  chapter: number,
): Promise<ChapterResponse | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/bible/nva/${book}/${chapter}`,
      {
        next: { revalidate: 0 }, // Always fresh for chapters
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

function LoadingSkeleton() {
  return (
    <div className="bg-background min-h-screen-mobile">
      {/* Header Skeleton */}
      <div className="bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
        <div className="px-4 py-3 md:container md:mx-auto md:max-w-4xl md:px-8 md:py-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 md:h-6 md:w-6" />
              <Skeleton className="h-5 w-24 md:h-6 md:w-28" />
            </div>
            <Skeleton className="h-8 w-8 md:hidden" />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="hidden h-8 md:block" />
            </div>

            <div className="flex gap-3 md:hidden">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-12 flex-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="px-4 pb-8 md:container md:mx-auto md:max-w-4xl md:px-8">
        <div className="space-y-4 pt-4">
          <Skeleton className="mx-auto h-6 w-3/4" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="mt-1 h-4 w-6 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function ChapterPage(props: PageProps) {
  // Await params in Next.js 15
  const params = await props.params
  const { book, chapter } = params

  // Validate chapter number
  const chapterNum = parseInt(chapter, 10)
  if (isNaN(chapterNum) || chapterNum < 1) {
    notFound()
  }

  // Convert book name to code if needed (backward compatibility)
  const bookCode = convertBookNameToCode(book.toLowerCase())

  // If the URL uses old book names, redirect to book code
  if (bookCode !== book.toLowerCase()) {
    redirect(`/${bookCode}/${chapterNum}`)
  }

  // Validate book code
  if (!isValidBookCode(bookCode)) {
    notFound()
  }

  // Get book name for API calls (API still expects English names)
  const bookName = getBookName(bookCode)
  if (!bookName) {
    notFound()
  }

  // Fetch data on the server with parallel requests
  const [books, initialChapterData] = await Promise.all([
    getBooks(),
    getChapter(bookName.toLowerCase(), chapterNum),
  ])

  // If chapter data not found, show 404
  if (!initialChapterData) {
    notFound()
  }

  return (
    <ScriptureReader
      books={books}
      initialChapterData={initialChapterData}
      initialBook={bookCode}
      initialChapter={chapterNum}
      useUrlParams={true}
    />
  )
}

// Generate metadata for SEO
export async function generateMetadata(props: PageProps) {
  const params = await props.params
  const { book, chapter } = params

  try {
    const chapterData = await getChapter(
      book.toLowerCase(),
      parseInt(chapter, 10) || 1,
    )

    if (chapterData) {
      return {
        title: `${chapterData.chapter.name} - Bíblia NVA`,
        description: `Leia ${chapterData.chapter.name} na Nova Versão de Acesso Livre. ${chapterData.book.summary.slice(0, 150)}...`,
        openGraph: {
          title: `${chapterData.chapter.name} - Bíblia NVA`,
          description: `Leia ${chapterData.chapter.name} na Nova Versão de Acesso Livre`,
          type: 'article',
          url: `/${book}/${chapter}`,
        },
        twitter: {
          card: 'summary_large_image',
          title: `${chapterData.chapter.name} - Bíblia NVA`,
          description: `Leia ${chapterData.chapter.name} na Nova Versão de Acesso Livre`,
        },
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
  }

  return {
    title: `${book} ${chapter} - Bíblia NVA`,
    description: 'Leia a Bíblia online na Nova Versão de Acesso Livre',
  }
}

export function loading() {
  return <LoadingSkeleton />
}
