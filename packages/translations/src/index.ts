import { Scripture } from './types'

export * from './types'

export const availableTranslations = ['nva'] as const

export const loadTranslation = async (code: string) => {
  try {
    const lowerCode = code.toLowerCase()
    const translation = await import(`./translations/${lowerCode}.json`)

    if (!translation.default) {
      return null
    }

    return translation.default as Scripture
  } catch (error) {
    console.error(error)
    return null
  }
}
