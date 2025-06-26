import { type Book, loadTranslation, type Scripture } from '@bible/translations'

import { normalizeBookName } from './book-abbreviations'
import { bookSummaries } from './book-summaries'
// Scripture map for converting codes to names
import { scriptureMap } from './scripture-map'

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
const translationCache = new Map<string, Scripture>()

// Utility: Load translation with caching
export async function getTranslation(key: string): Promise<Scripture> {
  if (translationCache.has(key)) {
    return translationCache.get(key)!
  }

  try {
    const translation = await loadTranslation(key)
    if (!translation) {
      throw new NotFoundError(`Translation '${key}'`)
    }
    translationCache.set(key, translation)
    return translation
  } catch (error) {
    throw new NotFoundError(`Translation '${key}'`)
  }
}

// Utility: Find book in translation (supports abbreviations and codes)
export function findBook(translation: Scripture, bookInput: string): Book {
  const inputLower = bookInput.toLowerCase().trim()

  // First try to find by code (like 'gn', 'ex', etc.)
  let book = translation.find((b: Book) => b.code.toLowerCase() === inputLower)

  if (book) {
    return book
  }

  // Try to find by name (like 'Genesis', 'Exodus', etc.)
  book = translation.find((b) => b.name.toLowerCase() === inputLower)

  if (book) {
    return book
  }

  // Try to find by normalized name (convert abbreviations to full names)
  const normalizedInput = normalizeBookName(inputLower)
  book = translation.find((b) => b.name.toLowerCase() === normalizedInput)

  if (book) {
    return book
  }

  // Try to find by code using the scripture map
  const scriptureMapEntry = Object.entries(scriptureMap).find(
    ([code, names]) =>
      code.toLowerCase() === inputLower ||
      names.en.toLowerCase() === inputLower ||
      names['pt-br'].toLowerCase() === inputLower,
  )

  if (scriptureMapEntry) {
    book = translation.find(
      (b) => b.code.toLowerCase() === scriptureMapEntry[0].toLowerCase(),
    )
    if (book) {
      return book
    }
  }

  // Try partial matching
  book = translation.find((b) => {
    const bookNameLower = b.name.toLowerCase()
    return (
      bookNameLower.includes(inputLower) || inputLower.includes(bookNameLower)
    )
  })

  if (!book) {
    throw new NotFoundError(
      `Book '${bookInput}' (searched as '${normalizedInput}')`,
    )
  }

  return book
}

// Utility: Find chapter in book
export function findChapter(book: Book, chapterNum: number): string[] {
  if (chapterNum < 1 || chapterNum > book.chapters.length) {
    throw new NotFoundError(`Chapter ${chapterNum} in book '${book.name}'`)
  }

  return book.chapters[chapterNum - 1] // Convert to 0-based index
}

// Utility: Find verse in chapter
export function findVerse(chapter: string[], verseNum: number): string {
  if (verseNum < 1 || verseNum > chapter.length) {
    throw new NotFoundError(`Verse ${verseNum} in chapter`)
  }

  return chapter[verseNum - 1] // Convert to 0-based index
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
  chapter: string[],
  from?: string,
  to?: string,
): Array<{ verse: number; text: string }> {
  const fromVerse = from ? validateNumber(from, 'from') : 1
  const toVerse = to ? validateNumber(to, 'to') : chapter.length

  if (fromVerse > toVerse) {
    throw new ValidationError("'from' cannot be greater than 'to'")
  }

  const filteredVerses: Array<{ verse: number; text: string }> = []
  for (let i = fromVerse - 1; i < Math.min(toVerse, chapter.length); i++) {
    filteredVerses.push({
      verse: i + 1,
      text: chapter[i],
    })
  }

  return filteredVerses
}

// Utility: Format simple verse response (just number and text)
export function formatSimpleVerse(verseText: string, verseNum: number) {
  return {
    verse: verseNum,
    text: verseText,
  }
}

// Utility: Format translation info
export function formatTranslationInfo(translationKey: string = 'nva') {
  return {
    key: translationKey,
    name:
      translationKey === 'nva'
        ? 'Nova Versão de Acesso Livre (NVA)'
        : translationKey,
    language: 'pt-BR',
  }
}

// Utility: Format book info with summary
export function formatBookData(book: Book) {
  return {
    code: book.code,
    name: book.name,
    summary: bookSummaries[book.code] || 'No summary available.',
    chapters: book.chapters.length,
  }
}

