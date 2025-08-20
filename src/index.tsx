import { FlatList } from 'react-native-gesture-handler'
import { View, StyleProp, ViewStyle, Platform } from 'react-native'
import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'

import type { InternalDefaultEntryMethodsType } from './types'

import EntryWrapper from './components/EntryWrapper'
import ActionWrapper from './components/ActionWrapper'

import { DEFAULT_SPRING_CONFIG, sleep } from './helpers'

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

interface ChatbotPropsType<K, T> {
  entries: K
  components: T
  initEntry: keyof K
  initAction?: keyof T | undefined
  exitEntriesKeys?: Array<keyof K>
  springConfig?: typeof DEFAULT_SPRING_CONFIG
  chatbotHistory: (string | Record<string, unknown>)[]
  contentContainerStyle?: StyleProp<ViewStyle> | undefined
  setChatbotHistory: (newHistoryKey: keyof K | Record<string, unknown>) => void
  onEntryWillUpdate?: ((nextEntryKey: keyof K | Record<string, unknown>) => void | Promise<void>) | undefined
  refMethods?: (methods: {
    removeActiveAction: () => void
    sleepBeforeNextEntry: () => void
    addNewEntryToHistory: (key: keyof K | Record<string, unknown>) => void
  }) => void
}

/**
 * A boolean indicating, whether chatbot container and the bubbles within it should use inverted FlatList (true)
 * or be flipped manually using transform instead (false).
 * This is a "hack" to prevent bad performance, laggy animations and app freezing when using an
 * inverted FlatList on Android 13.
 * @see https://github.com/facebook/react-native/issues/34583
 */
export const USE_INVERTED_FLAT_LIST = !(Platform.OS === 'android' && Platform.Version >= 33)

const Chatbot = <
  K extends Record<
    string,
    Record<string, unknown> &
      InternalDefaultEntryMethodsType & {
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
  exitEntriesKeys,
  setChatbotHistory,
  onEntryWillUpdate,
  contentContainerStyle,
  springConfig = DEFAULT_SPRING_CONFIG,
}: ChatbotPropsType<K, T>): JSX.Element => {
  const [activeAction, setActiveAction] = useState<null | {
    key: string
    props: Record<string, unknown>
  }>(null)
  const isRenderingEntry = useRef(false)
  const hasHistory = !!chatbotHistory.length
  const wasAnyExitKeyNotRenderedYet = useRef(true)
  const [actionHeight, setActionHeight] = useState<number>(0)
  const entryQueue = useRef<Array<keyof K | Record<string, unknown>>>([])
  const [latestPersistedEntry, setLatestPersistedEntry] = useState<string | Record<string, unknown> | null | -1>(null)

  const processEntryQueue = useCallback(() => {
    if (isRenderingEntry.current) return // NOTE: Already rendering a message
    if (entryQueue.current.length === 0) return // NOTE: No entry to process

    isRenderingEntry.current = true
    const key: keyof K | Record<string, unknown> | undefined = entryQueue.current.shift()

    if (key) {
      onEntryWillUpdate?.(key)
      setChatbotHistory(key)
    }
  }, [onEntryWillUpdate, setChatbotHistory])

  const addNewEntryToHistory = useCallback(
    (key: keyof K | Record<string, unknown>) => {
      const isNewEntryKeyNotAlreadyInQueue = !entryQueue.current.includes(key)

      if (isNewEntryKeyNotAlreadyInQueue && wasAnyExitKeyNotRenderedYet.current) {
        entryQueue.current.push(key)
        processEntryQueue()
      }

      if (
        exitEntriesKeys?.includes(
          typeof key === 'string' ? key : (key as { key: string }).key ?? (key as { testID: string }).testID,
        )
      ) {
        wasAnyExitKeyNotRenderedYet.current = false
      }
    },
    [exitEntriesKeys, processEntryQueue],
  )

  const sleepBeforeNextEntry = async (duration = 1) => {
    await sleep(duration)
    isRenderingEntry.current = false
    processEntryQueue()
  }

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

    refMethods?.({ addNewEntryToHistory, removeActiveAction, sleepBeforeNextEntry })

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
        data={chatbotHistory}
        inverted={USE_INVERTED_FLAT_LIST}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
        style={[{ flex: 1 }, animatedPadding, !USE_INVERTED_FLAT_LIST && { transform: [{ rotate: '180deg' }] }]}
        keyExtractor={(item, index): string => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const key = (chatbotHistory.length - 1 - index).toString() + (typeof item === 'string' ? item : item.id)

          return key
        }}
        renderItem={({ item, index }): JSX.Element => {
          const isKey = typeof item === 'string'
          const entry = isKey ? entries[item] : item

          if (!entry) throw new Error(`There is no entry with a key ${item}`)

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
              isLast={isLast}
              setActiveAction={addActiveAction}
              removeAction={removeActiveAction}
              setNewEntry={addNewEntryToHistory}
              isLastInGroup={!isSameAsNextEntry}
              isLatestSetEntry={isLatestSetEntry}
              isFirstInGroup={!isSameAsPreviousEntry}
              sleepBeforeNextEntry={sleepBeforeNextEntry}
              isLatestPersistedEntry={latestPersistedEntry === item}
              isInMiddleOfTheGroup={!!isSameAsPreviousEntry && !!isSameAsNextEntry}
              isLatestRenderedEntry={isLatestSetEntry || latestPersistedEntry === item}
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              onRender={entry.onRender as InternalDefaultEntryMethodsType['onRender']}>
              {EntryComponent ? <EntryComponent /> : undefined}
            </EntryWrapper>
          )
        }}
      />

      {activeAction && (
        <ActionWrapper
          springConfig={springConfig}
          componentKey={activeAction.key}
          componentProps={activeAction.props}
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
