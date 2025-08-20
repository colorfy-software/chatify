import { View } from 'react-native'
import React, { cloneElement, createElement, memo, ReactElement, Component, useEffect } from 'react'

import type { ComponentExtraPropsType, InternalDefaultEntryMethodsType } from '../types'

import { USE_INVERTED_FLAT_LIST } from '../index'

type OnRenderArgumentsType = Parameters<NonNullable<InternalDefaultEntryMethodsType['onRender']>>[0]

interface EntryWrapperType<T> {
  entry: T
  testID?: string
  setNewEntry: OnRenderArgumentsType['setNewEntry']
  removeAction: OnRenderArgumentsType['closeAction']
  onRender?: InternalDefaultEntryMethodsType['onRender']
  setActiveAction: ({ key, actionProps }: { key: string; actionProps: Record<string, unknown> }) => void
  children:
    | ReactElement<
        T,
        | string
        | ((
            props: unknown,
          ) => ReactElement<
            unknown,
            string | (new (entryProps: unknown) => Component<unknown, unknown, unknown>)
          > | null)
        | (new (props: unknown) => Component<unknown>)
      >
    | undefined
}

const EntryWrapper = <T extends Record<string, unknown>>(
  props: EntryWrapperType<T> & Required<ComponentExtraPropsType>,
): JSX.Element => {
  const {
    entry,
    testID,
    isLast,
    children,
    onRender,
    setNewEntry,
    removeAction,
    isLastInGroup,
    isFirstInGroup,
    setActiveAction,
    isLatestSetEntry,
    isInMiddleOfTheGroup,
    isLatestPersistedEntry,
  } = props

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

  return (
    <View testID={testID} style={[!USE_INVERTED_FLAT_LIST && { transform: [{ rotate: '180deg' }] }]}>
      {children
        ? cloneElement(children, {
            ...entry,
            isLast,
            isLastInGroup,
            key: entry.id,
            isFirstInGroup,
            isLatestSetEntry,
            isInMiddleOfTheGroup,
            isLatestPersistedEntry,
          })
        : createElement(View)}
    </View>
  )
}

export default memo(EntryWrapper, (prevProps, nextProps) => {
  return prevProps.isLastInGroup === nextProps.isLastInGroup
}) as typeof EntryWrapper
