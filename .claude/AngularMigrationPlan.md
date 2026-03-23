# Angular v21 Component Library: daterangepicker Conversion Plan

## Overview

This document is the ordered implementation plan for converting the jQuery UMD daterangepicker plugin into a publishable Angular v21 component library. It covers workspace setup, architecture decisions, TypeScript interface design, component decomposition, jQuery-to-Angular pattern mapping, CSS handling, and documentation updates.

---

## jQuery-to-Angular Pattern Reference

| jQuery Pattern | Angular Equivalent |
|---|---|
| `$(el).on('click', handler)` | `(click)="handler($event)"` in template |
| `$.proxy(fn, this)` | Arrow function class method or bound class method |
| `$.extend({}, a, b)` | `{ ...a, ...b }` object spread |
| `$.each(arr, fn)` | `arr.forEach(fn)` or `*ngFor` in template |
| `$(el).addClass('foo')` | `[class.foo]="condition"` or `[ngClass]="classMap"` |
| `$(el).removeClass('foo')` | Same as above — toggle the boolean |
| `$(el).toggleClass('foo', bool)` | `[class.foo]="bool"` |
| `$(el).html(str)` | Component template with `*ngFor` / `[innerHTML]` (avoid innerHTML — prefer template) |
| `$(el).find('.x').val()` | Template reference variable + two-way `[(ngModel)]` or reactive form control |
| `$(el).prop('disabled', bool)` | `[disabled]="bool"` on the element |
| `$(el).show()` / `.hide()` | `*ngIf` or `[hidden]="bool"` |
| `$(el).css({top, left})` | `[style.top.px]="val"` or `[ngStyle]="styleObj"` |
| `$(document).on('mousedown', proxy)` | `@HostListener('document:mousedown', ['$event'])` or `fromEvent` RxJS |
| `$(window).on('resize', proxy)` | `@HostListener('window:resize', ['$event'])` |
| `element.trigger('apply.daterangepicker', this)` | `@Output() apply = new EventEmitter<DateRange>()` |
| `this.container.appendTo(parentEl)` | Component renders in DOM via selector; picker panel uses `position: fixed` with coordinates computed from `ElementRef.nativeElement.getBoundingClientRect()` |
| `data-title="r0c3"` attribute lookup | Store calendar rows as `CalendarCell[][]` array; pass row/col as method arguments via `(mousedown)="onDateClick(row, col, side)"` |

---

## Phase 1: Workspace Preparation

### Step 1.1 — Remove legacy artifacts

**What to do:**
Delete files that have no place in the Angular library:
- `bower.json` — Bower is dead; Angular uses npm exclusively
- `moment.min.js` — documented as unused legacy artifact
- `example/` directory — per requirements, ignored and not ported
- `website/` directory — per requirements, ignored and not ported
- `demo.html` — will be replaced by a demo Angular app in the workspace
- `daterangepicker.js` — the source being replaced; keep until Phase 4 is complete as reference
- `daterangepicker.css` — will be migrated to `projects/ng-daterangepicker/src/lib/daterangepicker.component.css`
- `package.js` — a legacy Meteor packaging file, not relevant
- `package-lock.json` — will be regenerated

**Files to delete:**
`bower.json`, `moment.min.js`, `demo.html`, `package.js`
**Key notes:**
- Do not delete `package.json` — it will be heavily modified.
- Keep `daterangepicker.js` as a read reference until Phase 4 is complete, then delete it.
- Keep `daterangepicker.css` as a read reference until Phase 3 is complete, then delete it.
- Keep `CLAUDE.md` — it will be rewritten in Phase 6.
- Keep `example/` (whole directory)
- Keep `website/` (whole directory)

---

### Step 1.2 — Initialize the Angular workspace

**What to do:**
Run the Angular CLI to create a new workspace without an initial application, then generate the library project.

```
ng new daterangepicker-workspace --no-create-application --skip-git
```

Then inside the workspace:
```
ng generate library ng-daterangepicker --prefix=drp
```

This scaffolds:
- `projects/ng-daterangepicker/src/lib/` — library source
- `projects/ng-daterangepicker/src/public-api.ts` — public exports
- `projects/ng-daterangepicker/ng-package.json` — ng-packagr config
- `projects/ng-daterangepicker/package.json` — library package metadata
- `angular.json` — workspace config
- Root `package.json` — workspace-level npm config
- `tsconfig.json`, `tsconfig.lib.json`, `tsconfig.spec.json`

**Key notes:**
- The library prefix `drp` gives selectors like `<drp-daterangepicker>`.
- The workspace itself lives at the repo root; all existing files will coexist until deleted in Step 1.1.
- Angular v21 requires Node 20+ — verify before running.

---

### Step 1.3 — Generate a demo application

**What to do:**
```
ng generate application demo --routing=false --style=css
```

This produces `projects/demo/` which replaces `demo.html`. It is not part of the published library but provides a manual test harness.

