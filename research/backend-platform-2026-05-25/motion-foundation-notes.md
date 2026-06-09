# Motion Foundation Notes

Implemented:

- `src/motion.tsx` with shared durations, easing, press opacity tokens, reduced-motion hook, fade-up transition hook, and `MotionFadeUpView`.
- `OnboardingScreen` now uses the shared motion component instead of local duplicated `Animated.timing` setup.

Scope control:

- No new dependency.
- No screen redesign.
- No broad touchable migration.
- Native driver remains limited to opacity and transform.
- Reduced Motion accessibility setting disables the entrance animation.

Next safe uses:

- Scan review card entry.
- Widget Studio preview state changes.
- Focus timer state transition.

Those should be adopted incrementally only after screenshot QA.
