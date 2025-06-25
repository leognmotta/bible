import { Translation } from './types'

export const availableTranslations = ['nva'] as const
export type TranslationKey = (typeof availableTranslations)[number]

export const loadTranslation = async (
  key: TranslationKey,
): Promise<Translation> => {
  const translation = await import(`./translations/${key}.json`)

  if (!translation.default) {
    throw new Error(`Translation '${key}' not found`)
  }

  return translation.default as Translation
}
