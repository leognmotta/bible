export type Verse = string

export type Chapter = Verse[]

export type Book = {
  code: string
  name: string
  chapters: Chapter[]
}

export type Scripture = Book[]
