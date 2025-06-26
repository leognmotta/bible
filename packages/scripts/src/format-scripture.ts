import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { scriptureMap } from './utils/scripture-map'

interface CurrentVerse {
  verse: number
  chapter: number
  name: string
  text: string
}

interface CurrentChapter {
  chapter: number
  name: string
  verses: CurrentVerse[]
}

interface CurrentBook {
  chapters: CurrentChapter[]
  name: string
}

interface CurrentTranslation {
  books: CurrentBook[]
}

// Target format interfaces (matching types.ts)
type Verse = string
type Chapter = Verse[]
interface Book {
  code: string
  name: string
  chapters: Chapter[]
}
type Scripture = Book[]

// Create a mapping from translation file book names to scripture map codes
const bookNameToCodeMap: Record<string, string> = {
  // Roman numeral mappings
  'I Chronicles': '1cr',
  'I Corinthians': '1co',
  'I John': '1jo',
  'I Kings': '1rs',
  'I Peter': '1pe',
  'I Samuel': '1sm',
  'I Thessalonians': '1ts',
  'I Timothy': '1tm',
  'II Chronicles': '2cr',
  'II Corinthians': '2co',
  'II John': '2jo',
  'II Kings': '2rs',
  'II Peter': '2pe',
  'II Samuel': '2sm',
  'II Thessalonians': '2ts',
  'II Timothy': '2tm',
  'III John': '3jo',

  // Special cases
  'Revelation of John': 'ap',

  // Direct mappings (these match exactly)
  Acts: 'at',
  Amos: 'am',
  Colossians: 'cl',
  Daniel: 'dn',
  Deuteronomy: 'dt',
  Ecclesiastes: 'ec',
  Ephesians: 'ef',
  Esther: 'et',
  Exodus: 'ex',
  Ezekiel: 'ez',
  Ezra: 'ed',
  Galatians: 'gl',
  Genesis: 'gn',
  Habakkuk: 'hc',
  Haggai: 'ag',
  Hebrews: 'hb',
  Hosea: 'os',
  Isaiah: 'is',
  James: 'tg',
  Jeremiah: 'jr',
  Job: 'jb',
  Joel: 'jl',
  John: 'jo',
  Jonah: 'jn',
  Joshua: 'js',
  Jude: 'jd',
  Judges: 'jz',
  Lamentations: 'lm',
  Leviticus: 'lv',
  Luke: 'lc',
  Malachi: 'ml',
  Mark: 'mc',
  Matthew: 'mt',
  Micah: 'mq',
  Nahum: 'na',
  Nehemiah: 'ne',
  Numbers: 'nm',
  Obadiah: 'ob',
  Philemon: 'fm',
  Philippians: 'fp',
  Proverbs: 'pv',
  Psalms: 'sl',
  Romans: 'rm',
  Ruth: 'rt',
  'Song of Solomon': 'ct',
  Titus: 'tt',
  Zechariah: 'zc',
  Zephaniah: 'sf',
}

function transformTranslation(
  currentTranslation: CurrentTranslation,
): Scripture {
  const formattedBooks: Book[] = []

  for (const currentBook of currentTranslation.books) {
    const bookCode = bookNameToCodeMap[currentBook.name]

    if (!bookCode) {
      console.warn(`Could not find code for book: ${currentBook.name}`)
      continue
    }

    // Get English name from scriptureMap
    const englishName =
      scriptureMap[bookCode as keyof typeof scriptureMap]?.en ||
      currentBook.name

    const formattedChapters: Chapter[] = currentBook.chapters.map(
      (currentChapter) => {
        // Extract just the text from each verse, in order
        return currentChapter.verses
          .sort((a, b) => a.verse - b.verse) // Ensure verses are in order
          .map((verse) => verse.text.trim())
      },
    )

    formattedBooks.push({
      code: bookCode,
      name: englishName,
      chapters: formattedChapters,
    })
  }

  return formattedBooks
}

async function formatScriptures() {
  const __dirname = path.dirname(new URL(import.meta.url).pathname)
  const translationsDir = path.join(
    __dirname,
    '..',
    '..',
    'translations',
    'src',
    'translations',
  )

  try {
    const files = await fs.readdir(translationsDir)
    const jsonFiles = files.filter(
      (file) =>
        file.endsWith('.json') &&
        !file.includes('.formatted.') &&
        !file.includes('book-names') &&
        !file.includes('analysis'),
    )

    console.log(`All files: ${files.join(', ')}`)
    console.log(`Filtered files: ${jsonFiles.join(', ')}`)
    console.log(`Found ${jsonFiles.length} translation files to format`)

    for (const file of jsonFiles) {
      console.log(`Processing ${file}...`)

      const filePath = path.join(translationsDir, file)
      const content = await fs.readFile(filePath, 'utf-8')
      const currentTranslation = JSON.parse(content) as CurrentTranslation

      // Validate the structure
      if (
        !currentTranslation.books ||
        !Array.isArray(currentTranslation.books)
      ) {
        console.warn(
          `Skipping ${file} - invalid structure (missing books array)`,
        )
        continue
      }

      // Transform the data
      const formattedTranslation = transformTranslation(currentTranslation)

      // Generate output filename
      const fileNameWithoutExt = path.parse(file).name
      const outputFileName = `${fileNameWithoutExt}.formatted.json`
      const outputPath = path.join(translationsDir, outputFileName)

      // Write the formatted file
      await fs.writeFile(
        outputPath,
        JSON.stringify(formattedTranslation, null, 2),
        'utf-8',
      )

      console.log(
        `✅ Created ${outputFileName} with ${formattedTranslation.length} books`,
      )
    }

    console.log('🎉 All translation files have been formatted successfully!')
  } catch (error) {
    console.error('Error formatting scripture files:', error)
    process.exit(1)
  }
}

formatScriptures()
