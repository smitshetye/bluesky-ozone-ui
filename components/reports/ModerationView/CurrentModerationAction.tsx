import { ComAtprotoAdminDefs } from '@atproto/api'
import { ShieldExclamationIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'

import { actionOptions, getActionClassNames } from './ActionHelpers'

type Props = {
  currentAction?: ComAtprotoAdminDefs.ActionViewCurrent
  currentActionMaybeReplace?: ComAtprotoAdminDefs.ActionViewCurrent
  currentActionDetail: ComAtprotoAdminDefs.ActionView | undefined
  toggleReplaceMode: () => void
  replacingAction: boolean
}

const ActionLink = ({
  currentAction,
  currentActionDetail,
}: Pick<Props, 'currentAction' | 'currentActionDetail'>) => {
  if (!currentAction) return null

  const actionColorClasses = getActionClassNames({
    action: currentAction?.action,
  })
  const displayActionType = currentAction?.action.replace(
    'com.atproto.admin.defs#',
    '',
  )
  return (
    <Link
      href={`/actions/${currentAction.id}`}
      title={displayActionType}
      className={actionColorClasses}
    >
      <ShieldExclamationIcon className="h-4 w-4 inline-block align-text-bottom" />{' '}
      #{currentAction.id}
      {currentActionDetail && (
        <> ({actionOptions[currentActionDetail.action]})</>
      )}
    </Link>
  )
}

export const CurrentModerationAction = ({
  currentAction,
  currentActionDetail,
  toggleReplaceMode,
  replacingAction,
  currentActionMaybeReplace,
}: Props) => {
  if (!currentAction && !currentActionMaybeReplace) {
    return null
  }

  let containerClassName =
    'flex flex-row justify-between max-w-xl rounded border-2 border-dashed p-2 pb-0 mb-3 '
  const replaceButtonClassName = `inline-flex items-center rounded border disabled:bg-gray-100 px-3 py-1 text-sm disabled:text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:ring-offset-1 ${
    replacingAction
      ? 'bg-indigo-700 text-white'
      : 'text-indigo-700 border-indigo-700 bg-white'
  }`

  containerClassName += replacingAction
    ? getActionClassNames({
        action: currentActionMaybeReplace?.action,
        prop: 'border',
      })
    : 'border-gray-300'

  return (
    <div className={containerClassName}>
      <div className="text-sm text-gray-600 mb-2 mr-1">
        <p className="font-medium text-gray-500 mb-2">
          {currentAction && !replacingAction ? (
            <>
              Current Action{' '}
              <ActionLink
                currentAction={currentAction}
                currentActionDetail={currentActionDetail}
              />
            </>
          ) : (
            <>
              Replacing Current Action{' '}
              <ActionLink
                currentAction={currentActionMaybeReplace}
                currentActionDetail={currentActionDetail}
              />
            </>
          )}
        </p>

        {currentActionDetail && (
          <p>
            Reason:{' '}
            {currentActionDetail.reason ? (
              <span className="text-gray-500">
                {currentActionDetail.reason}
              </span>
            ) : (
              <span className="italic text-gray-300">N/A</span>
            )}
          </p>
        )}
      </div>
      <div>
        <button
          className={replaceButtonClassName}
          onClick={(e) => {
            e.preventDefault()
            toggleReplaceMode()
          }}
          role="button"
        >
          {replacingAction ? 'Stop Replacing' : 'Replace Action'}
        </button>
      </div>
    </div>
  )
}