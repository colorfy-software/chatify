import { createElement, Platform, StyleSheet, View } from 'react-native'
import Animated, { withSpring } from 'react-native-reanimated'
import React, { memo, ReactElement, Component, useState, cloneElement } from 'react'

import type { DEFAULT_SPRING_CONFIG } from '../helpers'

interface ChatbotActionWrapper<K extends string, T extends Record<string, unknown>> {
  componentKey: K
  componentProps: T
  springConfig: typeof DEFAULT_SPRING_CONFIG
  onHeight?: ((height: number) => void) | undefined
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

const ActionWrapper = <K extends string, T extends Record<string, unknown>>({
  children,
  onHeight,
  springConfig,
  componentProps,
}: ChatbotActionWrapper<K, T>): JSX.Element => {
  const Comp = (): JSX.Element => (children ? cloneElement(children, componentProps) : createElement(View))
  const [compHeight, setCompHeight] = useState(0)

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const exiting = values => {
    'worklet'
    const animations = {
      originY: withSpring(values.currentOriginY + compHeight + 200, springConfig),
      opacity: withSpring(0, springConfig),
    }
    const initialValues = {
      originY: values.currentOriginY,
      opacity: 1,
    }
    return {
      initialValues,
      animations,
    }
  }

  return (
    <Animated.View
      exiting={exiting}
      style={styles.container}
      needsOffscreenAlphaCompositing={Platform.OS === 'android'}
      onLayout={e => {
        const height = e.nativeEvent.layout.height
        onHeight?.(height) && setCompHeight(height)
      }}>
      <Comp />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
})

const propsAreEqual = () => true

export default memo(ActionWrapper, propsAreEqual) as typeof ActionWrapper
