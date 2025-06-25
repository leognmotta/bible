import { Hono } from 'hono'
import { handle } from 'hono/vercel'

import {
  BibleAPIError,
  findBook,
  findChapter,
  findVerse,
  formatBookInfo,
  formatChapter,
  formatErrorResponse,
  formatVerse,
  getAvailableTranslations,
  getMultipleChapters,
  getTranslation,
  searchVerses,
  validateNumber,
} from '../../../lib/api/bible-utils'
import {
  BOOK_ABBREVIATIONS,
  getBookAliases,
  isValidBookName,
  searchBooks,
} from '../../../lib/api/book-abbreviations'

export const runtime = 'edge'

const app = new Hono().basePath('/api')

// Helper function to handle errors
const handleError = (c: any, error: unknown) => {
  const errorResponse = formatErrorResponse(error)
  return c.json(
    { error: errorResponse.error, code: errorResponse.code },
    errorResponse.statusCode,
  )
}

// ================================
// METADATA ENDPOINTS
// ================================

// GET /api/bible/translations - Available translations
app.get('/bible/translations', async (c) => {
  try {
    const translations = getAvailableTranslations()
    return c.json({ translations })
  } catch (error) {
    return handleError(c, error)
  }
})

// GET /api/bible/{translation}/books - Book list for translation
app.get('/bible/:translation/books', async (c) => {
  try {
    const { translation } = c.req.param()
    const bibleData = await getTranslation(translation)

    const books = bibleData.books.map((book) => ({
      name: book.name,
      displayName: book.name,
      chapters: book.chapters.length,
      aliases: getBookAliases(book.name),
      abbreviations: BOOK_ABBREVIATIONS[book.name.toLowerCase()] || [],
    }))

    return c.json({ translation, books })
  } catch (error) {
    return handleError(c, error)
  }
})

// GET /api/bible/{translation}/{book}/info - Chapter info for book
app.get('/bible/:translation/:book/info', async (c) => {
  try {
    const { translation, book } = c.req.param()
    const bibleData = await getTranslation(translation)
    const bookData = findBook(bibleData, book)
    const bookInfo = formatBookInfo(bookData, translation)

    return c.json(bookInfo)
  } catch (error) {
    return handleError(c, error)
  }
})

// GET /api/bible/{translation}/{book}/aliases - Get book aliases and abbreviations
app.get('/bible/:translation/:book/aliases', async (c) => {
  try {
    const { translation, book } = c.req.param()
    const bibleData = await getTranslation(translation)
    const bookData = findBook(bibleData, book)
    const aliases = getBookAliases(bookData.name)

    return c.json({
      translation,
      book: bookData.name,
      aliases,
      isValid: isValidBookName(book),
    })
  } catch (error) {
    return handleError(c, error)
  }
})

// GET /api/bible/books/search?q={query} - Search books by abbreviation or name
app.get('/bible/books/search', async (c) => {
  try {
    const { q: query } = c.req.query()

    if (!query) {
      throw new BibleAPIError(
        "Query parameter 'q' is required",
        400,
        'MISSING_QUERY',
      )
    }

    const matches = searchBooks(query)

    return c.json({
      query,
      matches: matches.map((bookName) => ({
        name: bookName,
        aliases: getBookAliases(bookName),
        abbreviations: BOOK_ABBREVIATIONS[bookName] || [],
      })),
      total: matches.length,
    })
  } catch (error) {
    return handleError(c, error)
  }
})

// ================================
// READING ENDPOINTS
// ================================

// GET /api/bible/{translation}/{book}/{chapter}/{verse} - Get specific verse
app.get('/bible/:translation/:book/:chapter/:verse', async (c) => {
  try {
    const { translation, book, chapter, verse } = c.req.param()

    const chapterNum = validateNumber(chapter, 'chapter')
    const verseNum = validateNumber(verse, 'verse')

    const bibleData = await getTranslation(translation)
    const bookData = findBook(bibleData, book)
    const chapterData = findChapter(bookData, chapterNum)
    const verseData = findVerse(chapterData, verseNum)

    const formattedVerse = formatVerse(verseData, book, chapterNum, translation)

    return c.json(formattedVerse)
  } catch (error) {
    return handleError(c, error)
  }
})

