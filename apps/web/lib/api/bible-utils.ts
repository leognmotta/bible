import { loadTranslation } from '@bible/translations'

import { normalizeBookName } from './book-abbreviations'

// Define types locally to avoid import issues
interface Verse {
  verse: number
  chapter: number
  name: string
  text: string
}

interface Chapter {
  chapter: number
  name: string
  verses: Verse[]
}

interface Book {
  chapters: Chapter[]
  name: string
}

interface Translation {
  books: Book[]
}

// Custom error classes
export class BibleAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
  ) {
    super(message)
    this.name = 'BibleAPIError'
  }
}

export class NotFoundError extends BibleAPIError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class ValidationError extends BibleAPIError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

// Cache for loaded translations
const translationCache = new Map<string, Translation>()

// Utility: Load translation with caching
export async function getTranslation(key: string): Promise<Translation> {
  if (translationCache.has(key)) {
    return translationCache.get(key)!
  }

  try {
    const translation = await loadTranslation(key)
    translationCache.set(key, translation)
    return translation
  } catch (error) {
    throw new NotFoundError(`Translation '${key}'`)
  }
}

// Utility: Find book in translation (supports abbreviations)
export function findBook(translation: Translation, bookName: string): Book {
  // First normalize the book name (convert abbreviations to full names)
  const normalizedInput = normalizeBookName(bookName)

  // Try to find the book using the normalized name
  let book = translation.books.find(
    (b: Book) => b.name.toLowerCase() === normalizedInput,
  )

  // If not found with normalized name, try direct match
  if (!book) {
    book = translation.books.find(
      (b: Book) => b.name.toLowerCase() === bookName.toLowerCase(),
    )
  }

  // If still not found, try partial matching
  if (!book) {
    book = translation.books.find((b: Book) => {
      const bookNameLower = b.name.toLowerCase()
      const inputLower = bookName.toLowerCase()

      // Check if book name contains the input or vice versa
      return (
        bookNameLower.includes(inputLower) || inputLower.includes(bookNameLower)
      )
    })
  }

  if (!book) {
    throw new NotFoundError(
      `Book '${bookName}' (searched as '${normalizedInput}')`,
    )
  }

  return book
}

// Utility: Find chapter in book
export function findChapter(book: Book, chapterNum: number): Chapter {
  const chapter = book.chapters.find((c: Chapter) => c.chapter === chapterNum)

  if (!chapter) {
    throw new NotFoundError(`Chapter ${chapterNum} in book '${book.name}'`)
  }

  return chapter
}

// Utility: Find verse in chapter
export function findVerse(chapter: Chapter, verseNum: number): Verse {
  const verse = chapter.verses.find((v: Verse) => v.verse === verseNum)

  if (!verse) {
    throw new NotFoundError(`Verse ${verseNum} in chapter ${chapter.chapter}`)
  }

  return verse
}

// Utility: Validate numeric parameters
export function validateNumber(value: string, name: string): number {
  const num = parseInt(value)
  if (isNaN(num) || num < 1) {
    throw new ValidationError(`${name} must be a positive number`)
  }
  return num
}

// Utility: Filter verses by range
export function filterVersesByRange(
  verses: Verse[],
  from?: string,
  to?: string,
): Verse[] {
  if (!from && !to) return verses

  const fromVerse = from ? validateNumber(from, 'from') : 1
  const toVerse = to ? validateNumber(to, 'to') : verses.length

  if (fromVerse > toVerse) {
    throw new ValidationError("'from' cannot be greater than 'to'")
  }

  return verses.filter((v: Verse) => v.verse >= fromVerse && v.verse <= toVerse)
}

// Utility: Format verse response
export function formatVerse(
  verse: Verse,
  bookName: string,
  chapterNum: number,
  translationKey: string = 'nva',
) {
  return {
    verse: verse.verse,
    chapter: chapterNum,
    book: bookName,
    translation: translationKey,
    name: `${bookName} ${chapterNum}:${verse.verse}`,
    text: verse.text,
  }
}

// Utility: Format chapter response
export function formatChapter(
  chapter: Chapter,
  bookName: string,
  translationKey: string = 'nva',
  versesFilter?: { from?: string; to?: string },
) {
  const filteredVerses = versesFilter
    ? filterVersesByRange(chapter.verses, versesFilter.from, versesFilter.to)
    : chapter.verses

  return {
    translation: translationKey,
    book: bookName,
    chapter: chapter.chapter,
    name: chapter.name,
    verses: filteredVerses.map((verse: Verse) =>
      formatVerse(verse, bookName, chapter.chapter, translationKey),
    ),
  }
}

// Utility: Format book info
export function formatBookInfo(book: Book, translationKey: string = 'nva') {
  return {
    translation: translationKey,
    name: book.name,
    displayName: book.name,
    chapters: book.chapters.map((chapter: Chapter) => ({
      chapter: chapter.chapter,
      name: chapter.name,
      verses: chapter.verses.length,
    })),
    totalChapters: book.chapters.length,
    totalVerses: book.chapters.reduce(
      (total: number, chapter: Chapter) => total + chapter.verses.length,
      0,
    ),
  }
}

// Utility: Get available translations info
export function getAvailableTranslations() {
  return [
    {
      key: 'nva',
      name: 'Nova Versão de Acesso Livre (NVA)',
      language: 'pt-BR',
      description: 'Portuguese Bible translation',
    },
  ]
}

// Utility: Search verses in translation
export function searchVerses(
  translation: Translation,
  query: string,
  translationKey: string = 'nva',
  limit: number = 20,
) {
  const results: ReturnType<typeof formatVerse>[] = []
  const searchTerm = query.toLowerCase()

  for (const book of translation.books) {
    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        if (verse.text.toLowerCase().includes(searchTerm)) {
          results.push(
            formatVerse(verse, book.name, chapter.chapter, translationKey),
          )
          if (results.length >= limit) {
            return results
          }
        }
      }
    }
  }

  return results
}

// Utility: Get multiple chapters
export function getMultipleChapters(
  book: Book,
  fromChapter: number,
  toChapter: number,
  translationKey: string = 'nva',
) {
  if (fromChapter > toChapter) {
    throw new ValidationError(
      "'from' chapter cannot be greater than 'to' chapter",
    )
  }

  const chapters = book.chapters.filter(
    (c: Chapter) => c.chapter >= fromChapter && c.chapter <= toChapter,
  )

  return chapters.map((chapter: Chapter) =>
    formatChapter(chapter, book.name, translationKey),
  )
}

// Utility: Error response formatter
export function formatErrorResponse(error: unknown) {
  if (error instanceof BibleAPIError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    }
  }

  // Generic error
  return {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  }
}
