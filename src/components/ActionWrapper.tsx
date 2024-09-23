import { Platform, StyleSheet, View } from 'react-native'
import Animated, { withSpring } from 'react-native-reanimated'
import React, { createElement, memo, ReactElement, Component, useState, cloneElement } from 'react'

import type { DEFAULT_SPRING_CONFIG } from '../helpers'

interface ChatbotActionWrapper<K extends string, T extends Record<string, unknown>> {
  testID?: string
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
          ) => ReactElement<
            unknown,
            string | (new (actionProps: unknown) => Component<unknown, unknown, unknown>)
          > | null)
        | (new (props: unknown) => Component<unknown>)
      >
    | undefined
}

const ActionWrapper = <K extends string, T extends Record<string, unknown>>({
  testID,
  children,
  onHeight,
  springConfig,
  componentProps,
}: ChatbotActionWrapper<K, T>): JSX.Element => {
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
      testID={testID}
      exiting={exiting}
      style={styles.container}
      needsOffscreenAlphaCompositing={Platform.OS === 'android'}
      onLayout={e => {
        const height = e.nativeEvent.layout.height
        onHeight?.(height) && setCompHeight(height)
      }}>
      {children ? cloneElement(children, componentProps) : createElement(View)}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    left: 0,
    right: 0,
    bottom: 0,
    position: 'absolute',
  },
})

const propsAreEqual = <K extends string, T extends Record<string, unknown>>(
  prevProps: ChatbotActionWrapper<K, T>,
  newProps: ChatbotActionWrapper<K, T>,
) => Object.is(prevProps.componentProps, newProps.componentProps)

export default memo(ActionWrapper, propsAreEqual) as typeof ActionWrapper
