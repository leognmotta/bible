'use client'

import {
  Book,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Copy,
  Menu,
  Share2,
  X,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import TranslationCredits from '@/components/ui/translation-credits'
import { getBookNamePt } from '@/lib/utils/book-utils'

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

interface ScriptureReaderProps {
  books: Book[]
  initialChapterData?: ChapterResponse | null
  initialBook?: string
  initialChapter?: number
  useUrlParams?: boolean
}

export default function ScriptureReader({
  books,
  initialChapterData,
  initialBook = '',
  initialChapter = 1,
  useUrlParams = false,
}: ScriptureReaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedBook, setSelectedBook] = useState<string>(initialBook)
  const [selectedChapter, setSelectedChapter] = useState<number>(initialChapter)
  const [chapterData, setChapterData] = useState<ChapterResponse | null>(
    initialChapterData || null,
  )
  const [loading, setLoading] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set())
  const [showShareButton, setShowShareButton] = useState(false)

  // Handle viewport changes for mobile browsers
  useEffect(() => {
    const handleResize = () => {
      // Force a reflow to handle Chrome mobile viewport changes
      if (typeof window !== 'undefined') {
        const vh = window.innerHeight * 0.01
        document.documentElement.style.setProperty('--vh', `${vh}px`)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  // Set initial book if not provided
  useEffect(() => {
    if (!selectedBook && books.length > 0) {
      setSelectedBook(books[0].name.toLowerCase())
    }
  }, [books, selectedBook])

  const loadChapter = async (
    book: string,
    chapter: number,
    bookCodeForUrl?: string,
  ) => {
    setLoading(true)
    try {
      // Update URL based on routing strategy
      if (useUrlParams) {
        // For URL params, we need to use the book code, not the English name
        const bookForUrl = bookCodeForUrl || selectedBook || book
        router.push(`/${bookForUrl}/${chapter}`, { scroll: false })
      } else {
        const params = new URLSearchParams(searchParams)
        params.set('book', book)
        params.set('chapter', chapter.toString())
        router.push(`/?${params.toString()}`, { scroll: false })
      }

      const response = await fetch(`/api/bible/nva/${book}/${chapter}`)
      if (!response.ok) {
        throw new Error('Failed to fetch chapter')
      }
      const data = await response.json()
      setChapterData(data)
      // Clear verse selection when changing chapters
      clearSelection()
    } catch (error) {
      console.error('Error loading chapter:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookChange = (bookCode: string) => {
    setSelectedBook(bookCode)
    setSelectedChapter(1) // Reset to first chapter
    // Find the book to get the English name for API call
    const book = books.find((b) => b.code === bookCode)
    if (book) {
      loadChapter(book.name.toLowerCase(), 1, bookCode)
    }
  }

  const handleChapterChange = (chapter: string) => {
    const chapterNum = parseInt(chapter)
    setSelectedChapter(chapterNum)
    if (selectedBook) {
      // Find the book to get the English name for API call
      const book = books.find((b) => b.code === selectedBook)
      if (book) {
        loadChapter(book.name.toLowerCase(), chapterNum, selectedBook)
      }
    }
  }

  const goToPrevChapter = () => {
    if (chapterData?.pagination.prevChapter) {
      const prevChapter = chapterData.pagination.prevChapter
      const newChapter = prevChapter.number

      // Update state first
      setSelectedChapter(newChapter)

      // Check if we're switching books
      if (prevChapter.book && prevChapter.book !== chapterData.book.code) {
        // Update selectedBook with the book code
        setSelectedBook(prevChapter.book)
        // Find the book to get the English name for API call
        const targetBook = books.find((b) => b.code === prevChapter.book)
        if (targetBook) {
          loadChapter(
            targetBook.name.toLowerCase(),
            newChapter,
            prevChapter.book,
          )
        }
      } else {
        // Same book - use current selectedBook
        const currentBook = books.find((b) => b.code === selectedBook)
        if (currentBook) {
          loadChapter(currentBook.name.toLowerCase(), newChapter, selectedBook)
        }
      }

      // Scroll to top on mobile
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToNextChapter = () => {
    if (chapterData?.pagination.nextChapter) {
      const nextChapter = chapterData.pagination.nextChapter
      const newChapter = nextChapter.number

      // Update state first
      setSelectedChapter(newChapter)

      // Check if we're switching books
      if (nextChapter.book && nextChapter.book !== chapterData.book.code) {
        // Update selectedBook with the book code
        setSelectedBook(nextChapter.book)
        // Find the book to get the English name for API call
        const targetBook = books.find((b) => b.code === nextChapter.book)
        if (targetBook) {
          loadChapter(
            targetBook.name.toLowerCase(),
            newChapter,
            nextChapter.book,
          )
        }
      } else {
        // Same book - use current selectedBook
        const currentBook = books.find((b) => b.code === selectedBook)
        if (currentBook) {
          loadChapter(currentBook.name.toLowerCase(), newChapter, selectedBook)
        }
      }

      // Scroll to top on mobile
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const getCurrentBook = () => {
    return books.find((book) => book.code === selectedBook)
  }

  const getChapterOptions = () => {
    const currentBook = getCurrentBook()
    if (!currentBook) return []

    return Array.from({ length: currentBook.chapters }, (_, i) => i + 1)
  }

  // Verse selection functions
  const toggleVerseSelection = (verseNumber: number) => {
    const newSelected = new Set(selectedVerses)
    if (newSelected.has(verseNumber)) {
      newSelected.delete(verseNumber)
    } else {
      newSelected.add(verseNumber)
    }
    setSelectedVerses(newSelected)
    setShowShareButton(newSelected.size > 0)
  }

  const clearSelection = () => {
    setSelectedVerses(new Set())
    setShowShareButton(false)
  }

  const getShareUrl = () => {
    if (selectedVerses.size === 0) return ''

    const sortedVerses = Array.from(selectedVerses).sort((a, b) => a - b)
    let versesParam = ''

    if (sortedVerses.length === 1) {
      versesParam = sortedVerses[0].toString()
    } else {
      // Always use range format: from smallest to largest verse
      versesParam = `${sortedVerses[0]}-${sortedVerses[sortedVerses.length - 1]}`
    }

    return `${window.location.origin}/${selectedBook}/${selectedChapter}/${versesParam}`
  }

  const copyShareUrl = async () => {
    const url = getShareUrl()
    try {
      await navigator.clipboard.writeText(url)
      // You could add a toast notification here
      console.log('URL copied to clipboard:', url)
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  return (
    <div className="bg-background min-h-screen-mobile">
      {/* Mobile-First Header - Sticky */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
        <div className="px-4 py-3 md:container md:mx-auto md:max-w-4xl md:px-8 md:py-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Book className="text-primary h-5 w-5 md:h-6 md:w-6" />
              <h1 className="text-lg font-semibold md:text-xl">Bíblia NVA</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowControls(!showControls)}
              className="md:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          {/* Controls - Collapsible on mobile */}
          <div
            className={`space-y-4 ${showControls ? 'block' : 'hidden md:block'}`}
          >
            <div className="grid grid-cols-2 items-center gap-3 md:grid-cols-3 md:gap-4">
              <Select value={selectedBook} onValueChange={handleBookChange}>
                <SelectTrigger className="h-12 text-sm md:text-base">
                  <SelectValue placeholder="Selecione um livro" />
                </SelectTrigger>
                <SelectContent>
                  {books.map((book) => (
                    <SelectItem key={book.code} value={book.code}>
                      {book.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedChapter.toString()}
                onValueChange={handleChapterChange}
                disabled={!selectedBook}
              >
                <SelectTrigger className="h-12 text-sm md:text-base">
                  <SelectValue placeholder="Selecione capítulo" />
                </SelectTrigger>
                <SelectContent>
                  {getChapterOptions().map((chapter) => (
                    <SelectItem key={chapter} value={chapter.toString()}>
                      Capítulo {chapter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="hidden h-12 items-center justify-center md:flex">
                <Badge
                  variant="outline"
                  className="h-8 px-4 py-2 text-sm font-medium"
                >
                  {getCurrentBook()?.chapters || 0} capítulos
                </Badge>
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="flex items-stretch gap-3 md:hidden">
              <Button
                variant="outline"
                onClick={goToPrevChapter}
                disabled={!chapterData?.pagination.prevChapter || loading}
                className="flex h-12 flex-1 items-center justify-center text-sm"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                {chapterData?.pagination.prevChapter?.book &&
                chapterData.pagination.prevChapter.book !==
                  chapterData.book.code
                  ? getBookNamePt(chapterData.pagination.prevChapter.book) ||
                    'Anterior'
                  : 'Anterior'}
              </Button>

              <div className="flex min-w-[80px] items-center justify-center">
                <Badge
                  variant="secondary"
                  className="h-8 px-3 py-2 text-xs font-medium whitespace-nowrap"
                >
                  {chapterData ? `${chapterData.chapter.totalVerses}v` : '...'}
                </Badge>
              </div>

              <Button
                variant="outline"
                onClick={goToNextChapter}
                disabled={!chapterData?.pagination.nextChapter || loading}
                className="flex h-12 flex-1 items-center justify-center text-sm"
              >
                {chapterData?.pagination.nextChapter?.book &&
                chapterData.pagination.nextChapter.book !==
                  chapterData.book.code
                  ? getBookNamePt(chapterData.pagination.nextChapter.book) ||
                    'Próximo'
                  : 'Próximo'}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden items-center justify-between md:flex">
              <Button
                variant="outline"
                onClick={goToPrevChapter}
                disabled={!chapterData?.pagination.prevChapter || loading}
                className="flex h-12 items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                {chapterData?.pagination.prevChapter
                  ? chapterData.pagination.prevChapter.book &&
                    chapterData.pagination.prevChapter.book !==
                      chapterData.book.code
                    ? `${getBookNamePt(chapterData.pagination.prevChapter.book)} ${chapterData.pagination.prevChapter.number}`
                    : `Capítulo ${chapterData.pagination.prevChapter.number}`
                  : 'Capítulo Anterior'}
              </Button>

              <Badge
                variant="secondary"
                className="h-8 px-4 py-2 text-sm font-medium"
              >
                {chapterData
                  ? `${chapterData.chapter.totalVerses} versículos`
                  : 'Carregando...'}
              </Badge>

              <Button
                variant="outline"
                onClick={goToNextChapter}
                disabled={!chapterData?.pagination.nextChapter || loading}
                className="flex h-12 items-center gap-2"
              >
                {chapterData?.pagination.nextChapter
                  ? chapterData.pagination.nextChapter.book &&
                    chapterData.pagination.nextChapter.book !==
                      chapterData.book.code
                    ? `${getBookNamePt(chapterData.pagination.nextChapter.book)} ${chapterData.pagination.nextChapter.number}`
                    : `Capítulo ${chapterData.pagination.nextChapter.number}`
                  : 'Próximo Capítulo'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-8 md:container md:mx-auto md:max-w-4xl md:px-8">
        {loading ? (
          <div className="space-y-4 pt-4">
            <Skeleton className="h-6 w-3/4" />
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
        ) : chapterData ? (
          <div className="space-y-4 pt-4">
            {/* Chapter Title */}
            <div className="pb-2 text-center md:pb-4">
              <h2 className="text-primary mb-1 text-xl font-bold md:mb-2 md:text-3xl">
                {chapterData.chapter.name}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                {chapterData.chapter.totalVerses} versículos
              </p>
            </div>

            {/* Book Summary */}
            <Card className="mb-4 md:mb-6">
              <CardContent className="pt-4 md:pt-6">
                <div className="flex items-start gap-3 md:gap-4">
                  <Bookmark className="text-primary mt-1 h-4 w-4 flex-shrink-0 md:h-5 md:w-5" />
                  <div>
                    <h3 className="mb-1 text-sm font-medium md:mb-2 md:text-base">
                      {chapterData.book.name}
                    </h3>
                    <p className="text-muted-foreground line-clamp-3 text-xs leading-relaxed md:line-clamp-none md:text-sm md:leading-relaxed">
                      {chapterData.book.summary}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Button - Fixed position when verses are selected */}
            {showShareButton && (
              <div className="fixed right-4 bottom-4 z-50 md:right-8 md:bottom-8">
                <div className="bg-primary text-primary-foreground flex items-center gap-2 rounded-lg px-4 py-2 shadow-lg">
                  <span className="text-sm font-medium">
                    {selectedVerses.size === 1
                      ? `Versículo ${Array.from(selectedVerses)[0]}`
                      : `Versículos ${Math.min(...selectedVerses)}-${Math.max(...selectedVerses)}`}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 p-0"
                    onClick={copyShareUrl}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 p-0"
                    onClick={clearSelection}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Verses - Optimized for mobile reading with selection */}
            <div className="space-y-4 pb-4 md:space-y-6">
              {chapterData.verses.map((verse) => {
                const isSelected = selectedVerses.has(verse.verse)
                return (
                  <div
                    key={verse.verse}
                    className={`group flex cursor-pointer gap-3 rounded-lg p-2 leading-relaxed transition-colors md:gap-4 ${
                      isSelected
                        ? 'bg-primary/10 border-primary/20 border'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleVerseSelection(verse.verse)}
                  >
                    <span
                      className={`mt-0.5 min-w-[1.5rem] flex-shrink-0 text-sm font-semibold md:min-w-[2rem] md:text-base ${
                        isSelected ? 'text-primary' : 'text-primary'
                      }`}
                    >
                      {verse.verse}
                    </span>
                    <div className="flex-1">
                      <p className="text-foreground text-base leading-7 md:text-lg md:leading-8">
                        {verse.text}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-6 w-6 flex-shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (useUrlParams && chapterData) {
                          const shareUrl = `${window.location.origin}/${selectedBook}/${selectedChapter}/${verse.verse}`
                          navigator.clipboard.writeText(shareUrl)
                        }
                      }}
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                  </div>
                )
              })}
            </div>

            {/* Translation Credits */}
            <TranslationCredits
              translationKey={chapterData?.translation.key}
              className="mt-8 md:mt-12"
            />
          </div>
        ) : (
          <div className="text-muted-foreground pt-8 text-center">
            <Book className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Selecione um livro para começar a leitura</p>
          </div>
        )}
      </div>

      {/* Desktop Layout - Hidden on mobile */}
      <div className="fixed right-8 bottom-8 hidden md:block">
        <div className="flex gap-2">
          <Button
            onClick={goToPrevChapter}
            disabled={!chapterData?.pagination.prevChapter}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            onClick={goToNextChapter}
            disabled={!chapterData?.pagination.nextChapter}
            size="sm"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
