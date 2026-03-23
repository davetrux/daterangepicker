import { Injectable } from '@angular/core';
import dayjs, { Dayjs } from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isoWeek from 'dayjs/plugin/isoWeek';
import localeData from 'dayjs/plugin/localeData';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import weekday from 'dayjs/plugin/weekday';
import arraySupport from 'dayjs/plugin/arraySupport';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import calendar from 'dayjs/plugin/calendar';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

import {
  CalendarCell,
  CalendarSide,
  CalendarState,
  DateRangeLocale,
  DateRangePickerConfig,
  RangeItem,
  TimeOption,
  TimePickerState,
} from './models/date-range-picker.models';

export const DEFAULT_LOCALE: DateRangeLocale = {
  direction: 'ltr',
  format: 'MM/DD/YYYY',
  separator: ' - ',
  applyLabel: 'Apply',
  cancelLabel: 'Cancel',
  weekLabel: 'W',
  customRangeLabel: 'Custom Range',
  daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  firstDay: 0,
};

@Injectable({ providedIn: 'root' })
export class DatePickerService {
  private static initialized = false;

  constructor() {
    if (!DatePickerService.initialized) {
      dayjs.extend(updateLocale);
      dayjs.extend(customParseFormat);
      dayjs.extend(isoWeek);
      dayjs.extend(localeData);
      dayjs.extend(localizedFormat);
      dayjs.extend(weekday);
      dayjs.extend(arraySupport);
      dayjs.extend(weekOfYear);
      dayjs.extend(advancedFormat);
      dayjs.extend(relativeTime);
      dayjs.extend(calendar);
      dayjs.extend(isSameOrBefore);
      dayjs.extend(isSameOrAfter);
      DatePickerService.initialized = true;
    }
  }

  buildLocale(partial?: Partial<DateRangeLocale>): DateRangeLocale {
    if (!partial) return { ...DEFAULT_LOCALE };
    const locale: DateRangeLocale = {
      ...DEFAULT_LOCALE,
      ...partial,
      daysOfWeek: partial.daysOfWeek ? [...partial.daysOfWeek] : [...DEFAULT_LOCALE.daysOfWeek],
      monthNames: partial.monthNames ? [...partial.monthNames] : [...DEFAULT_LOCALE.monthNames],
    };
    // rotate daysOfWeek so firstDay is first
    if (locale.firstDay !== 0) {
      let iter = locale.firstDay;
      while (iter > 0) {
        locale.daysOfWeek.push(locale.daysOfWeek.shift()!);
        iter--;
      }
    }
    return locale;
  }

  parseDateInput(value: Dayjs | string | undefined | false, format: string): Dayjs | false {
    if (!value) return false;
    if (typeof value === 'string') return dayjs(value, format);
    return dayjs(value as Dayjs);
  }

  clampStartDate(date: Dayjs, config: DateRangePickerConfig, locale: DateRangeLocale): Dayjs {
    let result = date;
    if (!config.timePicker) result = result.startOf('day');
    if (config.timePicker && config.timePickerIncrement) {
      result = result.minute(
        Math.round(result.minute() / config.timePickerIncrement!) * config.timePickerIncrement!
      );
    }
    const minDate = this.parseDateInput(config.minDate, locale.format);
    const maxDate = this.parseDateInput(config.maxDate, locale.format);
    if (minDate && result.isBefore(minDate)) {
      result = minDate.clone();
      if (config.timePicker && config.timePickerIncrement) {
        result = result.minute(
          Math.round(result.minute() / config.timePickerIncrement!) * config.timePickerIncrement!
        );
      }
    }
    if (maxDate && result.isAfter(maxDate)) {
      result = maxDate.clone();
      if (config.timePicker && config.timePickerIncrement) {
        result = result.minute(
          Math.floor(result.minute() / config.timePickerIncrement!) * config.timePickerIncrement!
        );
      }
    }
    return result;
  }

  clampEndDate(date: Dayjs, startDate: Dayjs, config: DateRangePickerConfig, locale: DateRangeLocale): Dayjs {
    let result = date;
    if (!config.timePicker) result = result.endOf('day');
    if (config.timePicker && config.timePickerIncrement) {
      result = result.minute(
        Math.round(result.minute() / config.timePickerIncrement!) * config.timePickerIncrement!
      );
    }
    if (result.isBefore(startDate)) result = startDate.clone();
    const maxDate = this.parseDateInput(config.maxDate, locale.format);
    if (maxDate && result.isAfter(maxDate)) result = maxDate.clone();
    if (config.maxSpan) {
      const spanEnd = startDate.clone().add(config.maxSpan as any);
      if (spanEnd.isBefore(result)) result = spanEnd.clone();
    }
    return result;
  }

