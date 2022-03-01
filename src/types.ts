export interface DefaultEntryPropsType {
  componentType: string
}

export interface ComponentExtraProps {
  isInMiddleOfTheGroup?: boolean
  isLastInGroup?: boolean
  isFirstInGroup?: boolean
  isLast?: boolean
  isLatestSetEntry?: boolean
  isLastEntryRendered?: boolean
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
        addAction: <T extends keyof K, V extends K[T]>(actionKey: T, props: V) => void
        closeAction: () => void
        setNewEntry: (entryKey: string | Record<string, unknown>) => void
        isLatestSetEntry: boolean
        isLatestPersistedEntry: boolean
        isLastEntryRendered: boolean
      }) => void)
    | undefined
}

export interface DefaultEntryMethodsTypeInternal {
  onRender?:
    | (({
        addAction,
        closeAction,
        setNewEntry,
        isLatestSetEntry,
        isLatestPersistedEntry,
      }: {
        addAction: (actionKey: string, props: unknown) => void | undefined
        closeAction: () => void
        setNewEntry: (entryKey: string | Record<string, unknown>) => void
        isLatestSetEntry: boolean
        isLatestPersistedEntry: boolean
        isLastEntryRendered: boolean
      }) => void)
    | undefined
}
