export interface DefaultEntryPropsType {
  componentType: string
}

export interface ComponentExtraPropsType {
  isLast?: boolean
  isLastInGroup?: boolean
  isFirstInGroup?: boolean
  isLatestSetEntry?: boolean
  isLastEntryRendered?: boolean
  isInMiddleOfTheGroup?: boolean
  isLatestPersistedEntry?: boolean | null
}

export interface DefaultEntryMethodsType<K extends Record<keyof K, K[keyof K]>> {
  onRender?:
    | (({
        addAction,
        closeAction,
        setNewEntry,
        isLatestSetEntry,
        isLatestPersistedEntry,
      }: {
        closeAction: () => void
        isLatestSetEntry: boolean
        isLastEntryRendered: boolean
        isLatestPersistedEntry: boolean
        sleepBeforeNextEntry: (duration?: number) => void
        setNewEntry: (entryKey: string | Record<string, unknown>) => void
        addAction: <T extends keyof K, V extends K[T]>(actionKey: T, props: V) => void
      }) => void)
    | undefined
}

export interface InternalDefaultEntryMethodsType {
  onRender?:
    | (({
        addAction,
        closeAction,
        setNewEntry,
        isLatestSetEntry,
        isLatestPersistedEntry,
      }: {
        closeAction: () => void
        isLatestSetEntry: boolean
        isLastEntryRendered: boolean
        isLatestPersistedEntry: boolean
        setNewEntry: (entryKey: string | Record<string, unknown>) => void
        addAction: (actionKey: string, props: unknown) => void | undefined
      }) => void)
    | undefined
}
