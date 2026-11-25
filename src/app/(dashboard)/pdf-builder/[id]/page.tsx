import { PdfBuilderPage } from '@/_pages/pdf-builder'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PdfBuilderPage id={id} />
}
