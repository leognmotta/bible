import { scriptureMap } from '@/lib/api/scripture-map'

export type BookCode = keyof typeof scriptureMap

// Get book name in English from code
export function getBookName(code: string): string | null {
  const bookCode = code as BookCode
  return scriptureMap[bookCode]?.en || null
}

// Get book name in Portuguese from code
export function getBookNamePt(code: string): string | null {
  const bookCode = code as BookCode
  return scriptureMap[bookCode]?.['pt-br'] || null
}

// Get book code from English name
export function getBookCodeFromName(name: string): string | null {
  const normalizedName = name.toLowerCase()

  for (const [code, names] of Object.entries(scriptureMap)) {
    if (names.en.toLowerCase() === normalizedName) {
      return code
    }
  }

  return null
}

// Check if a book code is valid
export function isValidBookCode(code: string): boolean {
  return code in scriptureMap
}

// Get all book codes
export function getAllBookCodes(): BookCode[] {
  return Object.keys(scriptureMap) as BookCode[]
}

// Convert old book names to codes for backward compatibility
export function convertBookNameToCode(bookParam: string): string {
  // If it's already a valid code, return it
  if (isValidBookCode(bookParam)) {
    return bookParam
  }

  // Try to find by English name
  const code = getBookCodeFromName(bookParam)
  if (code) {
    return code
  }

  // Common mappings for backward compatibility
  const nameToCodeMap: Record<string, string> = {
    genesis: 'gn',
    exodus: 'ex',
    leviticus: 'lv',
    numbers: 'nm',
    deuteronomy: 'dt',
    joshua: 'js',
    judges: 'jz',
    ruth: 'rt',
    '1samuel': '1sm',
    '2samuel': '2sm',
    '1kings': '1rs',
    '2kings': '2rs',
    '1chronicles': '1cr',
    '2chronicles': '2cr',
    ezra: 'ed',
    nehemiah: 'ne',
    esther: 'et',
    job: 'jb',
    psalms: 'sl',
    proverbs: 'pv',
    ecclesiastes: 'ec',
    songofsolomon: 'ct',
    isaiah: 'is',
    jeremiah: 'jr',
    lamentations: 'lm',
    ezekiel: 'ez',
    daniel: 'dn',
    hosea: 'os',
    joel: 'jl',
    amos: 'am',
    obadiah: 'ob',
    jonah: 'jn',
    micah: 'mq',
    nahum: 'na',
    habakkuk: 'hc',
    zephaniah: 'sf',
    haggai: 'ag',
    zechariah: 'zc',
    malachi: 'ml',
    matthew: 'mt',
    mark: 'mc',
    luke: 'lc',
    john: 'jo',
    acts: 'at',
    romans: 'rm',
    '1corinthians': '1co',
    '2corinthians': '2co',
    galatians: 'gl',
    ephesians: 'ef',
    philippians: 'fp',
    colossians: 'cl',
    '1thessalonians': '1ts',
    '2thessalonians': '2ts',
    '1timothy': '1tm',
    '2timothy': '2tm',
    titus: 'tt',
    philemon: 'fm',
    hebrews: 'hb',
    james: 'tg',
    '1peter': '1pe',
    '2peter': '2pe',
    '1john': '1jo',
    '2john': '2jo',
    '3john': '3jo',
    jude: 'jd',
    revelation: 'rv',
  }

  const normalized = bookParam.toLowerCase().replace(/\s+/g, '')
  return nameToCodeMap[normalized] || bookParam
}
