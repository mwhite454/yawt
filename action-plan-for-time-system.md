---
# Action Plan: User-Defined Time System

As mentioned in [Issue #9](https://github.com/mwhite454/yawt/issues/9), this document outlines the action plan for implementing a user-defined time system for the yawt project.

### Objectives
- Develop a flexible, customizable time management system distinct from Earth-based calendars.
- Ensure compatibility with existing timelines and scene front matter.

### Suggested Data Structures

- **CustomCalendar**
  - Fields:
    - `name` (String): Name of the calendar.
    - `eraStart` (DateTime?): Optional start of the era.
    - `totals` including count of months, days in months, years.
    - `leap_year rules`

---
draft text -