  buildRanges(
    rawRanges: Record<string, [Dayjs | string, Dayjs | string]>,
    config: DateRangePickerConfig,
    locale: DateRangeLocale
  ): RangeItem[] {
    const minDate = this.parseDateInput(config.minDate, locale.format);
    const maxDate = this.parseDateInput(config.maxDate, locale.format);
    const result: RangeItem[] = [];

    for (const key of Object.keys(rawRanges)) {
      let start = this.parseDateInput(rawRanges[key][0], locale.format) as Dayjs;
      let end = this.parseDateInput(rawRanges[key][1], locale.format) as Dayjs;

      if (minDate && start.isBefore(minDate)) start = minDate.clone();

      let effectiveMax = maxDate;
      if (config.maxSpan && effectiveMax && start.clone().add(config.maxSpan as any).isAfter(effectiveMax)) {
        effectiveMax = start.clone().add(config.maxSpan as any);
      }
      if (effectiveMax && end.isAfter(effectiveMax)) end = effectiveMax.clone();

      const granularity = config.timePicker ? 'minute' : 'day';
      if (
        (minDate && end.isBefore(minDate, granularity)) ||
        (effectiveMax && start.isAfter(effectiveMax, granularity))
      ) continue;

      result.push({ key, label: key, start, end });
    }
    return result;
  }

  calculateChosenLabel(
    startDate: Dayjs,
    endDate: Dayjs,
    ranges: RangeItem[],
    config: DateRangePickerConfig
  ): string | null {
    for (const range of ranges) {
      if (config.timePicker) {
        const fmt = config.timePickerSeconds ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm';
        if (startDate.format(fmt) === range.start.format(fmt) && endDate.format(fmt) === range.end.format(fmt)) {
          return range.key;
        }
      } else {
        if (
          startDate.format('YYYY-MM-DD') === range.start.format('YYYY-MM-DD') &&
          endDate.format('YYYY-MM-DD') === range.end.format('YYYY-MM-DD')
        ) {
          return range.key;
        }
      }
    }
    return null;
  }

  buildCalendar(
    monthDate: Dayjs,
    startDate: Dayjs,
    endDate: Dayjs | null,
    hoverDate: Dayjs | null,
    side: CalendarSide,
    config: DateRangePickerConfig,
    locale: DateRangeLocale
  ): CalendarState {
    const month = monthDate.month();
    const year = monthDate.year();
    const hour = monthDate.hour();
    const minute = monthDate.minute();
    const second = monthDate.second();

    const daysInMonth = dayjs([year, month]).daysInMonth();
    const firstDay = dayjs([year, month, 1]);
    const lastDay = dayjs([year, month, daysInMonth]);
    const prevMonth = dayjs(firstDay).subtract(1, 'month');
    const lastMonth = prevMonth.month();
    const lastYear = prevMonth.year();
    const daysInLastMonth = dayjs([lastYear, lastMonth]).daysInMonth();
    const dayOfWeek = firstDay.day();

    // Build 6x7 grid of Dayjs values
    let startDay = daysInLastMonth - dayOfWeek + locale.firstDay + 1;
    if (startDay > daysInLastMonth) startDay -= 7;
    if (dayOfWeek === locale.firstDay) startDay = daysInLastMonth - 6;

    let curDate = dayjs([lastYear, lastMonth, startDay, 12, minute, second]);
    const rawGrid: Dayjs[][] = Array.from({ length: 6 }, () => new Array(7));

    let col = 0, row = 0;
    for (let i = 0; i < 42; i++, col++, curDate = dayjs(curDate).add(24, 'hour')) {
      if (i > 0 && col % 7 === 0) { col = 0; row++; }
      rawGrid[row][col] = curDate.clone().hour(hour).minute(minute).second(second);
      curDate = curDate.hour(12);

      const minDate = this.parseDateInput(config.minDate, locale.format);
      const maxDate = this.parseDateInput(config.maxDate, locale.format);

      if (minDate && rawGrid[row][col].format('YYYY-MM-DD') === minDate.format('YYYY-MM-DD') &&
          rawGrid[row][col].isBefore(minDate) && side === 'left') {
        rawGrid[row][col] = minDate.clone();
      }
      if (maxDate && rawGrid[row][col].format('YYYY-MM-DD') === maxDate.format('YYYY-MM-DD') &&
          rawGrid[row][col].isAfter(maxDate) && side === 'right') {
        rawGrid[row][col] = maxDate.clone();
      }
    }

    // Compute effective maxDate (accounting for maxSpan)
    const minDate = this.parseDateInput(config.minDate, locale.format);
    let maxDate = this.parseDateInput(config.maxDate, locale.format);
    if (endDate === null && config.maxSpan) {
      const maxLimit = startDate.clone().add(config.maxSpan as any).endOf('day');
      if (!maxDate || maxLimit.isBefore(maxDate)) maxDate = maxLimit;
    }

    // Build CalendarCell grid
    const calendar: CalendarCell[][] = rawGrid.map((rowArr, r) =>
      rowArr.map((date, c) => {
        const classes: string[] = [];

        if (date.isSame(new Date(), 'day')) classes.push('today');
        if (date.isoWeekday() > 5) classes.push('weekend');
        if (date.month() !== rawGrid[1][1].month()) classes.push('off', 'ends');
        if (minDate && date.isBefore(minDate, 'day')) classes.push('off', 'disabled');
        if (maxDate && date.isAfter(maxDate, 'day')) classes.push('off', 'disabled');
        if (config.isInvalidDate && config.isInvalidDate(date)) classes.push('off', 'disabled');
        if (date.format('YYYY-MM-DD') === startDate.format('YYYY-MM-DD')) classes.push('active', 'start-date');
        if (endDate && date.format('YYYY-MM-DD') === endDate.format('YYYY-MM-DD')) classes.push('active', 'end-date');
        if (endDate && date.isAfter(startDate) && date.isBefore(endDate)) classes.push('in-range');
        // hover preview: only when no endDate yet
        if (!endDate && hoverDate && (date.isAfter(startDate) && date.isBefore(hoverDate)) || (date.isSame(hoverDate, 'day'))) {
          if (!classes.includes('in-range')) classes.push('in-range');
        }

        if (config.isCustomDate) {
          const custom = config.isCustomDate(date);
          if (custom !== false) {
            if (typeof custom === 'string') classes.push(custom);
            else classes.push(...custom);
          }
        }

        const isAvailable = !classes.includes('disabled');
        if (isAvailable) classes.push('available');

        return { date, classes, isAvailable, dayNumber: date.date(), row: r, col: c };
      })
    );

    return { month: monthDate, calendar, firstDay, lastDay };
  }

