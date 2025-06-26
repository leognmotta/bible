// This page redirects to the new URL structure
import { redirect } from 'next/navigation'

interface PageProps {
  searchParams: Promise<{
    book?: string
    chapter?: string
  }>
}

export default async function HomePage(props: PageProps) {
  // Await searchParams in Next.js 15
  const searchParams = await props.searchParams

  // Get query parameters
  const bookParam = searchParams.book || 'gn' // Default to Genesis code
  const chapterParam = searchParams.chapter || '1' // Default to chapter 1
  const chapterNum = parseInt(chapterParam, 10) || 1

  // If we have book/chapter params, redirect to new URL structure
  if (searchParams.book || searchParams.chapter) {
    redirect(`/${bookParam.toLowerCase()}/${chapterNum}`)
  }

  // Default redirect to Genesis 1 using book code
  redirect('/gn/1')
}

// Generate metadata for SEO
export async function generateMetadata() {
  return {
    title: 'Bíblia NVA - Nova Versão de Acesso Livre',
    description: 'Leia a Bíblia online na Nova Versão de Acesso Livre',
    openGraph: {
      title: 'Bíblia NVA - Nova Versão de Acesso Livre',
      description: 'Leia a Bíblia online na Nova Versão de Acesso Livre',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Bíblia NVA - Nova Versão de Acesso Livre',
      description: 'Leia a Bíblia online na Nova Versão de Acesso Livre',
    },
  }
}
