// Bible Book Abbreviations Mapping
// Supports multiple abbreviation formats for maximum compatibility

export const BOOK_ABBREVIATIONS: Record<string, string[]> = {
  // Old Testament
  genesis: ['gn', 'gen', 'ge', 'gênesis'],
  exodus: ['ex', 'exo', 'êxodo'],
  leviticus: ['lv', 'lev', 'le', 'levítico'],
  numbers: ['nm', 'num', 'nu', 'números'],
  deuteronomy: ['dt', 'deu', 'de', 'deuteronômio'],
  joshua: ['js', 'jos', 'jo', 'josué'],
  judges: ['jz', 'jdg', 'jg', 'juízes'],
  ruth: ['rt', 'rut', 'ru', 'rute'],
  '1samuel': ['1sm', '1sa', '1s', '1samuel'],
  '2samuel': ['2sm', '2sa', '2s', '2samuel'],
  '1kings': ['1rs', '1ki', '1k', '1reis'],
  '2kings': ['2rs', '2ki', '2k', '2reis'],
  '1chronicles': ['1cr', '1ch', '1c', '1crônicas'],
  '2chronicles': ['2cr', '2ch', '2c', '2crônicas'],
  ezra: ['ed', 'ezr', 'ez', 'esdras'],
  nehemiah: ['ne', 'neh', 'neemias'],
  esther: ['et', 'est', 'es', 'ester'],
  job: ['jó', 'job', 'jb'],
  psalms: ['sl', 'psa', 'ps', 'salmos'],
  proverbs: ['pv', 'pro', 'pr', 'provérbios'],
  ecclesiastes: ['ec', 'ecc', 'eclesiastes'],
  song: ['ct', 'sng', 'ss', 'cantares', 'cânticos'],
  isaiah: ['is', 'isa', 'isaías'],
  jeremiah: ['jr', 'jer', 'je', 'jeremias'],
  lamentations: ['lm', 'lam', 'la', 'lamentações'],
  ezekiel: ['ez', 'eze', 'ezequiel'],
  daniel: ['dn', 'dan', 'da', 'daniel'],
  hosea: ['os', 'hos', 'ho', 'oséias'],
  joel: ['jl', 'joe', 'joel'],
  amos: ['am', 'amo', 'amós'],
  obadiah: ['ob', 'oba', 'obadias'],
  jonah: ['jn', 'jon', 'jonas'],
  micah: ['mq', 'mic', 'mi', 'miquéias'],
  nahum: ['na', 'nah', 'naum'],
  habakkuk: ['hc', 'hab', 'ha', 'habacuque'],
  zephaniah: ['sf', 'zep', 'ze', 'sofonias'],
  haggai: ['ag', 'hag', 'hg', 'ageu'],
  zechariah: ['zc', 'zec', 'zacarias'],
  malachi: ['ml', 'mal', 'ma', 'malaquias'],

  // New Testament
  matthew: ['mt', 'mat', 'ma', 'mateus'],
  mark: ['mc', 'mrk', 'mk', 'marcos'],
  luke: ['lc', 'luk', 'lu', 'lucas'],
  john: ['jo', 'joh', 'jn', 'joão'],
  acts: ['at', 'act', 'ac', 'atos'],
  romans: ['rm', 'rom', 'ro', 'romanos'],
  '1corinthians': ['1co', '1cor', '1c', '1coríntios'],
  '2corinthians': ['2co', '2cor', '2c', '2coríntios'],
  galatians: ['gl', 'gal', 'ga', 'gálatas'],
  ephesians: ['ef', 'eph', 'ep', 'efésios'],
  philippians: ['fp', 'phi', 'ph', 'filipenses'],
  colossians: ['cl', 'col', 'co', 'colossenses'],
  '1thessalonians': ['1ts', '1th', '1t', '1tessalonicenses'],
  '2thessalonians': ['2ts', '2th', '2t', '2tessalonicenses'],
  '1timothy': ['1tm', '1ti', '1timóteo'],
  '2timothy': ['2tm', '2ti', '2timóteo'],
  titus: ['tt', 'tit', 'ti', 'tito'],
  philemon: ['fm', 'phm', 'pm', 'filemom'],
  hebrews: ['hb', 'heb', 'he', 'hebreus'],
  james: ['tg', 'jam', 'ja', 'tiago'],
  '1peter': ['1pe', '1pt', '1p', '1pedro'],
  '2peter': ['2pe', '2pt', '2p', '2pedro'],
  '1john': ['1jo', '1jn', '1j', '1joão'],
  '2john': ['2jo', '2jn', '2j', '2joão'],
  '3john': ['3jo', '3jn', '3j', '3joão'],
  jude: ['jd', 'jud', 'ju', 'judas'],
  revelation: ['ap', 'rev', 're', 'apocalipse'],

  // Deuterocanonical books (Catholic/Orthodox)
  tobit: ['tb', 'tob', 'to', 'tobias'],
  judith: ['jt', 'jdt', 'jd', 'judite'],
  wisdom: ['sb', 'wis', 'wi', 'sabedoria'],
  sirach: ['sr', 'sir', 'si', 'eclesiástico'],
  baruch: ['br', 'bar', 'ba', 'baruque'],
  '1maccabees': ['1mc', '1ma', '1m', '1macabeus'],
  '2maccabees': ['2mc', '2ma', '2m', '2macabeus'],
}

// Create reverse mapping for lookup
const ABBREVIATION_TO_BOOK: Record<string, string> = {}

// Build reverse mapping
Object.entries(BOOK_ABBREVIATIONS).forEach(([bookName, abbreviations]) => {
  // Map the book name to itself
  ABBREVIATION_TO_BOOK[bookName.toLowerCase()] = bookName.toLowerCase()

  // Map all abbreviations to the book name
  abbreviations.forEach((abbrev) => {
    ABBREVIATION_TO_BOOK[abbrev.toLowerCase()] = bookName.toLowerCase()
  })
})

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
  if (normalized in BOOK_ABBREVIATIONS) {
    return [normalized, ...BOOK_ABBREVIATIONS[normalized]]
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

  Object.entries(BOOK_ABBREVIATIONS).forEach(([bookName, abbreviations]) => {
    // Check if book name starts with query
    if (bookName.toLowerCase().startsWith(queryLower)) {
      matches.push(bookName)
      return
    }

    // Check if any abbreviation matches
    if (
      abbreviations.some(
        (abbrev) =>
          abbrev.toLowerCase().startsWith(queryLower) ||
          abbrev.toLowerCase() === queryLower,
      )
    ) {
      matches.push(bookName)
    }
  })

  return matches
}
