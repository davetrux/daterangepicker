# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Angular v21 component library that provides a date range picker UI component. Converted from a jQuery UMD plugin; jQuery has been fully removed. Bootstrap is the UI library. dayjs handles all date logic.

## Commands

```bash
npm install                          # Install workspace dependencies
ng build ng-daterangepicker          # Build the library (production)
ng build ng-daterangepicker --watch  # Build in watch mode during development
ng serve demo                        # Serve the demo app at http://localhost:4200
ng build demo                        # Build the demo app
```

## Architecture

### Component tree

```
DateRangePickerComponent   (drp-date-range-picker)   — host, owns all state
  ├── DrpCalendar          (drp-calendar)             — one panel (used for left + right)
  │     ├── CalendarHeader (drp-calendar-header)      — month/year navigation + dropdowns
  │     ├── CalendarGrid   (drp-calendar-grid)        — 6×7 day table
  │     └── TimePicker     (drp-time-picker)          — hour/minute/second/am-pm selects
  ├── Ranges               (drp-ranges)               — predefined ranges list
  └── Buttons              (drp-buttons)              — Apply / Cancel buttons
```

All components are **standalone** (no NgModule). Bootstrap CSS handles all visual styling.

### Key files

| File | Purpose |
|---|---|
| `projects/ng-daterangepicker/src/lib/date-range-picker/date-range-picker.ts` | Host component — state, positioning, event orchestration |
| `projects/ng-daterangepicker/src/lib/date-picker.service.ts` | All pure date logic (no DOM) — calendar building, time picker options, clamping, range parsing |
| `projects/ng-daterangepicker/src/lib/models/date-range-picker.models.ts` | All TypeScript interfaces and types |
| `projects/ng-daterangepicker/src/lib/date-range-picker/date-range-picker.css` | All picker styles (migrated from original `daterangepicker.css`). `ViewEncapsulation.None` is intentional. |
| `projects/ng-daterangepicker/src/public-api.ts` | Public API surface |
| `projects/demo/src/app/app.ts` | Demo application |

### Positioning

The picker panel (`#pickerPanel`) is appended to `document.body` in `ngAfterViewInit` via `Renderer2` to escape `overflow: hidden` clipping from ancestor containers (replaces the original jQuery `appendTo('body')`). Coordinates are computed in `move()` using `getBoundingClientRect()` + `window.scrollX/scrollY` and applied via `[ngStyle]`. No CDK or Angular Material is used.

### dayjs

The library depends on dayjs with these plugins: `updateLocale`, `customParseFormat`, `isoWeek`, `localeData`, `localizedFormat`, `weekday`, `arraySupport`, `weekOfYear`, `advancedFormat`, `relativeTime`, `calendar`, `isSameOrBefore`, `isSameOrAfter`.

Plugins are loaded **once** in `DatePickerService` constructor via a static `initialized` guard — not per-instance. Do **not** reintroduce moment.js. The `DatePickerService` is `providedIn: 'root'`.

### CSS

`daterangepicker.component.css` is the complete stylesheet. `ViewEncapsulation.None` on `DateRangePickerComponent` emits it globally (same behaviour as the original `<link rel="stylesheet">`). Consumers of the library add it to their `angular.json` styles array or `styles.css`:

```css
@import 'ng-daterangepicker/daterangepicker.css';
```

### No SSR

The library accesses `document` and `window` directly. No `isPlatformBrowser` guards. SSR is not supported.

### Runtime dependencies (peer)

- `@angular/common` ^21.0.0
- `@angular/core` ^21.0.0
- `dayjs` ^1.11.20
- `bootstrap` ^5.3.8
- `bootstrap-icons` ^1.13.1

### No tests

No test suite is configured. Manual testing via `ng serve demo`.
