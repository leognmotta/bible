// Bible Book Abbreviations Mapping
// Uses scripture-map as the source of truth for book codes and names

import { scriptureMap } from './scripture-map'

// Create book abbreviations based on scripture map
export const BOOK_ABBREVIATIONS: Record<string, string[]> = {}

// Create reverse mapping for lookup
const ABBREVIATION_TO_BOOK: Record<string, string> = {}
const CODE_TO_BOOK: Record<string, string> = {}

// Build mappings from scripture map
Object.entries(scriptureMap).forEach(([bookCode, names]) => {
  const englishName = names.en.toLowerCase()
  const portugueseName = names['pt-br'].toLowerCase()

  // Create abbreviations array for this book
  BOOK_ABBREVIATIONS[englishName] = [bookCode, bookCode.toLowerCase()]

  // Map the book name to itself
  ABBREVIATION_TO_BOOK[englishName] = englishName
  ABBREVIATION_TO_BOOK[portugueseName] = englishName

  // Map the code to the book name
  ABBREVIATION_TO_BOOK[bookCode.toLowerCase()] = englishName
  CODE_TO_BOOK[bookCode.toLowerCase()] = englishName
})

// Only use abbreviations from scripture-map (no additional ones)

/**
 * Normalize book name - converts abbreviations to full book names
 * @param input - Book name or abbreviation
 * @returns Normalized book name or original input if not found
 */
export function normalizeBookName(input: string): string {
  const normalized = input.toLowerCase().trim()
  return ABBREVIATION_TO_BOOK[normalized] || normalized
}

/**
 * Check if a book name or abbreviation is valid
 * @param input - Book name or abbreviation to check
 * @returns true if valid, false otherwise
 */
export function isValidBookName(input: string): boolean {
  const normalized = input.toLowerCase().trim()
  return normalized in ABBREVIATION_TO_BOOK
}

/**
 * Get all possible names (full name + abbreviations) for a book
 * @param bookName - The full book name
 * @returns Array of all possible names for the book
 */
export function getBookAliases(bookName: string): string[] {
  const normalized = bookName.toLowerCase()

  // Try to find by exact name
  if (normalized in BOOK_ABBREVIATIONS) {
    return [normalized, ...BOOK_ABBREVIATIONS[normalized]]
  }

  // Try to find by searching scripture map
  const scriptureEntry = Object.entries(scriptureMap).find(
    ([_code, names]) =>
      names.en.toLowerCase() === normalized ||
      names['pt-br'].toLowerCase() === normalized,
  )

  if (scriptureEntry) {
    const [_code, names] = scriptureEntry
    const englishName = names.en.toLowerCase()
    const abbreviations = BOOK_ABBREVIATIONS[englishName] || []
    return [englishName, _code, ...abbreviations]
  }

  return [normalized]
}

/**
 * Search for books by partial name or abbreviation
 * @param query - Partial book name or abbreviation
 * @returns Array of matching book names
 */
export function searchBooks(query: string): string[] {
  const queryLower = query.toLowerCase().trim()
  const matches: string[] = []

  // Search in scripture map
  Object.entries(scriptureMap).forEach(([bookCode, names]) => {
    const englishName = names.en.toLowerCase()
    const portugueseName = names['pt-br'].toLowerCase()

    // Check if code matches
    if (
      bookCode.toLowerCase().startsWith(queryLower) ||
      bookCode.toLowerCase() === queryLower
    ) {
      matches.push(englishName)
      return
    }

    // Check if book name starts with query
    if (
      englishName.startsWith(queryLower) ||
      portugueseName.startsWith(queryLower)
    ) {
      matches.push(englishName)
      return
    }

    // Check if any abbreviation matches
    const abbreviations = BOOK_ABBREVIATIONS[englishName] || []
    if (
      abbreviations.some(
        (abbrev) =>
          abbrev.toLowerCase().startsWith(queryLower) ||
          abbrev.toLowerCase() === queryLower,
      )
    ) {
      matches.push(englishName)
    }
  })

  return [...new Set(matches)] // Remove duplicates
}

/**
 * Get book code from name or abbreviation
 * @param input - Book name or abbreviation
 * @returns Book code (like 'gn', 'ex') or null if not found
 */
export function getBookCode(input: string): string | null {
  const normalized = input.toLowerCase().trim()

  // Check if input is already a code
  const directMatch = Object.entries(scriptureMap).find(
    ([bookCode]) => bookCode.toLowerCase() === normalized,
  )
  if (directMatch) {
    return directMatch[0]
  }

  // Try to find by name
  const nameMatch = Object.entries(scriptureMap).find(
    ([_bookCode, names]) =>
      names.en.toLowerCase() === normalized ||
      names['pt-br'].toLowerCase() === normalized,
  )
  if (nameMatch) {
    return nameMatch[0]
  }

  // Try to find by abbreviation
  const bookName = normalizeBookName(input)
  const abbrevMatch = Object.entries(scriptureMap).find(
    ([_bookCode, names]) => names.en.toLowerCase() === bookName,
  )
  if (abbrevMatch) {
    return abbrevMatch[0]
  }

  return null
}
