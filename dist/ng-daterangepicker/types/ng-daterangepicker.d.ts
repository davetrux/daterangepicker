import { Dayjs } from 'dayjs';
import * as i0 from '@angular/core';
import { EventEmitter, OnChanges, OnInit, AfterViewInit, OnDestroy, ElementRef, RendererFactory2, SimpleChanges } from '@angular/core';

interface DateRange {
    startDate: Dayjs;
    endDate: Dayjs;
    label?: string;
}
interface DateRangeLocale {
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
interface DateRangePickerConfig {
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
type CalendarSide = 'left' | 'right';
interface CalendarCell {
    date: Dayjs;
    classes: string[];
    isAvailable: boolean;
    dayNumber: number;
    row: number;
    col: number;
}
interface CalendarState {
    month: Dayjs;
    calendar: CalendarCell[][];
    firstDay: Dayjs;
    lastDay: Dayjs;
}
interface TimeOption {
    value: number;
    label: string;
    disabled: boolean;
}
interface TimePickerState {
    hours: TimeOption[];
    minutes: TimeOption[];
    seconds: TimeOption[];
    ampmDisabledAM: boolean;
    ampmDisabledPM: boolean;
    selectedHour: number;
    selectedMinute: number;
    selectedSecond: number;
    selectedAmpm: 'AM' | 'PM';
}
interface RangeItem {
    key: string;
    label: string;
    start: Dayjs;
    end: Dayjs;
}

declare const DEFAULT_LOCALE: DateRangeLocale;
declare class DatePickerService {
    private static initialized;
    constructor();
    buildLocale(partial?: Partial<DateRangeLocale>): DateRangeLocale;
    parseDateInput(value: Dayjs | string | undefined | false, format: string): Dayjs | false;
    clampStartDate(date: Dayjs, config: DateRangePickerConfig, locale: DateRangeLocale): Dayjs;
    clampEndDate(date: Dayjs, startDate: Dayjs, config: DateRangePickerConfig, locale: DateRangeLocale): Dayjs;
    buildRanges(rawRanges: Record<string, [Dayjs | string, Dayjs | string]>, config: DateRangePickerConfig, locale: DateRangeLocale): RangeItem[];
    calculateChosenLabel(startDate: Dayjs, endDate: Dayjs, ranges: RangeItem[], config: DateRangePickerConfig): string | null;
    buildCalendar(monthDate: Dayjs, startDate: Dayjs, endDate: Dayjs | null, hoverDate: Dayjs | null, side: CalendarSide, config: DateRangePickerConfig, locale: DateRangeLocale): CalendarState;
    buildTimePicker(selected: Dayjs, minDate: Dayjs | false, maxDate: Dayjs | false, config: DateRangePickerConfig): TimePickerState;
    static ɵfac: i0.ɵɵFactoryDeclaration<DatePickerService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<DatePickerService>;
}

interface MonthYearChangeEvent {
    side: CalendarSide;
    month: number;
    year: number;
}
declare class CalendarHeader {
    side: CalendarSide;
    calendarState: CalendarState;
    locale: DateRangeLocale;
    showDropdowns: boolean;
    showWeekNumbers: boolean;
    showISOWeekNumbers: boolean;
    linkedCalendars: boolean;
    singleDatePicker: boolean;
    minDate: Dayjs | false;
    maxDate: Dayjs | false;
    minYear: number;
    maxYear: number;
    prevClicked: EventEmitter<CalendarSide>;
    nextClicked: EventEmitter<CalendarSide>;
    monthYearChanged: EventEmitter<MonthYearChangeEvent>;
    get currentMonth(): number;
    get currentYear(): number;
    get monthLabel(): string;
    get effectiveMinYear(): number;
    get effectiveMaxYear(): number;
    get showPrev(): boolean;
    get showNext(): boolean;
    isMonthDisabled(m: number): boolean;
    getYears(): number[];
    onMonthChange(month: string): void;
    onYearChange(year: string): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CalendarHeader, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CalendarHeader, "drp-calendar-header", never, { "side": { "alias": "side"; "required": true; }; "calendarState": { "alias": "calendarState"; "required": true; }; "locale": { "alias": "locale"; "required": true; }; "showDropdowns": { "alias": "showDropdowns"; "required": false; }; "showWeekNumbers": { "alias": "showWeekNumbers"; "required": false; }; "showISOWeekNumbers": { "alias": "showISOWeekNumbers"; "required": false; }; "linkedCalendars": { "alias": "linkedCalendars"; "required": false; }; "singleDatePicker": { "alias": "singleDatePicker"; "required": false; }; "minDate": { "alias": "minDate"; "required": false; }; "maxDate": { "alias": "maxDate"; "required": false; }; "minYear": { "alias": "minYear"; "required": false; }; "maxYear": { "alias": "maxYear"; "required": false; }; }, { "prevClicked": "prevClicked"; "nextClicked": "nextClicked"; "monthYearChanged": "monthYearChanged"; }, never, never, true, never>;
}

interface DateClickEvent {
    cell: CalendarCell;
    side: CalendarSide;
}
declare class CalendarGrid implements OnChanges {
    side: CalendarSide;
    calendarState: CalendarState;
    showWeekNumbers: boolean;
    showISOWeekNumbers: boolean;
    hoverDate: Dayjs | null;
    startDate: Dayjs | null;
    endDate: Dayjs | null;
    dateClicked: EventEmitter<DateClickEvent>;
    dateHovered: EventEmitter<DateClickEvent>;
    ngOnChanges(): void;
    getCellClasses(cell: CalendarCell): Record<string, boolean>;
    onCellMousedown(cell: CalendarCell, event: MouseEvent): void;
    onCellMouseenter(cell: CalendarCell): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CalendarGrid, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CalendarGrid, "drp-calendar-grid", never, { "side": { "alias": "side"; "required": true; }; "calendarState": { "alias": "calendarState"; "required": true; }; "showWeekNumbers": { "alias": "showWeekNumbers"; "required": false; }; "showISOWeekNumbers": { "alias": "showISOWeekNumbers"; "required": false; }; "hoverDate": { "alias": "hoverDate"; "required": false; }; "startDate": { "alias": "startDate"; "required": false; }; "endDate": { "alias": "endDate"; "required": false; }; }, { "dateClicked": "dateClicked"; "dateHovered": "dateHovered"; }, never, never, true, never>;
}

interface TimeChangeEvent {
    side: CalendarSide;
    hour: number;
    minute: number;
    second: number;
    ampm: 'AM' | 'PM';
}
declare class TimePicker {
    side: CalendarSide;
    state: TimePickerState;
    disabled: boolean;
    timePicker24Hour: boolean;
    timePickerSeconds: boolean;
    timeChanged: EventEmitter<TimeChangeEvent>;
    selectedHour: number;
    selectedMinute: number;
    selectedSecond: number;
    selectedAmpm: 'AM' | 'PM';
    ngOnChanges(): void;
    emitChange(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<TimePicker, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<TimePicker, "drp-time-picker", never, { "side": { "alias": "side"; "required": true; }; "state": { "alias": "state"; "required": true; }; "disabled": { "alias": "disabled"; "required": false; }; "timePicker24Hour": { "alias": "timePicker24Hour"; "required": false; }; "timePickerSeconds": { "alias": "timePickerSeconds"; "required": false; }; }, { "timeChanged": "timeChanged"; }, never, never, true, never>;
}

declare class DateRangePickerComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    private svc;
    startDate?: Dayjs | string;
    endDate?: Dayjs | string;
    minDate?: Dayjs | string | false;
    maxDate?: Dayjs | string | false;
    maxSpan?: Record<string, number> | false;
    singleDatePicker: boolean;
    autoApply: boolean;
    showDropdowns: boolean;
    minYear?: number;
    maxYear?: number;
    showWeekNumbers: boolean;
    showISOWeekNumbers: boolean;
    showCustomRangeLabel: boolean;
    timePicker: boolean;
    timePicker24Hour: boolean;
    timePickerIncrement: number;
    timePickerSeconds: boolean;
    linkedCalendars: boolean;
    autoUpdateInput: boolean;
    alwaysShowCalendars: boolean;
    ranges?: Record<string, [Dayjs | string, Dayjs | string]>;
    opens: 'left' | 'right' | 'center';
    drops: 'up' | 'down' | 'auto';
    buttonClasses: string;
    applyButtonClasses: string;
    cancelButtonClasses: string;
    locale?: Partial<DateRangeLocale>;
    isInvalidDate?: (date: Dayjs) => boolean;
    isCustomDate?: (date: Dayjs) => string | string[] | false;
    apply: EventEmitter<DateRange>;
    cancel: EventEmitter<void>;
    showPicker: EventEmitter<void>;
    hidePicker: EventEmitter<void>;
    showCalendarEvent: EventEmitter<void>;
    hideCalendarEvent: EventEmitter<void>;
    rangeSelected: EventEmitter<DateRange>;
    pickerPanelRef: ElementRef<HTMLDivElement>;
    triggerElRef: ElementRef<HTMLElement>;
    isShowing: boolean;
    showCalendarsPanel: boolean;
    resolvedLocale: DateRangeLocale;
    internalStartDate: Dayjs;
    internalEndDate: Dayjs | null;
    oldStartDate: Dayjs;
    oldEndDate: Dayjs | null;
    leftCalendarState: CalendarState;
    rightCalendarState: CalendarState;
    leftTimePickerState?: TimePickerState;
    rightTimePickerState?: TimePickerState;
    builtRanges: RangeItem[];
    chosenLabel: string | null;
    hoverDate: Dayjs | null;
    positionStyles: Record<string, string>;
    isApplyDisabled: boolean;
    isDropUp: boolean;
    selectedText: string;
    resolvedMinDate: Dayjs | false;
    resolvedMaxDate: Dayjs | false;
    effectiveMinYear: number;
    effectiveMaxYear: number;
    previousRightTime?: Dayjs;
    private config;
    private renderer;
    constructor(svc: DatePickerService, rendererFactory: RendererFactory2);
    ngOnInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    private initConfig;
    updateView(): void;
    private leftMonthDate;
    private rightMonthDate;
    private updateMonthsInView;
    private rebuildCalendars;
    private rebuildTimePickers;
    private updateFormInputs;
    private updateSelectedText;
    toggle(): void;
    show(): void;
    hide(): void;
    move(): void;
    onDocumentMousedown(event: MouseEvent): void;
    onDocumentTouchend(event: TouchEvent): void;
    onWindowResize(): void;
    onKeydown(event: KeyboardEvent): void;
    onPrevClicked(side: CalendarSide): void;
    onNextClicked(side: CalendarSide): void;
    onMonthYearChanged(event: MonthYearChangeEvent): void;
    onDateClicked(event: DateClickEvent): void;
    onDateHovered(event: DateClickEvent): void;
    onTimeChanged(event: TimeChangeEvent): void;
    onRangeClicked(range: RangeItem | null): void;
    clickApply(): void;
    clickCancel(): void;
    get showRanges(): boolean;
    get showSingleCalendar(): boolean;
    get pickerClasses(): Record<string, boolean>;
    static ɵfac: i0.ɵɵFactoryDeclaration<DateRangePickerComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<DateRangePickerComponent, "drp-date-range-picker", never, { "startDate": { "alias": "startDate"; "required": false; }; "endDate": { "alias": "endDate"; "required": false; }; "minDate": { "alias": "minDate"; "required": false; }; "maxDate": { "alias": "maxDate"; "required": false; }; "maxSpan": { "alias": "maxSpan"; "required": false; }; "singleDatePicker": { "alias": "singleDatePicker"; "required": false; }; "autoApply": { "alias": "autoApply"; "required": false; }; "showDropdowns": { "alias": "showDropdowns"; "required": false; }; "minYear": { "alias": "minYear"; "required": false; }; "maxYear": { "alias": "maxYear"; "required": false; }; "showWeekNumbers": { "alias": "showWeekNumbers"; "required": false; }; "showISOWeekNumbers": { "alias": "showISOWeekNumbers"; "required": false; }; "showCustomRangeLabel": { "alias": "showCustomRangeLabel"; "required": false; }; "timePicker": { "alias": "timePicker"; "required": false; }; "timePicker24Hour": { "alias": "timePicker24Hour"; "required": false; }; "timePickerIncrement": { "alias": "timePickerIncrement"; "required": false; }; "timePickerSeconds": { "alias": "timePickerSeconds"; "required": false; }; "linkedCalendars": { "alias": "linkedCalendars"; "required": false; }; "autoUpdateInput": { "alias": "autoUpdateInput"; "required": false; }; "alwaysShowCalendars": { "alias": "alwaysShowCalendars"; "required": false; }; "ranges": { "alias": "ranges"; "required": false; }; "opens": { "alias": "opens"; "required": false; }; "drops": { "alias": "drops"; "required": false; }; "buttonClasses": { "alias": "buttonClasses"; "required": false; }; "applyButtonClasses": { "alias": "applyButtonClasses"; "required": false; }; "cancelButtonClasses": { "alias": "cancelButtonClasses"; "required": false; }; "locale": { "alias": "locale"; "required": false; }; "isInvalidDate": { "alias": "isInvalidDate"; "required": false; }; "isCustomDate": { "alias": "isCustomDate"; "required": false; }; }, { "apply": "apply"; "cancel": "cancel"; "showPicker": "showPicker"; "hidePicker": "hidePicker"; "showCalendarEvent": "showCalendarEvent"; "hideCalendarEvent": "hideCalendarEvent"; "rangeSelected": "rangeSelected"; }, never, ["*"], true, never>;
}

declare class DrpCalendar {
    side: CalendarSide;
    calendarState: CalendarState;
    locale: DateRangeLocale;
    timePicker: boolean;
    timePicker24Hour: boolean;
    timePickerSeconds: boolean;
    timePickerState?: TimePickerState;
    timePickerDisabled: boolean;
    showDropdowns: boolean;
    showWeekNumbers: boolean;
    showISOWeekNumbers: boolean;
    linkedCalendars: boolean;
    singleDatePicker: boolean;
    minDate: Dayjs | false;
    maxDate: Dayjs | false;
    minYear: number;
    maxYear: number;
    hoverDate: Dayjs | null;
    startDate: Dayjs | null;
    endDate: Dayjs | null;
    prevClicked: EventEmitter<CalendarSide>;
    nextClicked: EventEmitter<CalendarSide>;
    monthYearChanged: EventEmitter<MonthYearChangeEvent>;
    dateClicked: EventEmitter<DateClickEvent>;
    dateHovered: EventEmitter<DateClickEvent>;
    timeChanged: EventEmitter<TimeChangeEvent>;
    static ɵfac: i0.ɵɵFactoryDeclaration<DrpCalendar, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<DrpCalendar, "drp-calendar", never, { "side": { "alias": "side"; "required": true; }; "calendarState": { "alias": "calendarState"; "required": true; }; "locale": { "alias": "locale"; "required": true; }; "timePicker": { "alias": "timePicker"; "required": false; }; "timePicker24Hour": { "alias": "timePicker24Hour"; "required": false; }; "timePickerSeconds": { "alias": "timePickerSeconds"; "required": false; }; "timePickerState": { "alias": "timePickerState"; "required": false; }; "timePickerDisabled": { "alias": "timePickerDisabled"; "required": false; }; "showDropdowns": { "alias": "showDropdowns"; "required": false; }; "showWeekNumbers": { "alias": "showWeekNumbers"; "required": false; }; "showISOWeekNumbers": { "alias": "showISOWeekNumbers"; "required": false; }; "linkedCalendars": { "alias": "linkedCalendars"; "required": false; }; "singleDatePicker": { "alias": "singleDatePicker"; "required": false; }; "minDate": { "alias": "minDate"; "required": false; }; "maxDate": { "alias": "maxDate"; "required": false; }; "minYear": { "alias": "minYear"; "required": false; }; "maxYear": { "alias": "maxYear"; "required": false; }; "hoverDate": { "alias": "hoverDate"; "required": false; }; "startDate": { "alias": "startDate"; "required": false; }; "endDate": { "alias": "endDate"; "required": false; }; }, { "prevClicked": "prevClicked"; "nextClicked": "nextClicked"; "monthYearChanged": "monthYearChanged"; "dateClicked": "dateClicked"; "dateHovered": "dateHovered"; "timeChanged": "timeChanged"; }, never, never, true, never>;
}

declare class Ranges {
    ranges: RangeItem[];
    showCustomRangeLabel: boolean;
    customRangeLabel: string;
    chosenLabel: string | null;
    rangeClicked: EventEmitter<RangeItem | null>;
    static ɵfac: i0.ɵɵFactoryDeclaration<Ranges, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<Ranges, "drp-ranges", never, { "ranges": { "alias": "ranges"; "required": false; }; "showCustomRangeLabel": { "alias": "showCustomRangeLabel"; "required": false; }; "customRangeLabel": { "alias": "customRangeLabel"; "required": false; }; "chosenLabel": { "alias": "chosenLabel"; "required": false; }; }, { "rangeClicked": "rangeClicked"; }, never, never, true, never>;
}

declare class Buttons {
    selectedText: string;
    applyDisabled: boolean;
    applyLabel: string;
    cancelLabel: string;
    buttonClasses: string;
    applyButtonClasses: string;
    cancelButtonClasses: string;
    applyClicked: EventEmitter<void>;
    cancelClicked: EventEmitter<void>;
    static ɵfac: i0.ɵɵFactoryDeclaration<Buttons, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<Buttons, "drp-buttons", never, { "selectedText": { "alias": "selectedText"; "required": false; }; "applyDisabled": { "alias": "applyDisabled"; "required": false; }; "applyLabel": { "alias": "applyLabel"; "required": false; }; "cancelLabel": { "alias": "cancelLabel"; "required": false; }; "buttonClasses": { "alias": "buttonClasses"; "required": false; }; "applyButtonClasses": { "alias": "applyButtonClasses"; "required": false; }; "cancelButtonClasses": { "alias": "cancelButtonClasses"; "required": false; }; }, { "applyClicked": "applyClicked"; "cancelClicked": "cancelClicked"; }, never, never, true, never>;
}

export { Buttons, CalendarGrid, CalendarHeader, DEFAULT_LOCALE, DatePickerService, DateRangePickerComponent, DrpCalendar, Ranges, TimePicker };
export type { CalendarCell, CalendarSide, CalendarState, DateClickEvent, DateRange, DateRangeLocale, DateRangePickerConfig, MonthYearChangeEvent, RangeItem, TimeChangeEvent, TimeOption, TimePickerState };
