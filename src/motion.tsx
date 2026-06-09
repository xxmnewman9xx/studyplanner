import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleProp, ViewStyle } from "react-native";

export const motionDurations = {
  instant: 0,
  fast: 160,
  enter: 240,
  settle: 320
};

export const motionEasing = {
  standard: Easing.out(Easing.cubic)
};

export const pressOpacity = {
  enabled: 0.72,
  disabled: 1
};

type FadeUpOptions = {
  distance?: number;
  duration?: number;
};

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}

export function useFadeUpTransition(trigger: unknown, options: FadeUpOptions = {}) {
  const reducedMotion = useReducedMotion();
  const transition = useRef(new Animated.Value(1)).current;
  const distance = options.distance ?? 12;
  const duration = options.duration ?? motionDurations.enter;

  useEffect(() => {
    if (reducedMotion) {
      transition.setValue(1);
      return;
    }

    transition.setValue(0);
    Animated.timing(transition, {
      toValue: 1,
      duration,
      easing: motionEasing.standard,
      useNativeDriver: true
    }).start();
  }, [duration, reducedMotion, transition, trigger]);

  return useMemo(
    () => ({
      opacity: transition,
      transform: [
        {
          translateY: transition.interpolate({
            inputRange: [0, 1],
            outputRange: [distance, 0]
          })
        }
      ]
    }),
    [distance, transition]
  );
}

export function MotionFadeUpView({
  children,
  trigger,
  style
}: {
  children: ReactNode;
  trigger: unknown;
  style?: StyleProp<ViewStyle>;
}) {
  const motionStyle = useFadeUpTransition(trigger);
  return <Animated.View style={[style, motionStyle]}>{children}</Animated.View>;
}
