import { createElement, View } from 'react-native'
import React, { memo, ReactElement, Component, useEffect } from 'react'

import type { DefaultEntryMethodsTypeInternal } from '../types'

interface EntryWrapperType<T> {
  entry: T
  onRender?: DefaultEntryMethodsTypeInternal['onRender']
  setNewEntry: (entry: string | Record<string, unknown>) => void
  setActiveAction: ({ key, actionProps }: { key: string; actionProps: Record<string, unknown> }) => void
  removeAction: () => void
  isLast: boolean
  isLatestSetEntry: boolean
  isLatestPersistedEntry: boolean | null
  isLastEntryRendered: boolean
  isInMiddleOfTheGroup: boolean
  isLastInGroup: boolean
  isFirstInGroup: boolean
  children:
    | ReactElement<
        T,
        | string
        | ((
            props: unknown,
          ) => ReactElement<unknown, string | (new (props: unknown) => Component<unknown, unknown, unknown>)> | null)
        | (new (props: unknown) => Component<unknown>)
      >
    | undefined
}

const EntryWrapper = <T extends Record<string, unknown>>(props: EntryWrapperType<T>): JSX.Element => {
  const {
    children,
    entry,
    onRender,
    setActiveAction,
    isLatestSetEntry,
    isLast,
    setNewEntry,
    removeAction,
    isLatestPersistedEntry,
    isInMiddleOfTheGroup,
    isLastInGroup,
    isFirstInGroup,
  } = props
  const Comp = (): JSX.Element =>
    children
      ? React.cloneElement(children, {
          ...entry,
          isInMiddleOfTheGroup,
          isLastInGroup,
          isFirstInGroup,
          isLast,
          isLatestSetEntry,
          isLatestPersistedEntry,
          key: entry.id,
        })
      : createElement(View)

  useEffect(() => {
    onRender &&
      isLast &&
      onRender({
        addAction: (key, passedProps): void => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          setActiveAction({ key, actionProps: passedProps })
        },
        closeAction: (): void => removeAction(),
        setNewEntry: (key): void => setNewEntry(key),
        // NOTE: This comes from setting a new entry from another entry.
        isLatestSetEntry,
        // NOTE: This comes from after restarting the app/chatbot and getting the latest persisted history.
        isLatestPersistedEntry: Boolean(isLatestPersistedEntry),
        isLastEntryRendered: isLatestSetEntry || Boolean(isLatestPersistedEntry),
      })
    // NOTE: We voluntarily omitted the dependency array content as we want to run this only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <Comp />
}

export default memo(EntryWrapper, (prevProps, nextProps) => {
  return prevProps.isLastInGroup === nextProps.isLastInGroup
}) as typeof EntryWrapper
