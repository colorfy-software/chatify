import { FlatList } from 'react-native-gesture-handler'
import { View, StyleProp, ViewStyle } from 'react-native'
import React, { memo, useCallback, useEffect, useState } from 'react'
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'

import type { DefaultEntryMethodsTypeInternal } from './types'

import EntryWrapper from './components/EntryWrapper'
import ActionWrapper from './components/ActionWrapper'

import { DEFAULT_SPRING_CONFIG } from './helpers'

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

interface ChatbotPropsType<K, T> {
  entries: K
  components: T
  initEntry: keyof K
  initAction?: keyof T | undefined
  springConfig?: typeof DEFAULT_SPRING_CONFIG
  chatbotHistory: (string | Record<string, unknown>)[]
  contentContainerStyle?: StyleProp<ViewStyle> | undefined
  refMethods?: (methods: { removeActiveAction: () => void }) => void
  setChatbotHistory: (newHistoryKey: keyof K | Record<string, unknown>) => void
  onEntryWillUpdate?: ((nextEntryKey: keyof K | Record<string, unknown>) => void | Promise<void>) | undefined
}

const Chatbot = <
  K extends Record<
    string,
    Record<string, unknown> &
      DefaultEntryMethodsTypeInternal & {
        componentType: string
      }
  >,
  T extends { [key: string]: React.ElementType },
>({
  entries,
  initEntry,
  refMethods,
  components,
  chatbotHistory,
  setChatbotHistory,
  onEntryWillUpdate,
  contentContainerStyle,
  springConfig = DEFAULT_SPRING_CONFIG,
}: ChatbotPropsType<K, T>): JSX.Element => {
  const [activeAction, setActiveAction] = useState<null | {
    key: string
    props: Record<string, unknown>
  }>(null)
  const [latestPersistedEntry, setLatestPersistedEntry] = useState<string | Record<string, unknown> | null | -1>(null)
  const [actionHeight, setActionHeight] = useState<number>(0)
  const hasHistory = !!chatbotHistory.length

  const addNewEntryToHistory = useCallback(
    (key: keyof K | Record<string, unknown>) => {
      onEntryWillUpdate && onEntryWillUpdate(key)

      setChatbotHistory(key)
    },
    [onEntryWillUpdate, setChatbotHistory],
  )

  const removeActiveAction = useCallback(() => {
    setActiveAction(null)
    setActionHeight(0)
  }, [])

  const addActiveAction = useCallback(({ key, actionProps }: { key: string; actionProps: Record<string, unknown> }) => {
    setActiveAction({
      key,
      props: actionProps,
    })
  }, [])

  const onActionHeight = useCallback(
    (height: number) => {
      if (actionHeight !== height) {
        setActionHeight(height)
      }
    },
    [actionHeight],
  )

  // NOTE: If there's no history we start the chatbot with init entry.
  useEffect(() => {
    if (!hasHistory && initEntry) {
      addNewEntryToHistory(initEntry)
    }

    const latestEntry = chatbotHistory.length ? chatbotHistory[0] : -1
    if (!latestPersistedEntry && latestEntry) setLatestPersistedEntry(latestEntry)

    refMethods?.({ removeActiveAction })

    // NOTE: We voluntarily omitted the dependency array content as we want to run this only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ActionComponent = activeAction ? components[activeAction.key] : View

  const animatedPadding = useAnimatedStyle(() => {
    return {
      paddingTop: withSpring(actionHeight, springConfig),
    }
  })

  return (
    <View style={{ flex: 1 }}>
      <AnimatedFlatList
        inverted
        data={chatbotHistory}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        style={[{ flex: 1 }, animatedPadding]}
        keyExtractor={(item, index): string => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const key = (chatbotHistory.length - 1 - index).toString() + (typeof item === 'string' ? item : item.id)

          return key
        }}
        renderItem={({ item, index }): JSX.Element => {
          const isKey = typeof item === 'string'
          const entry = isKey ? entries[item] : item

          if (!entry) {
            throw new Error(`There is no entry with a key ${item}`)
          }

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const entryComponentType = entry.componentType as string
          const EntryComponent = components[entryComponentType]
          const isLast = index === 0
          const isLatestSetEntry = latestPersistedEntry !== item && isLast

          const prevEntryFromHistory = chatbotHistory[index + 1]
          const nextEntryFromHistory = chatbotHistory[index - 1]

          const previousEntry =
            !!prevEntryFromHistory &&
            (typeof prevEntryFromHistory === 'string' ? entries[prevEntryFromHistory] : prevEntryFromHistory)
          const nextEntry =
            !!nextEntryFromHistory &&
            (typeof nextEntryFromHistory === 'string' ? entries[nextEntryFromHistory] : nextEntryFromHistory)

          const isSameAsPreviousEntry = previousEntry && previousEntry.componentType === entryComponentType
          const isSameAsNextEntry = nextEntry && nextEntry.componentType === entryComponentType

          return (
            <EntryWrapper
              entry={entry}
              setActiveAction={addActiveAction}
              isLast={isLast}
              isLatestSetEntry={isLatestSetEntry}
              isLatestPersistedEntry={latestPersistedEntry === item}
              setNewEntry={addNewEntryToHistory}
              removeAction={removeActiveAction}
              isLastInGroup={!isSameAsNextEntry}
              isInMiddleOfTheGroup={!!isSameAsPreviousEntry && !!isSameAsNextEntry}
              isFirstInGroup={!isSameAsPreviousEntry}
              isLastEntryRendered={isLatestSetEntry || latestPersistedEntry === item}
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              onRender={entry.onRender as DefaultEntryMethodsTypeInternal['onRender']}>
              {EntryComponent ? <EntryComponent /> : undefined}
            </EntryWrapper>
          )
        }}
      />

      {activeAction && (
        <ActionWrapper
          componentKey={activeAction.key}
          componentProps={activeAction.props}
          springConfig={springConfig}
          onHeight={onActionHeight}>
          {ActionComponent ? <ActionComponent /> : undefined}
        </ActionWrapper>
      )}
    </View>
  )
}

export default memo(Chatbot) as typeof Chatbot
export { default as ChatbotBubbleWrapper } from './components/BubbleWrapper'
export * from './types'
