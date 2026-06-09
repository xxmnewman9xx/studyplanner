# Taste Audit

Based on `research/reference-repos/taste-skill/skills/taste-skill/SKILL.md` and `redesign-skill/SKILL.md`.

## Gate Checklist

- Real product loop is visible in seconds.
- No fake backend, parser, IAP, or widget claims.
- One dominant product surface per tab.
- Clear hierarchy before decorative density.
- Cards are used only when they organize work.
- Touch targets expose state and purpose.
- Motion is restrained and uses opacity/transform.
- Empty, loading, locked, and error states remain present.
- Widget setup explains what happens inside the app versus iOS.
- Legal, restore, and pricing surfaces stay visible on paywall.

## Findings Before This Pass

- Widget Studio had strong pieces but was competing with the generic More hub at the top of the Widgets tab.
- Today showed next action and quick capture, but the Scan -> Review -> Calendar -> Widget loop was not visible enough from the daily command center.
- Existing docs scored several categories below 10 and deferred native screenshot QA.
- Backend truth was mostly documented, but the UI needed more direct handoff copy for widgets and reviewed-only data.

## Fixes Applied

- Moved Widget Studio to first position in the Widgets tab.
- Added a four-step Widget Studio rail: Widget, Data, Style, Place.
- Added truthful Home Screen handoff copy that says iOS placement still happens in the system widget gallery.
- Added Today command tiles for Scan, Review, Calendar, and Widgets using live counts/actions.
- Kept improvements inside existing React Native/Expo stack without adding uninstalled design-system dependencies.

## Remaining Taste Risks

- The app still uses several dense glass cards because the existing system is glass-heavy; full anti-card simplification would be a larger visual-system refactor.
- Course visuals still use the repo’s existing emoji/course identity system.
- Final score depends on native screenshots after rebuild, not just static code review.