**Files created:**
- `projects/demo/src/app/app.component.ts`
- `projects/demo/src/app/app.component.html`
- `projects/demo/src/index.html`

---

### Step 1.4 — Update root package.json dependencies

**What to do:**
Modify the workspace-level `package.json` to include runtime peer dependencies and remove jQuery. The library's `projects/ng-daterangepicker/package.json` will declare `peerDependencies`.

Root `package.json` devDependencies additions:
```json
"dayjs": "^1.11.20",
"bootstrap": "^5.3.8",
"bootstrap-icons": "^1.13.1"
```

Remove from dependencies:
```json
"jquery": ">=1.10"   ← DELETE THIS
```

Library `projects/ng-daterangepicker/package.json` peerDependencies:
```json
{
  "peerDependencies": {
    "@angular/common": "^21.0.0",
    "@angular/core": "^21.0.0",
    "dayjs": "^1.11.20",
    "bootstrap": "^5.3.8",
    "bootstrap-icons": "^1.13.1"
  }
}
```

**Key notes:**
- No `@angular/cdk` dependency. Positioning is handled natively — see Phase 3, Step 3.5.
- jQuery must not appear anywhere in the library's dependency tree.
- The demo app imports Bootstrap and bootstrap-icons in `angular.json` under `projects.demo.architect.build.options.styles`.

---

## Phase 2: TypeScript Interfaces and Types

All interfaces live in `projects/ng-daterangepicker/src/lib/models/`.

### Step 2.1 — Create `date-range-picker.models.ts`

**What to do:**
Define all public-facing types. These map directly from the existing `this.*` state properties.

```typescript
// projects/ng-daterangepicker/src/lib/models/date-range-picker.models.ts

import { Dayjs } from 'dayjs';

export interface DateRange {
  startDate: Dayjs;
  endDate: Dayjs;
  label?: string;
}

export interface DateRangeLocale {
  direction: 'ltr' | 'rtl';
  format: string;
  separator: string;
  applyLabel: string;
  cancelLabel: string;
  weekLabel: string;
  customRangeLabel: string;
  daysOfWeek: string[];
  monthNames: string[];
  firstDay: number;
}

export interface DateRangePickerConfig {
  startDate?: Dayjs | string;
  endDate?: Dayjs | string;
  minDate?: Dayjs | string | false;
  maxDate?: Dayjs | string | false;
  maxSpan?: Record<string, number> | false;
  autoApply?: boolean;
  singleDatePicker?: boolean;
  showDropdowns?: boolean;
  minYear?: number;
  maxYear?: number;
  showWeekNumbers?: boolean;
  showISOWeekNumbers?: boolean;
  showCustomRangeLabel?: boolean;
  timePicker?: boolean;
  timePicker24Hour?: boolean;
  timePickerIncrement?: number;
  timePickerSeconds?: boolean;
  linkedCalendars?: boolean;
  autoUpdateInput?: boolean;
  alwaysShowCalendars?: boolean;
  ranges?: Record<string, [Dayjs | string, Dayjs | string]>;
  opens?: 'left' | 'right' | 'center';
  drops?: 'up' | 'down' | 'auto';
  buttonClasses?: string | string[];
  applyButtonClasses?: string;
  cancelButtonClasses?: string;
  locale?: Partial<DateRangeLocale>;
  isInvalidDate?: (date: Dayjs) => boolean;
  isCustomDate?: (date: Dayjs) => string | string[] | false;
}

export type CalendarSide = 'left' | 'right';

export interface CalendarCell {
  date: Dayjs;
  classes: string[];
  isAvailable: boolean;
  dayNumber: number;
  row: number;
  col: number;
}

export interface CalendarMonth {
  month: Dayjs;
  rows: CalendarCell[][];
  firstDay: Dayjs;
  lastDay: Dayjs;
}

export interface TimePickerState {
  hours: TimeOption[];
  minutes: TimeOption[];
  seconds: TimeOption[];
  ampm: 'AM' | 'PM';
  selectedHour: number;
  selectedMinute: number;
  selectedSecond: number;
}

export interface TimeOption {
  value: number | string;
  label: string;
  disabled: boolean;
}

export interface RangeItem {
  key: string;
  label: string;
  start: Dayjs;
  end: Dayjs;
}
```

**Key notes:**
- `CalendarCell` replaces the `data-title="r0c3"` pattern. Row and column are stored as properties so the template can pass them directly to click handlers: `(mousedown)="onDateClick(cell)"`.
- `CalendarMonth` is the data structure produced by the logic that was `renderCalendar()`. In Angular this method becomes a pure computation function returning this structure; the template iterates it.
- `TimePickerState` replaces the HTML-string-building `renderTimePicker()` method with a data structure that drives `<select>` elements via `*ngFor`.

---

### Step 2.2 — Create `date-picker.service.ts`

