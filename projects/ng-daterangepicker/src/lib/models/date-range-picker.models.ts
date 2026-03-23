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

export interface CalendarState {
  month: Dayjs;
  calendar: CalendarCell[][];
  firstDay: Dayjs;
  lastDay: Dayjs;
}

export interface TimeOption {
  value: number;
  label: string;
  disabled: boolean;
}

export interface TimePickerState {
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

export interface RangeItem {
  key: string;
  label: string;
  start: Dayjs;
  end: Dayjs;
}
