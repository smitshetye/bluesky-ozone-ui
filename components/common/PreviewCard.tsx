import { parseAtUri } from '@/lib/util'
import { CollectionId } from '@/reports/helpers/subject'
import { ReactNode } from 'react'
import { RecordCard, RepoCard } from './RecordCard'

const PreviewTitleMap = {
  [CollectionId.Post]: 'Reported post',
  [CollectionId.FeedGenerator]: 'Reported feed',
  [CollectionId.List]: 'Reported list',
  [CollectionId.Profile]: 'Reported profile',
}

const getPreviewTitleForAtUri = (uri: string): string => {
  const { collection } = parseAtUri(uri) || {}

  // If the collection is not in the map or collection isn't available, default to post
  return (
    PreviewTitleMap[collection || CollectionId.Post] ||
    (collection
      ? // If the collection is a string, use the last two segments as the title
        // so app.bsky.graph.list -> graph list
        `Reported ${collection.split('.').slice(-2).join(' ')}`
      : PreviewTitleMap[CollectionId.Post])
  )
}

export function PreviewCard({
  did,
  title,
  children,
}: {
  did: string
  title?: string | ReactNode
  children?: ReactNode
}) {
  if (did.startsWith('at://')) {
    const displayTitle = title || getPreviewTitleForAtUri(did)
    return (
      <div className="rounded border-2 border-dashed border-gray-300 p-2 pb-0 mb-3">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-50 mb-3">{displayTitle}</p>
        <RecordCard uri={did} />
        {children}
      </div>
    )
  }
  if (did.startsWith('did:')) {
    return (
      <div className="rounded border-2 border-dashed border-gray-300 p-2 pb-1 mb-3">
        <p className="text-sm font-medium text-gray-500 mb-3">
          {title ? title : 'Reported user'}
        </p>
        <RepoCard did={did} />
        {children}
      </div>
    )
  }

  // No preview, show placeholder
  return (
    <div className="rounded border-2 border-dashed border-gray-300 p-2 mb-3 text-center">
      <span className="text-xs text-gray-400">
        {title ? title : 'Preview placeholder'}
      </span>
      {children}
    </div>
  )
}
