import { FormRendererPage } from '@/_pages/form-renderer'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ acceptanceRequestId?: string; constructionLogId?: string }>
}

export default async function Page({ params, searchParams }: Props) {
  const { id } = await params
  const { acceptanceRequestId, constructionLogId } = await searchParams
  return (
    <FormRendererPage
      id={id}
      acceptanceRequestId={acceptanceRequestId}
      constructionLogId={constructionLogId}
    />
  )
}
