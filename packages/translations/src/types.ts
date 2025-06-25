export interface Verse {
  verse: number
  chapter: number
  name: string
  text: string
}

export interface Chapter {
  chapter: number
  name: string
  verses: Verse[]
}

export interface Book {
  chapters: Chapter[]
  name: string
}

export interface Translation {
  books: Book[]
}
