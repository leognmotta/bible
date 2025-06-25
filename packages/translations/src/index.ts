import { Translation } from './types'

export const availableTranslations = ['nva'] as const

export const loadTranslation = async (key: string): Promise<Translation> => {
  const translation = await import(`./translations/${key}.json`)

  if (!translation.default) {
    throw new Error(`Translation '${key}' not found`)
  }

  return translation.default as Translation
}