**What to do:**
Extract all pure date-computation logic into an injectable service. This service has no DOM knowledge.

```
projects/ng-daterangepicker/src/lib/date-picker.service.ts
```

Methods migrated from `DateRangePicker.prototype`:
- `buildCalendar(month: Dayjs, config: DateRangePickerConfig, startDate: Dayjs, endDate: Dayjs | null, side: CalendarSide): CalendarMonth` — replaces `renderCalendar()` minus the HTML generation
- `buildTimePicker(selected: Dayjs, minDate: Dayjs | false, maxDate: Dayjs | false, config: DateRangePickerConfig): TimePickerState` — replaces `renderTimePicker()` minus the HTML generation
- `clampStartDate(date: Dayjs, config: DateRangePickerConfig): Dayjs` — extracted from `setStartDate()`
- `clampEndDate(date: Dayjs, startDate: Dayjs, config: DateRangePickerConfig): Dayjs` — extracted from `setEndDate()`
- `buildRanges(rawRanges: Record<string, [Dayjs|string, Dayjs|string]>, config: DateRangePickerConfig): RangeItem[]`
- `initDayjs(): void` — loads all dayjs plugins exactly once (use `APP_INITIALIZER` or call in the service constructor with a guard)
- `calculateChosenLabel(startDate: Dayjs, endDate: Dayjs, ranges: RangeItem[], config: DateRangePickerConfig): string | null`

