// Calm, haptics-free motion helpers. Every animation respects Reduce Motion.
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform } from "react-native";
import { MOTION } from "./tokens";

export const NATIVE_DRIVER = Platform.OS !== "web";

export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduce(Boolean(value));
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (value: boolean) => setReduce(Boolean(value)));
    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);
  return reduce;
}

/** Fade + small rise on mount. Returns an Animated style for the root view. */
export function useEntrance(delay = 0) {
  const reduce = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: MOTION.entrance,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, progress, reduce]);
  return {
    opacity: progress,
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [MOTION.entranceOffset, 0] }) }],
  };
}

/** One driver for a staggered grid reveal (cells interpolate their own window). */
export function useStagger(key: string | number) {
  const reduce = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: MOTION.stagger,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [key, progress, reduce]);
  return progress;
}

/** Animated 0..1 value that eases toward `value` (progress bars). */
export function useEasedValue(value: number, duration: number = MOTION.bar) {
  const reduce = useReduceMotion();
  const animated = useRef(new Animated.Value(reduce ? value : 0)).current;
  useEffect(() => {
    if (reduce) {
      animated.setValue(value);
      return;
    }
    const animation = Animated.timing(animated, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animated, duration, reduce, value]);
  return animated;
}