// Utility: Get pagination metadata for verse
export function getVersePagination(
  book: Book,
  chapterNum: number,
  verseNum: number,
) {
  const currentChapter = book.chapters[chapterNum - 1]
  const isFirstVerse = verseNum === 1
  const isLastVerse = verseNum === currentChapter.length
  const isFirstChapter = chapterNum === 1
  const isLastChapter = chapterNum === book.chapters.length

  return {
    prevVerse: isFirstVerse
      ? null
      : {
          number: verseNum - 1,
          reference: `${book.name} ${chapterNum}:${verseNum - 1}`,
        },
    nextVerse: isLastVerse
      ? null
      : {
          number: verseNum + 1,
          reference: `${book.name} ${chapterNum}:${verseNum + 1}`,
        },
    prevChapter:
      isFirstVerse && !isFirstChapter
        ? {
            number: chapterNum - 1,
            reference: `${book.name} ${chapterNum - 1}`,
            lastVerse: book.chapters[chapterNum - 2].length,
          }
        : null,
    nextChapter:
      isLastVerse && !isLastChapter
        ? {
            number: chapterNum + 1,
            reference: `${book.name} ${chapterNum + 1}`,
            firstVerse: 1,
          }
        : null,
  }
}

// Utility: Get pagination metadata for chapter
export function getChapterPagination(book: Book, chapterNum: number) {
  const isFirstChapter = chapterNum === 1
  const isLastChapter = chapterNum === book.chapters.length

  return {
    prevChapter: isFirstChapter
      ? null
      : {
          number: chapterNum - 1,
          reference: `${book.name} ${chapterNum - 1}`,
          verses: book.chapters[chapterNum - 2].length,
        },
    nextChapter: isLastChapter
      ? null
      : {
          number: chapterNum + 1,
          reference: `${book.name} ${chapterNum + 1}`,
          verses: book.chapters[chapterNum].length,
        },
  }
}

// Utility: Format chapter response with new format
export function formatChapterResponse(
  chapter: string[],
  chapterNum: number,
  book: Book,
  translationKey: string = 'nva',
  versesFilter?: { from?: string; to?: string },
) {
  const verses = versesFilter
    ? filterVersesByRange(chapter, versesFilter.from, versesFilter.to)
    : chapter.map((text, index) => ({ verse: index + 1, text }))

  return {
    translation: formatTranslationInfo(translationKey),
    book: formatBookData(book),
    chapter: {
      number: chapterNum,
      name: `${book.name} ${chapterNum}`,
      totalVerses: chapter.length,
    },
    verses: verses.map(({ verse, text }) => formatSimpleVerse(text, verse)),
    pagination: getChapterPagination(book, chapterNum),
  }
}

// Utility: Format single verse response with new format
export function formatVerseResponse(
  verseText: string,
  verseNum: number,
  chapterNum: number,
  book: Book,
  translationKey: string = 'nva',
) {
  return {
    translation: formatTranslationInfo(translationKey),
    book: formatBookData(book),
    chapter: {
      number: chapterNum,
      name: `${book.name} ${chapterNum}`,
    },
    verse: {
      number: verseNum,
      text: verseText,
      reference: `${book.name} ${chapterNum}:${verseNum}`,
    },
    pagination: getVersePagination(book, chapterNum, verseNum),
  }
}

// Utility: Format book info
export function formatBookInfo(book: Book, translationKey: string = 'nva') {
  return {
    translation: translationKey,
    name: book.name,
    displayName: book.name,
    chapters: book.chapters.map((chapter, index) => ({
      chapter: index + 1,
      name: `${book.name} ${index + 1}`,
      verses: chapter.length,
    })),
    totalChapters: book.chapters.length,
    totalVerses: book.chapters.reduce(
      (total, chapter) => total + chapter.length,
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
  translation: Scripture,
  query: string,
  translationKey: string = 'nva',
  limit: number = 20,
) {
  const results: ReturnType<typeof formatVerseResponse>[] = []
  const searchTerm = query.toLowerCase()

  for (const book of translation) {
    for (
      let chapterIndex = 0;
      chapterIndex < book.chapters.length;
      chapterIndex++
    ) {
      const chapter = book.chapters[chapterIndex]
      for (let verseIndex = 0; verseIndex < chapter.length; verseIndex++) {
        const verseText = chapter[verseIndex]
        if (verseText.toLowerCase().includes(searchTerm)) {
          results.push(
            formatVerseResponse(
              verseText,
              verseIndex + 1,
              chapterIndex + 1,
              book,
              translationKey,
            ),
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

  if (fromChapter < 1 || toChapter > book.chapters.length) {
    throw new ValidationError(
      `Chapter range ${fromChapter}-${toChapter} is invalid for book '${book.name}'`,
    )
  }

  const chapters = []
  for (let i = fromChapter - 1; i < toChapter; i++) {
    chapters.push(
      formatChapterResponse(book.chapters[i], i + 1, book, translationKey),
    )
  }

  return chapters
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