  buildTimePicker(
    selected: Dayjs,
    minDate: Dayjs | false,
    maxDate: Dayjs | false,
    config: DateRangePickerConfig
  ): TimePickerState {
    const start = config.timePicker24Hour ? 0 : 1;
    const end = config.timePicker24Hour ? 23 : 12;
    const hours: TimeOption[] = [];

    for (let i = start; i <= end; i++) {
      let i_in_24 = i;
      if (!config.timePicker24Hour) {
        i_in_24 = selected.hour() >= 12 ? (i === 12 ? 12 : i + 12) : (i === 12 ? 0 : i);
      }
      const time = selected.clone().hour(i_in_24);
      const disabled =
        (minDate !== false && time.minute(59).isBefore(minDate)) ||
        (maxDate !== false && time.minute(0).isAfter(maxDate));
      hours.push({ value: i, label: String(i), disabled });
    }

    const minutes: TimeOption[] = [];
    const increment = config.timePickerIncrement ?? 1;
    for (let i = 0; i < 60; i += increment) {
      const time = selected.clone().minute(i);
      const disabled =
        (minDate !== false && time.second(59).isBefore(minDate)) ||
        (maxDate !== false && time.second(0).isAfter(maxDate));
      minutes.push({ value: i, label: i < 10 ? `0${i}` : String(i), disabled });
    }

    const seconds: TimeOption[] = [];
    if (config.timePickerSeconds) {
      for (let i = 0; i < 60; i++) {
        const time = selected.clone().second(i);
        const disabled =
          (minDate !== false && time.isBefore(minDate)) ||
          (maxDate !== false && time.isAfter(maxDate));
        seconds.push({ value: i, label: i < 10 ? `0${i}` : String(i), disabled });
      }
    }

    const ampmDisabledAM = minDate !== false && selected.clone().hour(12).minute(0).second(0).isBefore(minDate);
    const ampmDisabledPM = maxDate !== false && selected.clone().hour(0).minute(0).second(0).isAfter(maxDate);
    const selectedAmpm: 'AM' | 'PM' = selected.hour() >= 12 ? 'PM' : 'AM';

    // selectedHour in 12h format
    let selectedHour = selected.hour();
    if (!config.timePicker24Hour) {
      selectedHour = selectedHour === 0 ? 12 : selectedHour > 12 ? selectedHour - 12 : selectedHour;
    }

    return {
      hours,
      minutes,
      seconds,
      ampmDisabledAM,
      ampmDisabledPM,
      selectedHour,
      selectedMinute: selected.minute(),
      selectedSecond: selected.second(),
      selectedAmpm,
    };
  }
}