// GET /api/bible/{translation}/{book}/chapters?from=1&to=3 - Get multiple chapters
app.get('/bible/:translation/:book/chapters', async (c) => {
  try {
    const { translation, book } = c.req.param()
    const { from, to } = c.req.query()

    if (!from || !to) {
      throw new BibleAPIError(
        "'from' and 'to' query parameters are required",
        400,
        'MISSING_PARAMS',
      )
    }

    const fromChapter = validateNumber(from, 'from')
    const toChapter = validateNumber(to, 'to')

    const bibleData = await getTranslation(translation)
    const bookData = findBook(bibleData, book)
    const chapters = getMultipleChapters(
      bookData,
      fromChapter,
      toChapter,
      translation,
    )

    return c.json({
      translation,
      book,
      chapters,
    })
  } catch (error) {
    return handleError(c, error)
  }
})

// GET /api/bible/{translation}/{book}/{chapter} - Get chapter
app.get('/bible/:translation/:book/:chapter', async (c) => {
  try {
    const { translation, book, chapter } = c.req.param()
    const { from, to } = c.req.query()

    const chapterNum = validateNumber(chapter, 'chapter')
    const bibleData = await getTranslation(translation)
    const bookData = findBook(bibleData, book)
    const chapterData = findChapter(bookData, chapterNum)

    const formattedChapter = formatChapter(
      chapterData,
      book,
      translation,
      from || to ? { from, to } : undefined,
    )

    return c.json(formattedChapter)
  } catch (error) {
    return handleError(c, error)
  }
})

// ================================
// DOWNLOAD ENDPOINTS
// ================================

// GET /api/bible/full/{translation} - Full translation download
app.get('/bible/full/:translation', async (c) => {
  try {
    const { translation } = c.req.param()
    const bibleData = await getTranslation(translation)

    // Format the full translation data
    const formattedData = {
      translation,
      name: translation === 'nva' ? 'Nova Versão Almeida' : translation,
      books: bibleData.books.map((book) => ({
        name: book.name,
        displayName: book.name,
        chapters: book.chapters.map((chapter) => ({
          chapter: chapter.chapter,
          name: chapter.name,
          verses: chapter.verses.map((verse) => ({
            verse: verse.verse,
            text: verse.text,
          })),
        })),
      })),
    }

    return c.json(formattedData)
  } catch (error) {
    return handleError(c, error)
  }
})

// GET /api/bible/{translation}/{book}/full - Full book download
app.get('/bible/:translation/:book/full', async (c) => {
  try {
    const { translation, book } = c.req.param()
    const bibleData = await getTranslation(translation)
    const bookData = findBook(bibleData, book)

    const formattedBook = {
      translation,
      book,
      displayName: bookData.name,
      chapters: bookData.chapters.map((chapter) => ({
        chapter: chapter.chapter,
        name: chapter.name,
        verses: chapter.verses.map((verse) => ({
          verse: verse.verse,
          text: verse.text,
        })),
      })),
    }

    return c.json(formattedBook)
  } catch (error) {
    return handleError(c, error)
  }
})

// ================================
// SEARCH ENDPOINTS
// ================================

// GET /api/bible/{translation}/search?q={query}&limit=20 - Search verses
app.get('/bible/:translation/search', async (c) => {
  try {
    const { translation } = c.req.param()
    const { q: query, limit } = c.req.query()

    if (!query) {
      throw new BibleAPIError(
        "Query parameter 'q' is required",
        400,
        'MISSING_QUERY',
      )
    }

    const searchLimit = limit ? validateNumber(limit, 'limit') : 20
    const bibleData = await getTranslation(translation)
    const results = searchVerses(bibleData, query, translation, searchLimit)

    return c.json({
      translation,
      query,
      results,
      total: results.length,
      limit: searchLimit,
    })
  } catch (error) {
    return handleError(c, error)
  }
})

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
export const PATCH = handle(app)
export const HEAD = handle(app)
export const OPTIONS = handle(app)