**Key notes:**
- The service is `providedIn: 'root'` so dayjs plugins are loaded once per application, not once per picker instance (fixing the original code's per-instantiation plugin loading).
- All methods are pure functions given their inputs; this makes them easily unit-testable without DOM.
- `buildCalendar()` returns `CalendarMonth` with `rows: CalendarCell[][]` — a 6x7 grid. Each `CalendarCell` carries all the CSS classes as a pre-computed array of strings: `['today', 'in-range', 'available']`. The template uses `[ngClass]` with an object built from this array.

---

## Phase 3: Component Architecture

The picker is decomposed into these components:

```
DateRangePickerComponent        (host/orchestrator)
  ├── DrpCalendarComponent      (one calendar panel, used twice)
  │     ├── DrpCalendarHeaderComponent   (month/year nav + dropdowns)
  │     └── DrpCalendarGridComponent     (the 6x7 table of days)
  ├── DrpTimePickerComponent    (hour/minute/second/ampm selects)
  ├── DrpRangesComponent        (the predefined ranges list)
  └── DrpButtonsComponent       (apply/cancel/selected display)
```

### Step 3.1 — Generate all components

```
ng generate component date-range-picker --project=ng-daterangepicker --standalone
ng generate component calendar --project=ng-daterangepicker --standalone
ng generate component calendar-header --project=ng-daterangepicker --standalone
ng generate component calendar-grid --project=ng-daterangepicker --standalone
ng generate component time-picker --project=ng-daterangepicker --standalone
ng generate component ranges --project=ng-daterangepicker --standalone
ng generate component buttons --project=ng-daterangepicker --standalone
```

Use standalone components (Angular v14+ default, v21 standard). No NgModule required.

**Files created under** `projects/ng-daterangepicker/src/lib/`:
- `date-range-picker/date-range-picker.component.ts` + `.html` + `.css`
- `calendar/calendar.component.ts` + `.html` + `.css`
- `calendar-header/calendar-header.component.ts` + `.html` + `.css`
- `calendar-grid/calendar-grid.component.ts` + `.html` + `.css`
- `time-picker/time-picker.component.ts` + `.html` + `.css`
- `ranges/ranges.component.ts` + `.html` + `.css`
- `buttons/buttons.component.ts` + `.html` + `.css`

---

### Step 3.2 — Design the host component: `DateRangePickerComponent`

This is the main `<drp-daterangepicker>` element. It orchestrates all state.

**Inputs (`@Input`):**

```typescript
@Input() startDate?: Dayjs | string;
@Input() endDate?: Dayjs | string;
@Input() minDate?: Dayjs | string | false;
@Input() maxDate?: Dayjs | string | false;
@Input() maxSpan?: Record<string, number> | false;
@Input() singleDatePicker = false;
@Input() autoApply = false;
@Input() showDropdowns = false;
@Input() minYear?: number;
@Input() maxYear?: number;
@Input() showWeekNumbers = false;
@Input() showISOWeekNumbers = false;
@Input() showCustomRangeLabel = true;
@Input() timePicker = false;
@Input() timePicker24Hour = false;
@Input() timePickerIncrement = 1;
@Input() timePickerSeconds = false;
@Input() linkedCalendars = true;
@Input() autoUpdateInput = true;
@Input() alwaysShowCalendars = false;
@Input() ranges?: Record<string, [Dayjs|string, Dayjs|string]>;
@Input() opens: 'left' | 'right' | 'center' = 'right';
@Input() drops: 'up' | 'down' | 'auto' = 'down';
@Input() buttonClasses = 'btn btn-sm';
@Input() applyButtonClasses = 'btn-primary';
@Input() cancelButtonClasses = 'btn-default';
@Input() locale?: Partial<DateRangeLocale>;
@Input() isInvalidDate?: (date: Dayjs) => boolean;
@Input() isCustomDate?: (date: Dayjs) => string | string[] | false;
```

**Outputs (`@Output`):**

```typescript
@Output() rangeSelected = new EventEmitter<DateRange>();
@Output() apply = new EventEmitter<DateRange>();
@Output() cancel = new EventEmitter<void>();
@Output() show = new EventEmitter<void>();
@Output() hide = new EventEmitter<void>();
@Output() showCalendar = new EventEmitter<void>();
@Output() hideCalendar = new EventEmitter<void>();
```

**Internal state (component properties):**

```typescript
protected isShowing = false;
protected showCalendars = false;
protected internalStartDate!: Dayjs;
protected internalEndDate!: Dayjs | null;
protected oldStartDate!: Dayjs;
protected oldEndDate!: Dayjs | null;
protected leftCalendarMonth!: CalendarMonth;
protected rightCalendarMonth!: CalendarMonth;
protected leftTimePicker!: TimePickerState;
protected rightTimePicker!: TimePickerState;
protected builtRanges: RangeItem[] = [];
protected chosenLabel: string | null = null;
protected hoverDate: Dayjs | null = null;
protected overlayStyle: { top: string; left?: string; right?: string } = { top: '0' };
protected isApplyDisabled = true;
```

**Key notes:**
- The component template uses `[class]` bindings on the root `div.daterangepicker`:
  ```html
  <div class="daterangepicker"
       [class.single]="singleDatePicker"
       [class.show-ranges]="builtRanges.length > 0"
       [class.show-calendar]="showCalendarsVisible"
       [class.auto-apply]="autoApply"
       [class.opensright]="opens === 'right'"
       [class.opensleft]="opens === 'left'"
       [class.openscenter]="opens === 'center'"
       [class.drop-up]="resolvedDrops === 'up'"
       [class.ltr]="resolvedLocale.direction === 'ltr'"
       [class.rtl]="resolvedLocale.direction === 'rtl'"
       [hidden]="!isShowing">
  ```
- `[hidden]` replaces `.show()` / `.hide()`. Do not use `*ngIf` for show/hide — `*ngIf` destroys and recreates the DOM, resetting scroll and animation state.
- The `ngOnChanges` lifecycle hook replaces the constructor's option-parsing block.
- `ngOnInit` performs the initial `updateView()` equivalent.

---

### Step 3.3 — Design `DrpCalendarComponent`

Wraps one calendar panel (left or right).

**Inputs:**
```typescript
@Input({ required: true }) side!: CalendarSide;
@Input({ required: true }) calendar!: CalendarMonth;
@Input() timePicker = false;
@Input() timePickerState?: TimePickerState;
@Input() showDropdowns = false;
@Input() showWeekNumbers = false;
@Input() showISOWeekNumbers = false;
@Input() linkedCalendars = false;
@Input() locale!: DateRangeLocale;
@Input() minDate?: Dayjs | false;
@Input() maxDate?: Dayjs | false;
```

**Outputs:**
```typescript
@Output() prevClicked = new EventEmitter<CalendarSide>();
@Output() nextClicked = new EventEmitter<CalendarSide>();
@Output() monthYearChanged = new EventEmitter<{ side: CalendarSide; month: number; year: number }>();
@Output() dateClicked = new EventEmitter<{ cell: CalendarCell; side: CalendarSide }>();
@Output() dateHovered = new EventEmitter<{ cell: CalendarCell; side: CalendarSide }>();
@Output() timeChanged = new EventEmitter<{ side: CalendarSide; state: TimePickerState }>();
```

**Key notes:**
- Replaces `$.proxy(this.clickPrev, this)` with `(prevClicked)="onPrevClicked($event)"` in the host template.
- Each panel emits its side identity directly in the event payload, eliminating the jQuery pattern of `$(e.target).parents('.drp-calendar').hasClass('left')`.

---

### Step 3.4 — Design `DrpCalendarGridComponent`

Renders the 6x7 table of days. This is where the most complex jQuery-to-Angular translation lives.

**Template approach:**

```html
<table class="table-condensed">
  <thead>
    <!-- header row rendered by DrpCalendarHeaderComponent -->
  </thead>
  <tbody>
    <tr *ngFor="let row of calendar.rows; let r = index">
      <td *ngIf="showWeekNumbers" class="week">{{ row[0].date.week() }}</td>
      <td *ngIf="showISOWeekNumbers" class="week">{{ row[0].date.isoWeek() }}</td>
      <td *ngFor="let cell of row; let c = index"
          [ngClass]="getCellClasses(cell)"
          [attr.data-title]="'r' + r + 'c' + c"
          (mousedown)="onCellMousedown(cell, $event)"
          (mouseenter)="onCellMouseenter(cell)">
        {{ cell.dayNumber }}
      </td>
    </tr>
  </tbody>
</table>
```

**`getCellClasses(cell: CalendarCell)` method:**
Returns an object like `{ 'today': cell.classes.includes('today'), 'in-range': cell.classes.includes('in-range'), ... }` for use with `[ngClass]`. Pass `hoverDate` as an input to compute hover-in-range state dynamically.

**Key notes:**
- The original `hoverDate()` iterates all `td` elements and adds/removes `in-range` imperatively. In Angular: store `hoverDate` in the host component state; pass it to `DrpCalendarGridComponent` as `@Input() hoverDate: Dayjs | null`. Angular's change detection re-evaluates `[ngClass]` bindings automatically.
- `data-title` attribute is kept for accessibility/testing but no longer used to look up calendar data at click time.

---

### Step 3.5 — Positioning: replacing `move()` and `appendTo(body)`

**This is the trickiest area in the entire conversion.** The original `move()` reads raw pixel offsets and writes inline CSS. The picker is appended to `body` to escape parent overflow clipping. No CDK or Material libraries are used — positioning is implemented using native DOM APIs and Angular's `Renderer2`.

**Approach: `position: fixed` with `getBoundingClientRect()`**

The picker panel lives inside the host component's template but is positioned fixed relative to the viewport, matching the original behavior of appending to `body`. `Renderer2` is used to move the panel element to `document.body` on `ngAfterViewInit` to escape `overflow: hidden` clipping from ancestor containers.

**Implementation in `DateRangePickerComponent`:**

```typescript
@ViewChild('pickerPanel') pickerPanel!: ElementRef<HTMLDivElement>;
@ViewChild('triggerEl') triggerEl!: ElementRef<HTMLElement>;

private positionStyles: { [key: string]: string } = {};

constructor(
  private renderer: Renderer2,
  private el: ElementRef
) {}

ngAfterViewInit(): void {
  // Move the picker panel to document.body to escape overflow clipping,
  // matching the original appendTo(body) behavior
  this.renderer.appendChild(document.body, this.pickerPanel.nativeElement);
}

ngOnDestroy(): void {
  // Clean up — remove from body when component is destroyed
  if (this.pickerPanel?.nativeElement?.parentNode) {
    this.renderer.removeChild(document.body, this.pickerPanel.nativeElement);
  }
}

private move(): void {
  // Direct port of the original jQuery move() logic using native DOM APIs
  const trigger = this.triggerEl.nativeElement;
  const panel = this.pickerPanel.nativeElement;
  const rect = trigger.getBoundingClientRect();
  const panelWidth = panel.offsetWidth;
  const triggerHeight = trigger.offsetHeight;
  const viewportWidth = window.innerWidth;

  // Vertical positioning (drops up or down)
  let top: number;
  if (this.drops === 'up') {
    top = rect.top + window.scrollY - panel.offsetHeight;
  } else {
    top = rect.bottom + window.scrollY;
  }

  // Horizontal positioning (opens left, right, or center)
  let left: number;
  if (this.opens === 'left') {
    left = rect.right + window.scrollX - panelWidth;
    if (left < 0) left = rect.left + window.scrollX;
  } else if (this.opens === 'center') {
    left = rect.left + window.scrollX - (panelWidth / 2) + (rect.width / 2);
  } else { // right
    left = rect.left + window.scrollX;
    if (left + panelWidth > viewportWidth) left = rect.right + window.scrollX - panelWidth;
  }

  this.positionStyles = {
    top: `${top}px`,
    left: `${Math.max(0, left)}px`,
    right: 'auto'
  };
}
```

Apply position styles in the template:

```html
<div #pickerPanel class="daterangepicker" [ngStyle]="positionStyles" [hidden]="!isShowing">
  ...
</div>
```

Call `this.move()` inside `showPicker()` after `isShowing = true`, and again in the window resize handler.

**Key notes:**
- `getBoundingClientRect()` returns viewport-relative coordinates — equivalent to jQuery's `.offset()` adjusted for scroll. Add `window.scrollY`/`window.scrollX` to get document-relative coordinates matching the original.
- `element.offsetHeight` replaces jQuery's `.outerHeight()`.
- `window.innerWidth` replaces `$(window).width()`.
- No third-party positioning library is needed — this is a direct translation of the original `move()` method.

---

### Step 3.6 — Click-outside detection: replacing `outsideClick()`

```typescript
@HostListener('document:mousedown', ['$event'])
onDocumentMousedown(event: MouseEvent): void {
  if (!this.isShowing) return;
  const target = event.target as HTMLElement;
  const pickerEl = this.pickerContainerRef.nativeElement;
  const triggerEl = this.triggerElementRef?.nativeElement;
  if (pickerEl.contains(target) || triggerEl?.contains(target)) return;
  this.hidePicker();
}
```

`@HostListener('document:mousedown')` is always registered but short-circuits when `!isShowing`, eliminating the dynamic bind/unbind pattern and its associated memory leak risk.

```typescript
@HostListener('window:resize')
onWindowResize(): void {
  if (this.isShowing) this.repositionOverlay();
}
```

---

### Step 3.7 — Keyboard handling: replacing `keydown()`

```typescript
@HostListener('keydown', ['$event'])
onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Tab' || event.key === 'Enter') this.hidePicker();
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.hidePicker(); }
}
```

---

### Step 3.8 — Design `DrpTimePickerComponent`

**Inputs:**
```typescript
@Input({ required: true }) side!: CalendarSide;
@Input({ required: true }) state!: TimePickerState;
@Input() disabled = false;
@Input() timePicker24Hour = false;
@Input() timePickerSeconds = false;
```

**Output:**
```typescript
@Output() timeChanged = new EventEmitter<{ side: CalendarSide; hour: number; minute: number; second: number; ampm: 'AM' | 'PM' }>();
```

**Template:**
```html
<select class="hourselect" [disabled]="disabled" [(ngModel)]="selectedHour" (change)="emitChange()">
  <option *ngFor="let opt of state.hours" [value]="opt.value" [disabled]="opt.disabled">{{ opt.label }}</option>
</select>
: <select class="minuteselect" ...>...</select>
<select *ngIf="timePickerSeconds" class="secondselect" ...>...</select>
<select *ngIf="!timePicker24Hour" class="ampmselect" ...>...</select>
```

**Key notes:**
- `[(ngModel)]` reads current values without any `$(el).find('.hourselect').val()` DOM queries.
- Current time values live in component-bound data, always available without DOM queries.

---

### Step 3.9 — Design `DrpRangesComponent`

**Inputs:**
```typescript
@Input({ required: true }) ranges!: RangeItem[];
@Input() showCustomRangeLabel = true;
@Input() customRangeLabel = 'Custom Range';
@Input() chosenLabel: string | null = null;
```

**Output:**
```typescript
@Output() rangeClicked = new EventEmitter<RangeItem | null>(); // null = custom range
```

**Template:**
```html
<ul>
  <li *ngFor="let range of ranges"
      [class.active]="range.key === chosenLabel"
      (click)="onRangeClick(range)">{{ range.label }}</li>
  <li *ngIf="showCustomRangeLabel"
      [class.active]="chosenLabel === customRangeLabel"
      (click)="onRangeClick(null)">{{ customRangeLabel }}</li>
</ul>
```

**Key notes:**
- Replaces all `this.container.find('.ranges li').removeClass('active')` and `addClass('active')` patterns with pure data-driven binding.
- The `data-range-key` attribute is no longer needed: the click handler receives the `RangeItem` object directly.

---

### Step 3.10 — Design `DrpButtonsComponent`

**Inputs:**
```typescript
@Input() selectedText = '';
@Input() applyDisabled = true;
@Input() applyLabel = 'Apply';
@Input() cancelLabel = 'Cancel';
@Input() buttonClasses = 'btn btn-sm';
@Input() applyButtonClasses = 'btn-primary';
@Input() cancelButtonClasses = 'btn-default';
```

**Outputs:**
```typescript
@Output() applyClicked = new EventEmitter<void>();
@Output() cancelClicked = new EventEmitter<void>();
```

**Template:**
```html
<div class="drp-buttons">
  <span class="drp-selected">{{ selectedText }}</span>
  <button [class]="buttonClasses + ' ' + cancelButtonClasses" type="button" (click)="cancelClicked.emit()">{{ cancelLabel }}</button>
  <button [class]="buttonClasses + ' ' + applyButtonClasses" type="button" [disabled]="applyDisabled" (click)="applyClicked.emit()">{{ applyLabel }}</button>
</div>
```

**Key notes:**
- `[disabled]="applyDisabled"` replaces `$(el).prop('disabled', true/false)`.
- `selectedText` is the formatted date range string, computed in the host component.

---

## Phase 4: CSS Migration

### Step 4.1 — Copy `daterangepicker.css` to the library

Copy the contents of root `daterangepicker.css` into `projects/ng-daterangepicker/src/lib/daterangepicker.component.css`. The CSS requires no changes — it is already framework-agnostic class-based styling.

In `DateRangePickerComponent`:
```typescript
@Component({
  selector: 'drp-daterangepicker',
  templateUrl: './date-range-picker.component.html',
  styleUrls: ['./daterangepicker.component.css'],
  encapsulation: ViewEncapsulation.None,  // REQUIRED
})
```

**Key notes:**
- `ViewEncapsulation.None` is intentional — same pattern as the original global `<link>` to `daterangepicker.css`.
- Alternatively, keep the CSS as a global stylesheet and add it to `angular.json` under the demo app's `styles`. This is the standard approach for library consumers who add it to their own `styles.css`: `@import 'ng-daterangepicker/daterangepicker.css';`
- No CSS class names need to change — the Angular templates reproduce the same markup structure.

---

### Step 4.2 — Configure CSS asset export in `ng-package.json`

```json
{
  "lib": {
    "entryFile": "src/public-api.ts",
    "cssUrl": "inline"
  },
  "assets": [
    "./src/lib/daterangepicker.component.css"
  ]
}
```

---

## Phase 5: Public API and Library Entry Point

### Step 5.1 — Update `public-api.ts`

```typescript
// projects/ng-daterangepicker/src/public-api.ts
export * from './lib/date-range-picker/date-range-picker.component';
export * from './lib/models/date-range-picker.models';
export * from './lib/date-picker.service';
export * from './lib/calendar/calendar.component';
export * from './lib/ranges/ranges.component';
export * from './lib/time-picker/time-picker.component';
export * from './lib/buttons/buttons.component';
```

### Step 5.2 — Update `projects/ng-daterangepicker/package.json`

```json
{
  "name": "ng-daterangepicker",
  "version": "4.0.0",
  "description": "Angular date range picker component library. Bootstrap-compatible, dayjs-based.",
  "peerDependencies": {
    "@angular/common": "^21.0.0",
    "@angular/core": "^21.0.0",
    "dayjs": "^1.11.20",
    "bootstrap": "^5.3.8",
    "bootstrap-icons": "^1.13.1"
  }
}
```

---

## Phase 6: Demo Application Update

### Step 6.1 — Update `projects/demo/src/app/app.component.html`

Replace `demo.html`'s jQuery configuration builder with Angular bindings:

```html
<drp-daterangepicker
  [singleDatePicker]="config.singleDatePicker"
  [timePicker]="config.timePicker"
  [showDropdowns]="config.showDropdowns"
  [ranges]="ranges"
  [opens]="config.opens"
  [drops]="config.drops"
  (apply)="onApply($event)"
  (cancel)="onCancel()">
</drp-daterangepicker>
```

---

## Phase 7: CLAUDE.md Update

### Step 7.1 — Rewrite `CLAUDE.md`

Replace existing content with:

1. **Project Overview**: Angular v21 component library (publishable via ng-packagr). Converted from jQuery UMD plugin. jQuery removed; dayjs retained.

2. **Commands**:
   - `npm install` — install workspace dependencies
   - `ng build ng-daterangepicker` — build the library
   - `ng serve demo` — run the demo application
   - `ng build ng-daterangepicker --watch` — watch mode for library development

3. **Architecture**: Component tree (host + sub-components), the service, the models file. Positioning uses `Renderer2` + `getBoundingClientRect()` — no CDK or Angular Material.

4. **dayjs**: Plugins are loaded once in `DatePickerService` constructor via a `private static initialized = false` guard. Do not use moment.js.

5. **CSS**: `daterangepicker.component.css` is the migrated stylesheet. `ViewEncapsulation.None` is intentional. Consumers must import the CSS.

6. **No SSR**: Library uses CSS only (no SCSS), no server-side rendering support. `document` and `window` access is direct (not wrapped in `isPlatformBrowser`).

7. **Testing**: No tests are configured. Manual testing via `ng serve demo`.

---

## Phase 8: Cleanup

### Step 8.1 — Delete legacy files (after all phases complete)

- `daterangepicker.js`
- `daterangepicker.css` (root level)
- `moment.min.js`
- `bower.json`
- `demo.html`
- `package.js`
- `example/` directory
- `website/` directory
- `drp.png`

---

## Key Tricky Areas

### Tricky Area 1: The `move()` / Positioning Function

The original `move()` reads `.offset().top`, `.outerHeight()`, `.offset().left`, `.scrollTop()`, `$(window).width()` and writes computed inline CSS. This is ported directly using native DOM APIs:

| jQuery | Native equivalent |
|---|---|
| `$(el).offset().top` | `el.getBoundingClientRect().top + window.scrollY` |
| `$(el).offset().left` | `el.getBoundingClientRect().left + window.scrollX` |
| `$(el).outerHeight()` | `el.offsetHeight` |
| `$(window).width()` | `window.innerWidth` |
| `$(el).css({top, left})` | `[ngStyle]="positionStyles"` |
| `$(template).appendTo('body')` | `renderer.appendChild(document.body, panelEl)` in `ngAfterViewInit` |

The `Renderer2` service is used (not direct DOM access) so the approach is compatible with Angular's rendering model. The `move()` logic is a near-verbatim port — see Step 3.5 for the full implementation.

### Tricky Area 2: `hoverDate` In-Range Preview

The original iterates all `td` elements imperatively on mouseenter.

**Angular solution**: Store `hoverDate: Dayjs | null` in the host component. Pass to `DrpCalendarGridComponent` as `@Input() hoverDate`. In `getCellClasses(cell)`, evaluate `'in-range': !endDate && hoverDate && cell.date.isAfter(startDate) && cell.date.isBefore(hoverDate)`. Angular's change detection re-evaluates `[ngClass]` bindings automatically.

**Performance**: Use `ChangeDetectionStrategy.OnPush` on `DrpCalendarGridComponent`. With 42 cells × 2 calendars = 84 `getCellClasses()` calls per detection cycle during hover, OnPush keeps rendering smooth.

### Tricky Area 3: Time Picker State Reads During `clickDate()`

The original reads `$('.left .hourselect').val()` from the DOM. In Angular, time picker state lives in component-bound data via `[(ngModel)]`. When `onCellMousedown()` fires, read `this.leftTimeState.selectedHour` from component state instead.

### Tricky Area 4: Month/Year Dropdown Changes

The original reads values from DOM selects in `monthOrYearChanged()`. In Angular, use `(change)="onMonthChanged($event)"` and `(change)="onYearChanged($event)"` on `<select>` elements inside `DrpCalendarHeaderComponent`, emitting parsed values to the host via `@Output() monthYearChanged`.

### Tricky Area 5: `autoUpdateInput` / External Input Binding

The original writes to an `<input>` element that the picker was instantiated on.

**Recommendation**: Implement `ControlValueAccessor` so `<drp-daterangepicker formControlName="dateRange">` works out of the box with Angular Forms.

### Tricky Area 6: `$.extend` Deep Merge for `locale`

Replace with:
```typescript
this.resolvedLocale = { ...DEFAULT_LOCALE, ...this.locale };
```
For array properties (`daysOfWeek`, `monthNames`), override explicitly: `daysOfWeek: this.locale?.daysOfWeek ?? DEFAULT_LOCALE.daysOfWeek`.

### Tricky Area 7: `data-api` Options from HTML Attributes

The original reads `options = $.extend(this.element.data(), options)` to pick up `data-startDate` etc. Angular's `@Input()` decorators replace this entirely — no `data-*` attribute reading needed.

---

## Implementation Order (Sequenced)

1. Phase 1.1 — Delete legacy files
2. Phase 1.2 — `ng new` + `ng generate library`
3. Phase 1.3 — `ng generate application demo`
4. Phase 1.4 — Update dependencies (remove jQuery, add CDK)
5. Phase 2.1 — Write all TypeScript interfaces
6. Phase 2.2 — Write `DatePickerService` (pure date logic, no DOM)
7. Phase 3.1 — Generate all component stubs
8. Phase 3.2 — Implement host `DateRangePickerComponent` state management
9. Phase 3.3–3.10 — Implement each sub-component bottom-up (grid → calendar → ranges/buttons/time)
10. Phase 3.5 — Implement CDK overlay positioning
11. Phase 3.6 — Implement click-outside detection
12. Phase 4 — Migrate CSS
13. Phase 5 — Wire up public API
14. Phase 6 — Build demo app
15. Phase 7 — Rewrite CLAUDE.md
16. Phase 8 — Delete remaining legacy files

---

## Files to Create (Summary)

```
projects/ng-daterangepicker/src/lib/models/date-range-picker.models.ts
projects/ng-daterangepicker/src/lib/date-picker.service.ts
projects/ng-daterangepicker/src/lib/date-range-picker/date-range-picker.component.ts
projects/ng-daterangepicker/src/lib/date-range-picker/date-range-picker.component.html
projects/ng-daterangepicker/src/lib/date-range-picker/date-range-picker.component.css
projects/ng-daterangepicker/src/lib/calendar/calendar.component.ts
projects/ng-daterangepicker/src/lib/calendar/calendar.component.html
projects/ng-daterangepicker/src/lib/calendar-grid/calendar-grid.component.ts
projects/ng-daterangepicker/src/lib/calendar-grid/calendar-grid.component.html
projects/ng-daterangepicker/src/lib/calendar-header/calendar-header.component.ts
projects/ng-daterangepicker/src/lib/calendar-header/calendar-header.component.html
projects/ng-daterangepicker/src/lib/time-picker/time-picker.component.ts
projects/ng-daterangepicker/src/lib/time-picker/time-picker.component.html
projects/ng-daterangepicker/src/lib/ranges/ranges.component.ts
projects/ng-daterangepicker/src/lib/ranges/ranges.component.html
projects/ng-daterangepicker/src/lib/buttons/buttons.component.ts
projects/ng-daterangepicker/src/lib/buttons/buttons.component.html
projects/ng-daterangepicker/src/public-api.ts
projects/ng-daterangepicker/package.json
projects/ng-daterangepicker/ng-package.json
projects/demo/src/app/app.component.ts
projects/demo/src/app/app.component.html
angular.json
tsconfig.json
CLAUDE.md
```
