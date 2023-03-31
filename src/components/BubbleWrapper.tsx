import LottieView from 'lottie-react-native'
import React, { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { Image, ImageSourcePropType, View, StyleSheet, LayoutChangeEvent, Dimensions } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated'

import type { ComponentExtraProps } from '../types'

import { DEFAULT_SPRING_CONFIG } from '../helpers'

interface ChatbotBubbleWrapperPropsType {
  testID?: string
  borderRadius?: number
  backgroundColor: string
  alignment?: 'left' | 'right'
  showTypingIndicator?: boolean
  avatarImageSource: ImageSourcePropType
  typingIndicatorAnimationTimeMs?: number
}

const { width: windowWidth } = Dimensions.get('window')

const BubbleWrapper = (props: PropsWithChildren<ChatbotBubbleWrapperPropsType> & ComponentExtraProps): JSX.Element => {
  const {
    testID,
    children,
    borderRadius,
    isLastInGroup,
    isFirstInGroup,
    backgroundColor,
    isLatestSetEntry,
    avatarImageSource,
    alignment = 'left',
    isInMiddleOfTheGroup,
    showTypingIndicator = false,
    typingIndicatorAnimationTimeMs = 500,
  } = props
  const lottieRef = useRef<LottieView>(null)

  const [size, setSize] = useState({ width: 0, height: 0 })

  const animateBubbleIntro = useSharedValue(isLatestSetEntry ? 0 : 1)
  const animateBubble = useSharedValue(!showTypingIndicator && !isLatestSetEntry ? 1 : 0)
  const bubbleSize = useSharedValue<{ width: number; height: number }>({ width: 0, height: 0 })
  const avatarScale = useSharedValue(alignment === 'left' && isFirstInGroup && isLatestSetEntry ? 0 : 1)

  useEffect(() => {
    if (size.width > 0 && size.height > 0) {
      if (alignment === 'left' && isFirstInGroup && isLatestSetEntry) {
        avatarScale.value = 1
      }

      if (showTypingIndicator && lottieRef.current && isLatestSetEntry && alignment === 'left') {
        lottieRef.current.play()
        animateBubbleIntro.value = 1
        setTimeout(() => {
          if (lottieRef.current) {
            lottieRef.current.pause()
            animateBubble.value = 1
          }
        }, typingIndicatorAnimationTimeMs)
      } else if (!showTypingIndicator && isLatestSetEntry && alignment === 'right') {
        animateBubbleIntro.value = 1
        animateBubble.value = 1
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size])

  const onBubbleContentLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout

    if (size.width === 0 && size.height === 0) {
      setSize({ width: width + 30, height: height + 30 })
    }

    if (bubbleSize.value.width === 0 || bubbleSize.value.height === 0) {
      bubbleSize.value = { width: width + 30, height: height + 30 }
    }
  }

  const bubbleStyles = { backgroundColor }

  const animatedBorderStyles = () => {
    const br = borderRadius || 15

    if (alignment === 'right') {
      return {
        borderRadius: br,
        borderBottomRightRadius: isFirstInGroup ? 0 : isInMiddleOfTheGroup ? 0 : br,
        borderTopRightRadius: isLastInGroup
          ? isLastInGroup && isFirstInGroup
            ? br
            : 0
          : isInMiddleOfTheGroup
          ? 0
          : br,
      }
    }
    return {
      borderRadius: br,
      borderTopRightRadius: br,
      borderBottomLeftRadius: isFirstInGroup ? 0 : isInMiddleOfTheGroup ? 0 : br,
      borderTopLeftRadius: isLastInGroup ? (isLastInGroup && isFirstInGroup ? br : 0) : isInMiddleOfTheGroup ? 0 : br,
    }
  }

  const borderStyles = animatedBorderStyles()

  const animatedContainerStyles = {
    justifyContent: alignment === 'right' ? 'flex-end' : 'flex-start',
  } as const

  const animatedTextBubbleStyles = useAnimatedStyle(() => {
    return {
      opacity: isLatestSetEntry ? withDelay(250, withSpring(animateBubble.value, DEFAULT_SPRING_CONFIG)) : 1,
    }
  }, [isLatestSetEntry])

  const animatedLottieStyles = useAnimatedStyle(() => {
    return {
      opacity: isLatestSetEntry ? withSpring(Number(!animateBubble.value), DEFAULT_SPRING_CONFIG) : 0,
    }
  }, [isLatestSetEntry])

  const animatedTextWrapperStyles = useAnimatedStyle(() => {
    return {
      width: isLatestSetEntry
        ? withSpring(
            animateBubble.value
              ? bubbleSize.value.width
              : animateBubbleIntro.value
              ? alignment === 'left'
                ? 80
                : bubbleSize.value.width
              : 0,
            DEFAULT_SPRING_CONFIG,
          )
        : size.width,
      height: isLatestSetEntry
        ? withSpring(
            animateBubble.value
              ? bubbleSize.value.height
              : animateBubbleIntro.value
              ? alignment === 'left'
                ? 35
                : bubbleSize.value.height
              : 0,
            DEFAULT_SPRING_CONFIG,
          )
        : size.height,
      // TODO: Only do this on Android (HS2-274/7)
      // transform: [
      //   {
      //     scale: isLatestSetEntry ? withSpring(animateBubble.value || animateBubbleIntro.value, DEFAULT_SPRING_CONFIG) : 1,
      //   },
      // ],
    }
  }, [isLatestSetEntry])

  const animatedSpacerStyles = useAnimatedStyle(() => {
    const height = isFirstInGroup ? 24 : 2
    return {
      height: withSpring(animateBubble.value || animateBubbleIntro.value ? height : 0, DEFAULT_SPRING_CONFIG),
    }
  })

  const avatarAnimatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(avatarScale.value, DEFAULT_SPRING_CONFIG),
        },
      ],
    }
  })

  // FlatList is dumb. When we add a new entry, we add the item in front of the array (e.g. [item, ...restOfHistory])
  // This causes the FlatList items to re-mount, but like sometimes (?) and they want to go through the whole animation again
  // So instead, we just render it  without any of the fancy layout stuff to not do the animation.
  // Apparently I've already had this issue in 2019 - https://github.com/facebook/react-native/issues/23376
  if (!isLatestSetEntry) {
    return (
      <>
        <Animated.View style={animatedSpacerStyles} />
        <Animated.View style={[styles.row, animatedContainerStyles]}>
          {alignment === 'left' && (
            <Animated.View style={[avatarAnimatedStyles, styles.avatar, { opacity: isLastInGroup ? 1 : 0 }]} />
          )}
          <Animated.View style={[borderStyles, bubbleStyles, styles.extraBubbleStyles]}>
            <Animated.View style={styles.staticContainer}>
              <View style={styles.childRow} onLayout={onBubbleContentLayout}>
                {children}
              </View>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </>
    )
  }

  // And here we render the animated version.

  return (
    <>
      <Animated.View style={animatedSpacerStyles} />
      <Animated.View testID={testID} style={[styles.row, animatedContainerStyles]}>
        {alignment === 'left' && (
          <Animated.View style={[avatarAnimatedStyles, styles.avatar, { opacity: isLastInGroup ? 1 : 0 }]}>
            <Image source={avatarImageSource} style={styles.avatarImage} />
          </Animated.View>
        )}
        <Animated.View style={[borderStyles, bubbleStyles, animatedTextWrapperStyles, styles.extraBubbleStyles]}>
          {alignment === 'left' && (
            <Animated.View style={[styles.lottieContainer, animatedLottieStyles]} pointerEvents="none">
              <LottieView
                ref={lottieRef}
                loop
                speed={-0.85}
                style={styles.lottieView}
                source={require('../helpers/lottie-typing-indicator.json')}
              />
            </Animated.View>
          )}
          <Animated.View
            style={[
              styles.container,
              { width: alignment === 'left' ? windowWidth - 32 - 60 : windowWidth - 32 },
              animatedTextBubbleStyles,
            ]}>
            <View style={styles.childRow} onLayout={onBubbleContentLayout}>
              {children}
            </View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </>
  )
}

const styles = StyleSheet.create({
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
  },
  avatar: {
    left: 16,
    bottom: 0,
    width: 44,
    height: 44,
    marginRight: 12,
    borderRadius: 22,
    position: 'absolute',
    backgroundColor: 'white',
  },
  childRow: {
    alignSelf: 'flex-start',
  },
  extraBubbleStyles: {
    elevation: 3,
    shadowRadius: 5,
    overflow: 'hidden',
    marginLeft: 48 + 12,
    shadowOpacity: 0.07,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
  },
  lottieContainer: {
    top: 0,
    left: 0,
    width: 80,
    height: 35,
    position: 'absolute',
    transform: [{ scaleX: -1 }],
  },
  lottieView: {
    width: 120,
    height: 60,
    transform: [{ translateY: -7 }, { translateX: -9 }],
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  staticContainer: {
    margin: 0,
    minHeight: 44,
    paddingVertical: 15,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  container: {
    top: 0,
    left: 0,
    margin: 0,
    minHeight: 44,
    paddingVertical: 15,
    position: 'absolute',
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
})

export default BubbleWrapper
