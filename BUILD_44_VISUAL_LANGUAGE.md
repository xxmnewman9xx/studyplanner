# Build 44 Visual Language

## Doctrine
StudyPlanner should feel like Apple Fitness for school: white, black, glass, one clear state, one next move.

## Status Colors
- Green: On Track
- Yellow: Attention Needed
- Orange: Recovery Needed
- Red: Immediate Action
- Blue: Focus
- Purple: Exam Mode

Status colors communicate health or action. They are not decoration.

## Category Colors
Assignments, exams, classes, and notes no longer need loud identity colors. Build 44 shifts class glyphs to neutral graphite/smoke treatment so semantic health colors remain meaningful.

## Ring Psychology
The ring fill now maps directly to score through `HealthRing` progress. State label and driver carry emotional meaning:

Recovery Needed
65
2 overdue items

## Dashboard Hierarchy
1. Semester state
2. Primary driver
3. Next Move
4. Pressure Forecast
5. Class Pulse
6. Timeline
7. Supporting surfaces

## Implemented
- Neutral class glyphs.
- Task check states use due/status color instead of class color.
- Class Pulse nudge uses semantic pulse state.
- Widget task item color no longer uses class color as status.
