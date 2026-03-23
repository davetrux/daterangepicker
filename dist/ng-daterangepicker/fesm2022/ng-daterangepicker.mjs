import * as i0 from '@angular/core';
import { Injectable, EventEmitter, Output, Input, Component, HostListener, ViewChild, ViewEncapsulation } from '@angular/core';
import dayjs from 'dayjs';
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
import * as i2 from '@angular/common';
import { CommonModule } from '@angular/common';
import * as i1 from '@angular/forms';
import { FormsModule } from '@angular/forms';

const DEFAULT_LOCALE = {
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
class DatePickerService {
    static initialized = false;
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
    buildLocale(partial) {
        if (!partial)
            return { ...DEFAULT_LOCALE };
        const locale = {
            ...DEFAULT_LOCALE,
            ...partial,
            daysOfWeek: partial.daysOfWeek ? [...partial.daysOfWeek] : [...DEFAULT_LOCALE.daysOfWeek],
            monthNames: partial.monthNames ? [...partial.monthNames] : [...DEFAULT_LOCALE.monthNames],
        };
        // rotate daysOfWeek so firstDay is first
        if (locale.firstDay !== 0) {
            let iter = locale.firstDay;
            while (iter > 0) {
                locale.daysOfWeek.push(locale.daysOfWeek.shift());
                iter--;
            }
        }
        return locale;
    }
    parseDateInput(value, format) {
        if (!value)
            return false;
        if (typeof value === 'string')
            return dayjs(value, format);
        return dayjs(value);
    }
    clampStartDate(date, config, locale) {
        let result = date;
        if (!config.timePicker)
            result = result.startOf('day');
        if (config.timePicker && config.timePickerIncrement) {
            result = result.minute(Math.round(result.minute() / config.timePickerIncrement) * config.timePickerIncrement);
        }
        const minDate = this.parseDateInput(config.minDate, locale.format);
        const maxDate = this.parseDateInput(config.maxDate, locale.format);
        if (minDate && result.isBefore(minDate)) {
            result = minDate.clone();
            if (config.timePicker && config.timePickerIncrement) {
                result = result.minute(Math.round(result.minute() / config.timePickerIncrement) * config.timePickerIncrement);
            }
        }
        if (maxDate && result.isAfter(maxDate)) {
            result = maxDate.clone();
            if (config.timePicker && config.timePickerIncrement) {
                result = result.minute(Math.floor(result.minute() / config.timePickerIncrement) * config.timePickerIncrement);
            }
        }
        return result;
    }
    clampEndDate(date, startDate, config, locale) {
        let result = date;
        if (!config.timePicker)
            result = result.endOf('day');
        if (config.timePicker && config.timePickerIncrement) {
            result = result.minute(Math.round(result.minute() / config.timePickerIncrement) * config.timePickerIncrement);
        }
        if (result.isBefore(startDate))
            result = startDate.clone();
        const maxDate = this.parseDateInput(config.maxDate, locale.format);
        if (maxDate && result.isAfter(maxDate))
            result = maxDate.clone();
        if (config.maxSpan) {
            const spanEnd = startDate.clone().add(config.maxSpan);
            if (spanEnd.isBefore(result))
                result = spanEnd.clone();
        }
        return result;
    }
    buildRanges(rawRanges, config, locale) {
        const minDate = this.parseDateInput(config.minDate, locale.format);
        const maxDate = this.parseDateInput(config.maxDate, locale.format);
        const result = [];
        for (const key of Object.keys(rawRanges)) {
            let start = this.parseDateInput(rawRanges[key][0], locale.format);
            let end = this.parseDateInput(rawRanges[key][1], locale.format);
            if (minDate && start.isBefore(minDate))
                start = minDate.clone();
            let effectiveMax = maxDate;
            if (config.maxSpan && effectiveMax && start.clone().add(config.maxSpan).isAfter(effectiveMax)) {
                effectiveMax = start.clone().add(config.maxSpan);
            }
            if (effectiveMax && end.isAfter(effectiveMax))
                end = effectiveMax.clone();
            const granularity = config.timePicker ? 'minute' : 'day';
            if ((minDate && end.isBefore(minDate, granularity)) ||
                (effectiveMax && start.isAfter(effectiveMax, granularity)))
                continue;
            result.push({ key, label: key, start, end });
        }
        return result;
    }
    calculateChosenLabel(startDate, endDate, ranges, config) {
        for (const range of ranges) {
            if (config.timePicker) {
                const fmt = config.timePickerSeconds ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm';
                if (startDate.format(fmt) === range.start.format(fmt) && endDate.format(fmt) === range.end.format(fmt)) {
                    return range.key;
                }
            }
            else {
                if (startDate.format('YYYY-MM-DD') === range.start.format('YYYY-MM-DD') &&
                    endDate.format('YYYY-MM-DD') === range.end.format('YYYY-MM-DD')) {
                    return range.key;
                }
            }
        }
        return null;
    }
    buildCalendar(monthDate, startDate, endDate, hoverDate, side, config, locale) {
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
        if (startDay > daysInLastMonth)
            startDay -= 7;
        if (dayOfWeek === locale.firstDay)
            startDay = daysInLastMonth - 6;
        let curDate = dayjs([lastYear, lastMonth, startDay, 12, minute, second]);
        const rawGrid = Array.from({ length: 6 }, () => new Array(7));
        let col = 0, row = 0;
        for (let i = 0; i < 42; i++, col++, curDate = dayjs(curDate).add(24, 'hour')) {
            if (i > 0 && col % 7 === 0) {
                col = 0;
                row++;
            }
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
            const maxLimit = startDate.clone().add(config.maxSpan).endOf('day');
            if (!maxDate || maxLimit.isBefore(maxDate))
                maxDate = maxLimit;
        }
        // Build CalendarCell grid
        const calendar = rawGrid.map((rowArr, r) => rowArr.map((date, c) => {
            const classes = [];
            if (date.isSame(new Date(), 'day'))
                classes.push('today');
            if (date.isoWeekday() > 5)
                classes.push('weekend');
            if (date.month() !== rawGrid[1][1].month())
                classes.push('off', 'ends');
            if (minDate && date.isBefore(minDate, 'day'))
                classes.push('off', 'disabled');
            if (maxDate && date.isAfter(maxDate, 'day'))
                classes.push('off', 'disabled');
            if (config.isInvalidDate && config.isInvalidDate(date))
                classes.push('off', 'disabled');
            if (date.format('YYYY-MM-DD') === startDate.format('YYYY-MM-DD'))
                classes.push('active', 'start-date');
            if (endDate && date.format('YYYY-MM-DD') === endDate.format('YYYY-MM-DD'))
                classes.push('active', 'end-date');
            if (endDate && date.isAfter(startDate) && date.isBefore(endDate))
                classes.push('in-range');
            // hover preview: only when no endDate yet
            if (!endDate && hoverDate && (date.isAfter(startDate) && date.isBefore(hoverDate)) || (date.isSame(hoverDate, 'day'))) {
                if (!classes.includes('in-range'))
                    classes.push('in-range');
            }
            if (config.isCustomDate) {
                const custom = config.isCustomDate(date);
                if (custom !== false) {
                    if (typeof custom === 'string')
                        classes.push(custom);
                    else
                        classes.push(...custom);
                }
            }
            const isAvailable = !classes.includes('disabled');
            if (isAvailable)
                classes.push('available');
            return { date, classes, isAvailable, dayNumber: date.date(), row: r, col: c };
        }));
        return { month: monthDate, calendar, firstDay, lastDay };
    }
    buildTimePicker(selected, minDate, maxDate, config) {
        const start = config.timePicker24Hour ? 0 : 1;
        const end = config.timePicker24Hour ? 23 : 12;
        const hours = [];
        for (let i = start; i <= end; i++) {
            let i_in_24 = i;
            if (!config.timePicker24Hour) {
                i_in_24 = selected.hour() >= 12 ? (i === 12 ? 12 : i + 12) : (i === 12 ? 0 : i);
            }
            const time = selected.clone().hour(i_in_24);
            const disabled = (minDate !== false && time.minute(59).isBefore(minDate)) ||
                (maxDate !== false && time.minute(0).isAfter(maxDate));
            hours.push({ value: i, label: String(i), disabled });
        }
        const minutes = [];
        const increment = config.timePickerIncrement ?? 1;
        for (let i = 0; i < 60; i += increment) {
            const time = selected.clone().minute(i);
            const disabled = (minDate !== false && time.second(59).isBefore(minDate)) ||
                (maxDate !== false && time.second(0).isAfter(maxDate));
            minutes.push({ value: i, label: i < 10 ? `0${i}` : String(i), disabled });
        }
        const seconds = [];
        if (config.timePickerSeconds) {
            for (let i = 0; i < 60; i++) {
                const time = selected.clone().second(i);
                const disabled = (minDate !== false && time.isBefore(minDate)) ||
                    (maxDate !== false && time.isAfter(maxDate));
                seconds.push({ value: i, label: i < 10 ? `0${i}` : String(i), disabled });
            }
        }
        const ampmDisabledAM = minDate !== false && selected.clone().hour(12).minute(0).second(0).isBefore(minDate);
        const ampmDisabledPM = maxDate !== false && selected.clone().hour(0).minute(0).second(0).isAfter(maxDate);
        const selectedAmpm = selected.hour() >= 12 ? 'PM' : 'AM';
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.5", ngImport: i0, type: DatePickerService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "21.2.5", ngImport: i0, type: DatePickerService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.5", ngImport: i0, type: DatePickerService, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [] });

class CalendarHeader {
    side;
    calendarState;
    locale;
    showDropdowns = false;
    showWeekNumbers = false;
    showISOWeekNumbers = false;
    linkedCalendars = true;
    singleDatePicker = false;
    minDate = false;
    maxDate = false;
    minYear = 1924;
    maxYear = 2124;
    prevClicked = new EventEmitter();
    nextClicked = new EventEmitter();
    monthYearChanged = new EventEmitter();
    get currentMonth() {
        return this.calendarState.calendar[1][1].date.month();
    }
    get currentYear() {
        return this.calendarState.calendar[1][1].date.year();
    }
    get monthLabel() {
        return this.locale.monthNames[this.currentMonth] + this.calendarState.calendar[1][1].date.format(' YYYY');
    }
    get effectiveMinYear() {
        return (this.minDate && this.minDate.year()) || this.minYear;
    }
    get effectiveMaxYear() {
        return (this.maxDate && this.maxDate.year()) || this.maxYear;
    }
    get showPrev() {
        const minDate = this.minDate;
        return (!minDate || minDate.isBefore(this.calendarState.firstDay)) &&
            (!this.linkedCalendars || this.side === 'left');
    }
    get showNext() {
        const maxDate = this.maxDate;
        return (!maxDate || maxDate.isAfter(this.calendarState.lastDay)) &&
            (!this.linkedCalendars || this.side === 'right' || this.singleDatePicker);
    }
    isMonthDisabled(m) {
        const inMinYear = this.currentYear === this.effectiveMinYear;
        const inMaxYear = this.currentYear === this.effectiveMaxYear;
        if (inMinYear && this.minDate && m < this.minDate.month())
            return true;
        if (inMaxYear && this.maxDate && m > this.maxDate.month())
            return true;
        return false;
    }
    getYears() {
        const years = [];
        for (let y = this.effectiveMinYear; y <= this.effectiveMaxYear; y++)
            years.push(y);
        return years;
    }
    onMonthChange(month) {
        this.monthYearChanged.emit({ side: this.side, month: +month, year: this.currentYear });
    }
    onYearChange(year) {
        this.monthYearChanged.emit({ side: this.side, month: this.currentMonth, year: +year });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.5", ngImport: i0, type: CalendarHeader, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "21.2.5", type: CalendarHeader, isStandalone: true, selector: "drp-calendar-header", inputs: { side: "side", calendarState: "calendarState", locale: "locale", showDropdowns: "showDropdowns", showWeekNumbers: "showWeekNumbers", showISOWeekNumbers: "showISOWeekNumbers", linkedCalendars: "linkedCalendars", singleDatePicker: "singleDatePicker", minDate: "minDate", maxDate: "maxDate", minYear: "minYear", maxYear: "maxYear" }, outputs: { prevClicked: "prevClicked", nextClicked: "nextClicked", monthYearChanged: "monthYearChanged" }, ngImport: i0, template: "<table class=\"table-condensed\">\n  <thead>\n    <tr>\n      @if (showWeekNumbers || showISOWeekNumbers) {\n        <th></th>\n      }\n      @if (showPrev) {\n        <th class=\"prev available\" (click)=\"prevClicked.emit(side)\">\n          <span></span>\n        </th>\n      } @else {\n        <th></th>\n      }\n      <th colspan=\"5\" class=\"month\">\n        @if (showDropdowns) {\n          <select class=\"monthselect\"\n            [ngModel]=\"currentMonth\"\n            (ngModelChange)=\"onMonthChange($event)\">\n            @for (m of [0,1,2,3,4,5,6,7,8,9,10,11]; track m) {\n              <option [value]=\"m\" [disabled]=\"isMonthDisabled(m)\">{{ locale.monthNames[m] }}</option>\n            }\n          </select>\n          <select class=\"yearselect\"\n            [ngModel]=\"currentYear\"\n            (ngModelChange)=\"onYearChange($event)\">\n            @for (y of getYears(); track y) {\n              <option [value]=\"y\">{{ y }}</option>\n            }\n          </select>\n        } @else {\n          {{ monthLabel }}\n        }\n      </th>\n      @if (showNext) {\n        <th class=\"next available\" (click)=\"nextClicked.emit(side)\">\n          <span></span>\n        </th>\n      } @else {\n        <th></th>\n      }\n    </tr>\n    <tr>\n      @if (showWeekNumbers || showISOWeekNumbers) {\n        <th class=\"week\">{{ locale.weekLabel }}</th>\n      }\n      @for (day of locale.daysOfWeek; track day) {\n        <th>{{ day }}</th>\n      }\n    </tr>\n  </thead>\n</table>\n", styles: [""], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "ngmodule", type: FormsModule }, { kind: "directive", type: i1.NgSelectOption, selector: "option", inputs: ["ngValue", "value"] }, { kind: "directive", type: i1.ɵNgSelectMultipleOption, selector: "option", inputs: ["ngValue", "value"] }, { kind: "directive", type: i1.SelectControlValueAccessor, selector: "select:not([multiple])[formControlName],select:not([multiple])[formControl],select:not([multiple])[ngModel]", inputs: ["compareWith"] }, { kind: "directive", type: i1.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { kind: "directive", type: i1.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.5", ngImport: i0, type: CalendarHeader, decorators: [{
            type: Component,
            args: [{ selector: 'drp-calendar-header', standalone: true, imports: [CommonModule, FormsModule], template: "<table class=\"table-condensed\">\n  <thead>\n    <tr>\n      @if (showWeekNumbers || showISOWeekNumbers) {\n        <th></th>\n      }\n      @if (showPrev) {\n        <th class=\"prev available\" (click)=\"prevClicked.emit(side)\">\n          <span></span>\n        </th>\n      } @else {\n        <th></th>\n      }\n      <th colspan=\"5\" class=\"month\">\n        @if (showDropdowns) {\n          <select class=\"monthselect\"\n            [ngModel]=\"currentMonth\"\n            (ngModelChange)=\"onMonthChange($event)\">\n            @for (m of [0,1,2,3,4,5,6,7,8,9,10,11]; track m) {\n              <option [value]=\"m\" [disabled]=\"isMonthDisabled(m)\">{{ locale.monthNames[m] }}</option>\n            }\n          </select>\n          <select class=\"yearselect\"\n            [ngModel]=\"currentYear\"\n            (ngModelChange)=\"onYearChange($event)\">\n            @for (y of getYears(); track y) {\n              <option [value]=\"y\">{{ y }}</option>\n            }\n          </select>\n        } @else {\n          {{ monthLabel }}\n        }\n      </th>\n      @if (showNext) {\n        <th class=\"next available\" (click)=\"nextClicked.emit(side)\">\n          <span></span>\n        </th>\n      } @else {\n        <th></th>\n      }\n    </tr>\n    <tr>\n      @if (showWeekNumbers || showISOWeekNumbers) {\n        <th class=\"week\">{{ locale.weekLabel }}</th>\n      }\n      @for (day of locale.daysOfWeek; track day) {\n        <th>{{ day }}</th>\n      }\n    </tr>\n  </thead>\n</table>\n" }]
        }], propDecorators: { side: [{
                type: Input,
                args: [{ required: true }]
            }], calendarState: [{
                type: Input,
                args: [{ required: true }]
            }], locale: [{
                type: Input,
                args: [{ required: true }]
            }], showDropdowns: [{
                type: Input
            }], showWeekNumbers: [{
                type: Input
            }], showISOWeekNumbers: [{
                type: Input
            }], linkedCalendars: [{
                type: Input
            }], singleDatePicker: [{
                type: Input
            }], minDate: [{
                type: Input
            }], maxDate: [{
                type: Input
            }], minYear: [{
                type: Input
            }], maxYear: [{
                type: Input
            }], prevClicked: [{
                type: Output
            }], nextClicked: [{
                type: Output
            }], monthYearChanged: [{
                type: Output
            }] } });

class CalendarGrid {
    side;
    calendarState;
    showWeekNumbers = false;
    showISOWeekNumbers = false;
    hoverDate = null;
    startDate = null;
    endDate = null;
    dateClicked = new EventEmitter();
    dateHovered = new EventEmitter();
    ngOnChanges() { }
    getCellClasses(cell) {
        const result = {};
        for (const cls of cell.classes) {
            result[cls] = true;
        }
        // hover in-range: when no endDate yet, highlight between start and hover
        if (!this.endDate && this.hoverDate && this.startDate && cell.isAvailable) {
            const afterStart = cell.date.isAfter(this.startDate);
            const beforeHover = cell.date.isBefore(this.hoverDate);
            const sameAsHover = cell.date.isSame(this.hoverDate, 'day');
            if (afterStart && (beforeHover || sameAsHover)) {
                result['in-range'] = true;
            }
        }
        return result;
    }
    onCellMousedown(cell, event) {
        event.stopPropagation();
        if (!cell.isAvailable)
            return;
        this.dateClicked.emit({ cell, side: this.side });
    }
    onCellMouseenter(cell) {
        if (!cell.isAvailable)
            return;
        this.dateHovered.emit({ cell, side: this.side });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.5", ngImport: i0, type: CalendarGrid, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "21.2.5", type: CalendarGrid, isStandalone: true, selector: "drp-calendar-grid", inputs: { side: "side", calendarState: "calendarState", showWeekNumbers: "showWeekNumbers", showISOWeekNumbers: "showISOWeekNumbers", hoverDate: "hoverDate", startDate: "startDate", endDate: "endDate" }, outputs: { dateClicked: "dateClicked", dateHovered: "dateHovered" }, usesOnChanges: true, ngImport: i0, template: "<table class=\"table-condensed\">\n  <tbody>\n    @for (row of calendarState.calendar; track $index) {\n      <tr>\n        @if (showWeekNumbers) {\n          <td class=\"week\">{{ row[0].date.week() }}</td>\n        }\n        @if (showISOWeekNumbers) {\n          <td class=\"week\">{{ row[0].date.isoWeek() }}</td>\n        }\n        @for (cell of row; track cell.col) {\n          <td\n            [ngClass]=\"getCellClasses(cell)\"\n            [attr.data-title]=\"'r' + cell.row + 'c' + cell.col\"\n            (mousedown)=\"onCellMousedown(cell, $event)\"\n            (mouseenter)=\"onCellMouseenter(cell)\">{{ cell.dayNumber }}</td>\n        }\n      </tr>\n    }\n  </tbody>\n</table>\n", styles: [""], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "directive", type: i2.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.5", ngImport: i0, type: CalendarGrid, decorators: [{
            type: Component,
            args: [{ selector: 'drp-calendar-grid', standalone: true, imports: [CommonModule], template: "<table class=\"table-condensed\">\n  <tbody>\n    @for (row of calendarState.calendar; track $index) {\n      <tr>\n        @if (showWeekNumbers) {\n          <td class=\"week\">{{ row[0].date.week() }}</td>\n        }\n        @if (showISOWeekNumbers) {\n          <td class=\"week\">{{ row[0].date.isoWeek() }}</td>\n        }\n        @for (cell of row; track cell.col) {\n          <td\n            [ngClass]=\"getCellClasses(cell)\"\n            [attr.data-title]=\"'r' + cell.row + 'c' + cell.col\"\n            (mousedown)=\"onCellMousedown(cell, $event)\"\n            (mouseenter)=\"onCellMouseenter(cell)\">{{ cell.dayNumber }}</td>\n        }\n      </tr>\n    }\n  </tbody>\n</table>\n" }]
        }], propDecorators: { side: [{
                type: Input,
                args: [{ required: true }]
            }], calendarState: [{
                type: Input,
                args: [{ required: true }]
            }], showWeekNumbers: [{
                type: Input
            }], showISOWeekNumbers: [{
                type: Input
            }], hoverDate: [{
                type: Input
            }], startDate: [{
                type: Input
            }], endDate: [{
                type: Input
            }], dateClicked: [{
                type: Output
            }], dateHovered: [{
                type: Output
            }] } });

class TimePicker {
    side;
    state;
    disabled = false;
    timePicker24Hour = false;
    timePickerSeconds = false;
    timeChanged = new EventEmitter();
    selectedHour;
    selectedMinute;
    selectedSecond = 0;
    selectedAmpm = 'AM';
    ngOnChanges() {
        if (this.state) {
            this.selectedHour = this.state.selectedHour;
            this.selectedMinute = this.state.selectedMinute;
            this.selectedSecond = this.state.selectedSecond;
            this.selectedAmpm = this.state.selectedAmpm;
        }
    }
    emitChange() {
        this.timeChanged.emit({
            side: this.side,
            hour: this.selectedHour,
            minute: this.selectedMinute,
            second: this.selectedSecond,
            ampm: this.selectedAmpm,
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.5", ngImport: i0, type: TimePicker, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "21.2.5", type: TimePicker, isStandalone: true, selector: "drp-time-picker", inputs: { side: "side", state: "state", disabled: "disabled", timePicker24Hour: "timePicker24Hour", timePickerSeconds: "timePickerSeconds" }, outputs: { timeChanged: "timeChanged" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"calendar-time\">\n  <select class=\"hourselect\" [disabled]=\"disabled\"\n    [(ngModel)]=\"selectedHour\" (change)=\"emitChange()\">\n    @for (opt of state.hours; track opt.value) {\n      <option [value]=\"opt.value\" [disabled]=\"opt.disabled\">{{ opt.label }}</option>\n    }\n  </select>\n  :\n  <select class=\"minuteselect\" [disabled]=\"disabled\"\n    [(ngModel)]=\"selectedMinute\" (change)=\"emitChange()\">\n    @for (opt of state.minutes; track opt.value) {\n      <option [value]=\"opt.value\" [disabled]=\"opt.disabled\">{{ opt.label }}</option>\n    }\n  </select>\n  @if (timePickerSeconds) {\n    :\n    <select class=\"secondselect\" [disabled]=\"disabled\"\n      [(ngModel)]=\"selectedSecond\" (change)=\"emitChange()\">\n      @for (opt of state.seconds; track opt.value) {\n        <option [value]=\"opt.value\" [disabled]=\"opt.disabled\">{{ opt.label }}</option>\n      }\n    </select>\n  }\n  @if (!timePicker24Hour) {\n    <select class=\"ampmselect\" [disabled]=\"disabled\"\n      [(ngModel)]=\"selectedAmpm\" (change)=\"emitChange()\">\n      <option value=\"AM\" [disabled]=\"state.ampmDisabledAM\">AM</option>\n      <option value=\"PM\" [disabled]=\"state.ampmDisabledPM\">PM</option>\n    </select>\n  }\n</div>\n", styles: [""], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "ngmodule", type: FormsModule }, { kind: "directive", type: i1.NgSelectOption, selector: "option", inputs: ["ngValue", "value"] }, { kind: "directive", type: i1.ɵNgSelectMultipleOption, selector: "option", inputs: ["ngValue", "value"] }, { kind: "directive", type: i1.SelectControlValueAccessor, selector: "select:not([multiple])[formControlName],select:not([multiple])[formControl],select:not([multiple])[ngModel]", inputs: ["compareWith"] }, { kind: "directive", type: i1.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { kind: "directive", type: i1.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.5", ngImport: i0, type: TimePicker, decorators: [{
            type: Component,
            args: [{ selector: 'drp-time-picker', standalone: true, imports: [CommonModule, FormsModule], template: "<div class=\"calendar-time\">\n  <select class=\"hourselect\" [disabled]=\"disabled\"\n    [(ngModel)]=\"selectedHour\" (change)=\"emitChange()\">\n    @for (opt of state.hours; track opt.value) {\n      <option [value]=\"opt.value\" [disabled]=\"opt.disabled\">{{ opt.label }}</option>\n    }\n  </select>\n  :\n  <select class=\"minuteselect\" [disabled]=\"disabled\"\n    [(ngModel)]=\"selectedMinute\" (change)=\"emitChange()\">\n    @for (opt of state.minutes; track opt.value) {\n      <option [value]=\"opt.value\" [disabled]=\"opt.disabled\">{{ opt.label }}</option>\n    }\n  </select>\n  @if (timePickerSeconds) {\n    :\n    <select class=\"secondselect\" [disabled]=\"disabled\"\n      [(ngModel)]=\"selectedSecond\" (change)=\"emitChange()\">\n      @for (opt of state.seconds; track opt.value) {\n        <option [value]=\"opt.value\" [disabled]=\"opt.disabled\">{{ opt.label }}</option>\n      }\n    </select>\n  }\n  @if (!timePicker24Hour) {\n    <select class=\"ampmselect\" [disabled]=\"disabled\"\n      [(ngModel)]=\"selectedAmpm\" (change)=\"emitChange()\">\n      <option value=\"AM\" [disabled]=\"state.ampmDisabledAM\">AM</option>\n      <option value=\"PM\" [disabled]=\"state.ampmDisabledPM\">PM</option>\n    </select>\n  }\n</div>\n" }]
        }], propDecorators: { side: [{
                type: Input,
                args: [{ required: true }]
            }], state: [{
                type: Input,
                args: [{ required: true }]
            }], disabled: [{
                type: Input
            }], timePicker24Hour: [{
                type: Input
            }], timePickerSeconds: [{
                type: Input
            }], timeChanged: [{
                type: Output
            }] } });

class DrpCalendar {
    side;
    calendarState;
    locale;
    timePicker = false;
    timePicker24Hour = false;
    timePickerSeconds = false;
    timePickerState;
    timePickerDisabled = false;
    showDropdowns = false;
    showWeekNumbers = false;
    showISOWeekNumbers = false;
    linkedCalendars = true;
    singleDatePicker = false;
    minDate = false;
    maxDate = false;
    minYear = 1924;
    maxYear = 2124;
    hoverDate = null;
    startDate = null;
    endDate = null;
    prevClicked = new EventEmitter();
    nextClicked = new EventEmitter();
    monthYearChanged = new EventEmitter();
    dateClicked = new EventEmitter();
    dateHovered = new EventEmitter();
    timeChanged = new EventEmitter();
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.5", ngImport: i0, type: DrpCalendar, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "21.2.5", type: DrpCalendar, isStandalone: true, selector: "drp-calendar", inputs: { side: "side", calendarState: "calendarState", locale: "locale", timePicker: "timePicker", timePicker24Hour: "timePicker24Hour", timePickerSeconds: "timePickerSeconds", timePickerState: "timePickerState", timePickerDisabled: "timePickerDisabled", showDropdowns: "showDropdowns", showWeekNumbers: "showWeekNumbers", showISOWeekNumbers: "showISOWeekNumbers", linkedCalendars: "linkedCalendars", singleDatePicker: "singleDatePicker", minDate: "minDate", maxDate: "maxDate", minYear: "minYear", maxYear: "maxYear", hoverDate: "hoverDate", startDate: "startDate", endDate: "endDate" }, outputs: { prevClicked: "prevClicked", nextClicked: "nextClicked", monthYearChanged: "monthYearChanged", dateClicked: "dateClicked", dateHovered: "dateHovered", timeChanged: "timeChanged" }, ngImport: i0, template: "<div class=\"drp-calendar\" [class.left]=\"side === 'left'\" [class.right]=\"side === 'right'\">\n  <div class=\"calendar-table\">\n    <drp-calendar-header\n      [side]=\"side\"\n      [calendarState]=\"calendarState\"\n      [locale]=\"locale\"\n      [showDropdowns]=\"showDropdowns\"\n      [showWeekNumbers]=\"showWeekNumbers\"\n      [showISOWeekNumbers]=\"showISOWeekNumbers\"\n      [linkedCalendars]=\"linkedCalendars\"\n      [singleDatePicker]=\"singleDatePicker\"\n      [minDate]=\"minDate\"\n      [maxDate]=\"maxDate\"\n      [minYear]=\"minYear\"\n      [maxYear]=\"maxYear\"\n      (prevClicked)=\"prevClicked.emit($event)\"\n      (nextClicked)=\"nextClicked.emit($event)\"\n      (monthYearChanged)=\"monthYearChanged.emit($event)\">\n    </drp-calendar-header>\n    <drp-calendar-grid\n      [side]=\"side\"\n      [calendarState]=\"calendarState\"\n      [showWeekNumbers]=\"showWeekNumbers\"\n      [showISOWeekNumbers]=\"showISOWeekNumbers\"\n      [hoverDate]=\"hoverDate\"\n      [startDate]=\"startDate\"\n      [endDate]=\"endDate\"\n      (dateClicked)=\"dateClicked.emit($event)\"\n      (dateHovered)=\"dateHovered.emit($event)\">\n    </drp-calendar-grid>\n  </div>\n  @if (timePicker && timePickerState) {\n    <drp-time-picker\n      [side]=\"side\"\n      [state]=\"timePickerState\"\n      [disabled]=\"timePickerDisabled\"\n      [timePicker24Hour]=\"timePicker24Hour\"\n      [timePickerSeconds]=\"timePickerSeconds\"\n      (timeChanged)=\"timeChanged.emit($event)\">\n    </drp-time-picker>\n  }\n</div>\n", styles: [""], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "component", type: CalendarHeader, selector: "drp-calendar-header", inputs: ["side", "calendarState", "locale", "showDropdowns", "showWeekNumbers", "showISOWeekNumbers", "linkedCalendars", "singleDatePicker", "minDate", "maxDate", "minYear", "maxYear"], outputs: ["prevClicked", "nextClicked", "monthYearChanged"] }, { kind: "component", type: CalendarGrid, selector: "drp-calendar-grid", inputs: ["side", "calendarState", "showWeekNumbers", "showISOWeekNumbers", "hoverDate", "startDate", "endDate"], outputs: ["dateClicked", "dateHovered"] }, { kind: "component", type: TimePicker, selector: "drp-time-picker", inputs: ["side", "state", "disabled", "timePicker24Hour", "timePickerSeconds"], outputs: ["timeChanged"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.5", ngImport: i0, type: DrpCalendar, decorators: [{
            type: Component,
            args: [{ selector: 'drp-calendar', standalone: true, imports: [CommonModule, CalendarHeader, CalendarGrid, TimePicker], template: "<div class=\"drp-calendar\" [class.left]=\"side === 'left'\" [class.right]=\"side === 'right'\">\n  <div class=\"calendar-table\">\n    <drp-calendar-header\n      [side]=\"side\"\n      [calendarState]=\"calendarState\"\n      [locale]=\"locale\"\n      [showDropdowns]=\"showDropdowns\"\n      [showWeekNumbers]=\"showWeekNumbers\"\n      [showISOWeekNumbers]=\"showISOWeekNumbers\"\n      [linkedCalendars]=\"linkedCalendars\"\n      [singleDatePicker]=\"singleDatePicker\"\n      [minDate]=\"minDate\"\n      [maxDate]=\"maxDate\"\n      [minYear]=\"minYear\"\n      [maxYear]=\"maxYear\"\n      (prevClicked)=\"prevClicked.emit($event)\"\n      (nextClicked)=\"nextClicked.emit($event)\"\n      (monthYearChanged)=\"monthYearChanged.emit($event)\">\n    </drp-calendar-header>\n    <drp-calendar-grid\n      [side]=\"side\"\n      [calendarState]=\"calendarState\"\n      [showWeekNumbers]=\"showWeekNumbers\"\n      [showISOWeekNumbers]=\"showISOWeekNumbers\"\n      [hoverDate]=\"hoverDate\"\n      [startDate]=\"startDate\"\n      [endDate]=\"endDate\"\n      (dateClicked)=\"dateClicked.emit($event)\"\n      (dateHovered)=\"dateHovered.emit($event)\">\n    </drp-calendar-grid>\n  </div>\n  @if (timePicker && timePickerState) {\n    <drp-time-picker\n      [side]=\"side\"\n      [state]=\"timePickerState\"\n      [disabled]=\"timePickerDisabled\"\n      [timePicker24Hour]=\"timePicker24Hour\"\n      [timePickerSeconds]=\"timePickerSeconds\"\n      (timeChanged)=\"timeChanged.emit($event)\">\n    </drp-time-picker>\n  }\n</div>\n" }]
        }], propDecorators: { side: [{
                type: Input,
                args: [{ required: true }]
            }], calendarState: [{
                type: Input,
                args: [{ required: true }]
            }], locale: [{
                type: Input,
                args: [{ required: true }]
            }], timePicker: [{
                type: Input
            }], timePicker24Hour: [{
                type: Input
            }], timePickerSeconds: [{
                type: Input
            }], timePickerState: [{
                type: Input
            }], timePickerDisabled: [{
                type: Input
            }], showDropdowns: [{
                type: Input
            }], showWeekNumbers: [{
                type: Input
            }], showISOWeekNumbers: [{
                type: Input
            }], linkedCalendars: [{
                type: Input
            }], singleDatePicker: [{
                type: Input
            }], minDate: [{
                type: Input
            }], maxDate: [{
                type: Input
            }], minYear: [{
                type: Input
            }], maxYear: [{
                type: Input
            }], hoverDate: [{
                type: Input
            }], startDate: [{
                type: Input
            }], endDate: [{
                type: Input
            }], prevClicked: [{
                type: Output
            }], nextClicked: [{
                type: Output
            }], monthYearChanged: [{
                type: Output
            }], dateClicked: [{
                type: Output
            }], dateHovered: [{
                type: Output
            }], timeChanged: [{
                type: Output
            }] } });

class Ranges {
    ranges = [];
    showCustomRangeLabel = true;
    customRangeLabel = 'Custom Range';
    chosenLabel = null;
    rangeClicked = new EventEmitter();
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.5", ngImport: i0, type: Ranges, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "21.2.5", type: Ranges, isStandalone: true, selector: "drp-ranges", inputs: { ranges: "ranges", showCustomRangeLabel: "showCustomRangeLabel", customRangeLabel: "customRangeLabel", chosenLabel: "chosenLabel" }, outputs: { rangeClicked: "rangeClicked" }, ngImport: i0, template: "<ul>\n  @for (range of ranges; track range.key) {\n    <li\n      [class.active]=\"range.key === chosenLabel\"\n      [attr.data-range-key]=\"range.key\"\n      (click)=\"rangeClicked.emit(range)\">{{ range.label }}</li>\n  }\n  @if (showCustomRangeLabel) {\n    <li\n      [class.active]=\"chosenLabel === customRangeLabel\"\n      [attr.data-range-key]=\"customRangeLabel\"\n      (click)=\"rangeClicked.emit(null)\">{{ customRangeLabel }}</li>\n  }\n</ul>\n", styles: [""], dependencies: [{ kind: "ngmodule", type: CommonModule }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.5", ngImport: i0, type: Ranges, decorators: [{
            type: Component,
            args: [{ selector: 'drp-ranges', standalone: true, imports: [CommonModule], template: "<ul>\n  @for (range of ranges; track range.key) {\n    <li\n      [class.active]=\"range.key === chosenLabel\"\n      [attr.data-range-key]=\"range.key\"\n      (click)=\"rangeClicked.emit(range)\">{{ range.label }}</li>\n  }\n  @if (showCustomRangeLabel) {\n    <li\n      [class.active]=\"chosenLabel === customRangeLabel\"\n      [attr.data-range-key]=\"customRangeLabel\"\n      (click)=\"rangeClicked.emit(null)\">{{ customRangeLabel }}</li>\n  }\n</ul>\n" }]
        }], propDecorators: { ranges: [{
                type: Input
            }], showCustomRangeLabel: [{
                type: Input
            }], customRangeLabel: [{
                type: Input
            }], chosenLabel: [{
                type: Input
            }], rangeClicked: [{
                type: Output
            }] } });

class Buttons {
    selectedText = '';
    applyDisabled = true;
    applyLabel = 'Apply';
    cancelLabel = 'Cancel';
    buttonClasses = 'btn btn-sm';
    applyButtonClasses = 'btn-primary';
    cancelButtonClasses = 'btn-default';
    applyClicked = new EventEmitter();
    cancelClicked = new EventEmitter();
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.5", ngImport: i0, type: Buttons, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "21.2.5", type: Buttons, isStandalone: true, selector: "drp-buttons", inputs: { selectedText: "selectedText", applyDisabled: "applyDisabled", applyLabel: "applyLabel", cancelLabel: "cancelLabel", buttonClasses: "buttonClasses", applyButtonClasses: "applyButtonClasses", cancelButtonClasses: "cancelButtonClasses" }, outputs: { applyClicked: "applyClicked", cancelClicked: "cancelClicked" }, ngImport: i0, template: "<div class=\"drp-buttons\">\n  <span class=\"drp-selected\">{{ selectedText }}</span>\n  <button\n    [class]=\"buttonClasses + ' cancelBtn ' + cancelButtonClasses\"\n    type=\"button\"\n    (click)=\"cancelClicked.emit()\">{{ cancelLabel }}</button>\n  <button\n    [class]=\"buttonClasses + ' applyBtn ' + applyButtonClasses\"\n    type=\"button\"\n    [disabled]=\"applyDisabled\"\n    (click)=\"applyClicked.emit()\">{{ applyLabel }}</button>\n</div>\n", styles: [""], dependencies: [{ kind: "ngmodule", type: CommonModule }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.5", ngImport: i0, type: Buttons, decorators: [{
            type: Component,
            args: [{ selector: 'drp-buttons', standalone: true, imports: [CommonModule], template: "<div class=\"drp-buttons\">\n  <span class=\"drp-selected\">{{ selectedText }}</span>\n  <button\n    [class]=\"buttonClasses + ' cancelBtn ' + cancelButtonClasses\"\n    type=\"button\"\n    (click)=\"cancelClicked.emit()\">{{ cancelLabel }}</button>\n  <button\n    [class]=\"buttonClasses + ' applyBtn ' + applyButtonClasses\"\n    type=\"button\"\n    [disabled]=\"applyDisabled\"\n    (click)=\"applyClicked.emit()\">{{ applyLabel }}</button>\n</div>\n" }]
        }], propDecorators: { selectedText: [{
                type: Input
            }], applyDisabled: [{
                type: Input
            }], applyLabel: [{
                type: Input
            }], cancelLabel: [{
                type: Input
            }], buttonClasses: [{
                type: Input
            }], applyButtonClasses: [{
                type: Input
            }], cancelButtonClasses: [{
                type: Input
            }], applyClicked: [{
                type: Output
            }], cancelClicked: [{
                type: Output
            }] } });

class DateRangePickerComponent {
    svc;
    // ── Inputs ───────────────────────────────────────────────────────────────
    startDate;
    endDate;
    minDate;
    maxDate;
    maxSpan;
    singleDatePicker = false;
    autoApply = false;
    showDropdowns = false;
    minYear;
    maxYear;
    showWeekNumbers = false;
    showISOWeekNumbers = false;
    showCustomRangeLabel = true;
    timePicker = false;
    timePicker24Hour = false;
    timePickerIncrement = 1;
    timePickerSeconds = false;
    linkedCalendars = true;
    autoUpdateInput = true;
    alwaysShowCalendars = false;
    ranges;
    opens = 'right';
    drops = 'down';
    buttonClasses = 'btn btn-sm';
    applyButtonClasses = 'btn-primary';
    cancelButtonClasses = 'btn-default';
    locale;
    isInvalidDate;
    isCustomDate;
    // ── Outputs ──────────────────────────────────────────────────────────────
    apply = new EventEmitter();
    cancel = new EventEmitter();
    showPicker = new EventEmitter();
    hidePicker = new EventEmitter();
    showCalendarEvent = new EventEmitter();
    hideCalendarEvent = new EventEmitter();
    rangeSelected = new EventEmitter();
    // ── ViewChild refs ────────────────────────────────────────────────────────
    pickerPanelRef;
    triggerElRef;
    // ── Internal state ────────────────────────────────────────────────────────
    isShowing = false;
    showCalendarsPanel = false;
    resolvedLocale;
    internalStartDate;
    internalEndDate;
    oldStartDate;
    oldEndDate;
    leftCalendarState;
    rightCalendarState;
    leftTimePickerState;
    rightTimePickerState;
    builtRanges = [];
    chosenLabel = null;
    hoverDate = null;
    positionStyles = { top: '0', left: '0' };
    isApplyDisabled = true;
    isDropUp = false;
    selectedText = '';
    resolvedMinDate = false;
    resolvedMaxDate = false;
    effectiveMinYear = 1924;
    effectiveMaxYear = 2124;
    previousRightTime;
    config;
    renderer;
    constructor(svc, rendererFactory) {
        this.svc = svc;
        this.renderer = rendererFactory.createRenderer(null, null);
    }
    ngOnInit() {
        this.initConfig();
        this.updateView();
    }
    ngOnChanges(changes) {
        if (Object.keys(changes).length) {
            this.initConfig();
            this.updateView();
        }
    }
    ngAfterViewInit() {
        if (this.pickerPanelRef) {
            this.renderer.appendChild(document.body, this.pickerPanelRef.nativeElement);
        }
    }
    ngOnDestroy() {
        if (this.pickerPanelRef?.nativeElement?.parentNode) {
            this.renderer.removeChild(document.body, this.pickerPanelRef.nativeElement);
        }
    }
    // ── Initialization ────────────────────────────────────────────────────────
    initConfig() {
        this.config = {
            minDate: this.minDate,
            maxDate: this.maxDate,
            maxSpan: this.maxSpan,
            singleDatePicker: this.singleDatePicker,
            autoApply: this.autoApply,
            showDropdowns: this.showDropdowns,
            minYear: this.minYear,
            maxYear: this.maxYear,
            showWeekNumbers: this.showWeekNumbers,
            showISOWeekNumbers: this.showISOWeekNumbers,
            showCustomRangeLabel: this.showCustomRangeLabel,
            timePicker: this.timePicker,
            timePicker24Hour: this.timePicker24Hour,
            timePickerIncrement: this.timePickerIncrement,
            timePickerSeconds: this.timePickerSeconds,
            linkedCalendars: this.linkedCalendars,
            autoUpdateInput: this.autoUpdateInput,
            alwaysShowCalendars: this.alwaysShowCalendars,
            opens: this.opens,
            drops: this.drops,
            isInvalidDate: this.isInvalidDate,
            isCustomDate: this.isCustomDate,
        };
        this.resolvedLocale = this.svc.buildLocale(this.locale);
        this.resolvedMinDate = this.svc.parseDateInput(this.minDate, this.resolvedLocale.format);
        this.resolvedMaxDate = this.svc.parseDateInput(this.maxDate, this.resolvedLocale.format);
        this.effectiveMinYear = (this.resolvedMinDate && this.resolvedMinDate.year()) || this.minYear || 1924;
        this.effectiveMaxYear = (this.resolvedMaxDate && this.resolvedMaxDate.year()) || this.maxYear || 2124;
        // Parse start/end from inputs (or defaults)
        const parsedStart = this.svc.parseDateInput(this.startDate, this.resolvedLocale.format);
        const parsedEnd = this.svc.parseDateInput(this.endDate, this.resolvedLocale.format);
        const start = parsedStart !== false ? parsedStart : dayjs().startOf('day');
        const end = parsedEnd !== false ? parsedEnd : dayjs().endOf('day');
        this.internalStartDate = this.svc.clampStartDate(start, this.config, this.resolvedLocale);
        if (this.singleDatePicker) {
            this.internalEndDate = this.internalStartDate.clone();
        }
        else {
            this.internalEndDate = this.svc.clampEndDate(end, this.internalStartDate, this.config, this.resolvedLocale);
        }
        if (!this.timePicker) {
            this.internalStartDate = this.internalStartDate.startOf('day');
            if (this.internalEndDate)
                this.internalEndDate = this.internalEndDate.endOf('day');
        }
        // Build ranges
        this.builtRanges = this.ranges
            ? this.svc.buildRanges(this.ranges, this.config, this.resolvedLocale)
            : [];
        // Determine if calendars panel should always be visible
        this.showCalendarsPanel = (this.builtRanges.length === 0 && !this.singleDatePicker) || this.alwaysShowCalendars;
    }
    // ── View update ───────────────────────────────────────────────────────────
    updateView() {
        this.updateMonthsInView();
        this.rebuildCalendars();
        this.updateFormInputs();
        this.updateSelectedText();
        if (this.timePicker)
            this.rebuildTimePickers();
    }
    leftMonthDate;
    rightMonthDate;
    updateMonthsInView() {
        if (!this.leftMonthDate) {
            this.leftMonthDate = this.internalStartDate.clone().date(2);
            this.rightMonthDate = this.internalStartDate.clone().date(2).add(1, 'month');
        }
        if (this.internalEndDate) {
            const startFmt = this.internalStartDate.format('YYYY-MM');
            const endFmt = this.internalEndDate.format('YYYY-MM');
            const leftFmt = this.leftMonthDate.format('YYYY-MM');
            const rightFmt = this.rightMonthDate.format('YYYY-MM');
            if (!this.singleDatePicker &&
                (startFmt === leftFmt || startFmt === rightFmt) &&
                (endFmt === leftFmt || endFmt === rightFmt))
                return;
            this.leftMonthDate = this.internalStartDate.clone().date(2);
            if (!this.linkedCalendars &&
                (this.internalEndDate.month() !== this.internalStartDate.month() ||
                    this.internalEndDate.year() !== this.internalStartDate.year())) {
                this.rightMonthDate = this.internalEndDate.clone().date(2);
            }
            else {
                this.rightMonthDate = this.internalStartDate.clone().date(2).add(1, 'month');
            }
        }
        else {
            if (this.leftMonthDate.format('YYYY-MM') !== this.internalStartDate.format('YYYY-MM') &&
                this.rightMonthDate.format('YYYY-MM') !== this.internalStartDate.format('YYYY-MM')) {
                this.leftMonthDate = this.internalStartDate.clone().date(2);
                this.rightMonthDate = this.internalStartDate.clone().date(2).add(1, 'month');
            }
        }
        if (this.resolvedMaxDate && this.linkedCalendars && !this.singleDatePicker &&
            this.rightMonthDate.isAfter(this.resolvedMaxDate)) {
            this.rightMonthDate = this.resolvedMaxDate.clone().date(2);
            this.leftMonthDate = this.resolvedMaxDate.clone().date(2).subtract(1, 'month');
        }
    }
    rebuildCalendars() {
        this.leftCalendarState = this.svc.buildCalendar(this.leftMonthDate, this.internalStartDate, this.internalEndDate, this.hoverDate, 'left', this.config, this.resolvedLocale);
        this.rightCalendarState = this.svc.buildCalendar(this.rightMonthDate, this.internalStartDate, this.internalEndDate, this.hoverDate, 'right', this.config, this.resolvedLocale);
    }
    rebuildTimePickers() {
        const maxDate = this.resolvedMaxDate;
        let effectiveMax = maxDate;
        if (this.maxSpan && (!maxDate || (this.internalStartDate.clone().add(this.maxSpan).isBefore(maxDate)))) {
            effectiveMax = this.internalStartDate.clone().add(this.maxSpan);
        }
        this.leftTimePickerState = this.svc.buildTimePicker(this.internalStartDate, this.resolvedMinDate, effectiveMax, this.config);
        if (this.internalEndDate) {
            this.rightTimePickerState = this.svc.buildTimePicker(this.internalEndDate, this.internalStartDate, effectiveMax, this.config);
        }
    }
    updateFormInputs() {
        this.isApplyDisabled = !(this.singleDatePicker ||
            (this.internalEndDate &&
                (this.internalStartDate.isBefore(this.internalEndDate) ||
                    this.internalStartDate.isSame(this.internalEndDate))));
    }
    updateSelectedText() {
        if (this.internalEndDate) {
            this.selectedText =
                this.internalStartDate.format(this.resolvedLocale.format) +
                    this.resolvedLocale.separator +
                    this.internalEndDate.format(this.resolvedLocale.format);
        }
        else {
            this.selectedText = this.internalStartDate.format(this.resolvedLocale.format);
        }
    }
    // ── Show / Hide ───────────────────────────────────────────────────────────
    toggle() {
        this.isShowing ? this.hide() : this.show();
    }
    show() {
        if (this.isShowing)
            return;
        this.oldStartDate = this.internalStartDate.clone();
        this.oldEndDate = this.internalEndDate ? this.internalEndDate.clone() : null;
        this.previousRightTime = this.internalEndDate ? this.internalEndDate.clone() : undefined;
        this.updateView();
        this.isShowing = true;
        setTimeout(() => this.move(), 0); // wait for panel to render
        this.showPicker.emit();
    }
    hide() {
        if (!this.isShowing)
            return;
        if (!this.internalEndDate) {
            this.internalStartDate = this.oldStartDate.clone();
            this.internalEndDate = this.oldEndDate ? this.oldEndDate.clone() : null;
        }
        const changed = !this.internalStartDate.isSame(this.oldStartDate) ||
            (this.internalEndDate && !this.internalEndDate.isSame(this.oldEndDate));
        if (changed && this.internalEndDate) {
            this.rangeSelected.emit({
                startDate: this.internalStartDate.clone(),
                endDate: this.internalEndDate.clone(),
                label: this.chosenLabel ?? undefined,
            });
        }
        this.updateSelectedText();
        this.isShowing = false;
        this.hoverDate = null;
        this.hidePicker.emit();
    }
    // ── Positioning ───────────────────────────────────────────────────────────
    move() {
        const trigger = this.triggerElRef?.nativeElement;
        const panel = this.pickerPanelRef?.nativeElement;
        if (!trigger || !panel)
            return;
        const triggerRect = trigger.getBoundingClientRect();
        const panelWidth = panel.offsetWidth;
        const panelHeight = panel.offsetHeight;
        const viewportWidth = window.innerWidth;
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        // Resolve drops direction
        let drops = this.drops;
        if (drops === 'auto') {
            const spaceBelow = window.innerHeight - triggerRect.bottom;
            drops = spaceBelow >= panelHeight ? 'down' : 'up';
        }
        this.isDropUp = drops === 'up';
        let top;
        if (drops === 'up') {
            top = triggerRect.top + scrollY - panelHeight;
        }
        else {
            top = triggerRect.bottom + scrollY;
        }
        let left = 'auto';
        let right = 'auto';
        // Reset panel to measure width
        panel.style.top = '0';
        panel.style.left = '0';
        panel.style.right = 'auto';
        if (this.opens === 'left') {
            const containerRight = viewportWidth - triggerRect.right - scrollX;
            if (panelWidth + containerRight > viewportWidth) {
                left = '9px';
            }
            else {
                right = `${containerRight}px`;
                left = 'auto';
            }
        }
        else if (this.opens === 'center') {
            const containerLeft = triggerRect.left + scrollX - panelWidth / 2 + triggerRect.width / 2;
            if (containerLeft < 0) {
                left = '9px';
            }
            else if (containerLeft + panelWidth > viewportWidth) {
                right = '0';
                left = 'auto';
            }
            else {
                left = `${containerLeft}px`;
            }
        }
        else {
            // right (open to right)
            const containerLeft = triggerRect.left + scrollX;
            if (containerLeft + panelWidth > viewportWidth) {
                right = '0';
                left = 'auto';
            }
            else {
                left = `${containerLeft}px`;
            }
        }
        this.positionStyles = {
            top: `${top}px`,
            left,
            right,
            position: 'absolute',
        };
    }
    // ── Event handlers ────────────────────────────────────────────────────────
    onDocumentMousedown(event) {
        if (!this.isShowing)
            return;
        const target = event.target;
        const panel = this.pickerPanelRef?.nativeElement;
        const trigger = this.triggerElRef?.nativeElement;
        if (panel?.contains(target) || trigger?.contains(target))
            return;
        this.hide();
    }
    onDocumentTouchend(event) {
        if (!this.isShowing)
            return;
        const target = event.target;
        const panel = this.pickerPanelRef?.nativeElement;
        const trigger = this.triggerElRef?.nativeElement;
        if (panel?.contains(target) || trigger?.contains(target))
            return;
        this.hide();
    }
    onWindowResize() {
        if (this.isShowing)
            this.move();
    }
    onKeydown(event) {
        if (event.key === 'Tab' || event.key === 'Enter')
            this.hide();
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.hide();
        }
    }
    // ── Calendar navigation ───────────────────────────────────────────────────
    onPrevClicked(side) {
        if (side === 'left') {
            this.leftMonthDate = this.leftMonthDate.subtract(1, 'month');
            if (this.linkedCalendars)
                this.rightMonthDate = this.rightMonthDate.subtract(1, 'month');
        }
        else {
            this.rightMonthDate = this.rightMonthDate.subtract(1, 'month');
        }
        this.rebuildCalendars();
        if (this.timePicker)
            this.rebuildTimePickers();
        this.move();
    }
    onNextClicked(side) {
        if (side === 'left') {
            this.leftMonthDate = this.leftMonthDate.add(1, 'month');
        }
        else {
            this.rightMonthDate = this.rightMonthDate.add(1, 'month');
            if (this.linkedCalendars)
                this.leftMonthDate = this.leftMonthDate.add(1, 'month');
        }
        this.rebuildCalendars();
        if (this.timePicker)
            this.rebuildTimePickers();
        this.move();
    }
    onMonthYearChanged(event) {
        let { month, year } = event;
        const side = event.side;
        if (side !== 'left') {
            if (year < this.internalStartDate.year() ||
                (year === this.internalStartDate.year() && month < this.internalStartDate.month())) {
                month = this.internalStartDate.month();
                year = this.internalStartDate.year();
            }
        }
        if (this.resolvedMinDate) {
            if (year < this.resolvedMinDate.year() ||
                (year === this.resolvedMinDate.year() && month < this.resolvedMinDate.month())) {
                month = this.resolvedMinDate.month();
                year = this.resolvedMinDate.year();
            }
        }
        if (this.resolvedMaxDate) {
            if (year > this.resolvedMaxDate.year() ||
                (year === this.resolvedMaxDate.year() && month > this.resolvedMaxDate.month())) {
                month = this.resolvedMaxDate.month();
                year = this.resolvedMaxDate.year();
            }
        }
        if (side === 'left') {
            this.leftMonthDate = this.leftMonthDate.month(month).year(year);
            if (this.linkedCalendars)
                this.rightMonthDate = this.leftMonthDate.clone().add(1, 'month');
        }
        else {
            this.rightMonthDate = this.rightMonthDate.month(month).year(year);
            if (this.linkedCalendars)
                this.leftMonthDate = this.rightMonthDate.clone().subtract(1, 'month');
        }
        this.rebuildCalendars();
        if (this.timePicker)
            this.rebuildTimePickers();
    }
    // ── Date click / hover ────────────────────────────────────────────────────
    onDateClicked(event) {
        const { cell } = event;
        const date = cell.date;
        if (this.internalEndDate || date.isBefore(this.internalStartDate, 'day')) {
            // Picking start date
            let newStart = date.clone();
            if (this.timePicker && this.leftTimePickerState) {
                let hour = this.leftTimePickerState.selectedHour;
                const ampm = this.leftTimePickerState.selectedAmpm;
                if (!this.timePicker24Hour) {
                    if (ampm === 'PM' && hour < 12)
                        hour += 12;
                    if (ampm === 'AM' && hour === 12)
                        hour = 0;
                }
                newStart = newStart.hour(hour)
                    .minute(this.leftTimePickerState.selectedMinute)
                    .second(this.leftTimePickerState.selectedSecond);
            }
            this.internalEndDate = null;
            this.internalStartDate = this.svc.clampStartDate(newStart, this.config, this.resolvedLocale);
        }
        else if (!this.internalEndDate && date.isBefore(this.internalStartDate)) {
            this.internalEndDate = this.internalStartDate.clone();
        }
        else {
            // Picking end date
            let newEnd = date.clone();
            if (this.timePicker && this.rightTimePickerState) {
                let hour = this.rightTimePickerState.selectedHour;
                const ampm = this.rightTimePickerState.selectedAmpm;
                if (!this.timePicker24Hour) {
                    if (ampm === 'PM' && hour < 12)
                        hour += 12;
                    if (ampm === 'AM' && hour === 12)
                        hour = 0;
                }
                newEnd = newEnd.hour(hour)
                    .minute(this.rightTimePickerState.selectedMinute)
                    .second(this.rightTimePickerState.selectedSecond);
            }
            this.internalEndDate = this.svc.clampEndDate(newEnd, this.internalStartDate, this.config, this.resolvedLocale);
            if (this.autoApply) {
                this.chosenLabel = this.svc.calculateChosenLabel(this.internalStartDate, this.internalEndDate, this.builtRanges, this.config);
                this.clickApply();
                return;
            }
        }
        if (this.singleDatePicker) {
            this.internalEndDate = this.internalStartDate.clone();
            if (!this.timePicker && this.autoApply) {
                this.clickApply();
                return;
            }
        }
        this.updateView();
    }
    onDateHovered(event) {
        if (!this.internalEndDate) {
            this.hoverDate = event.cell.date;
            this.rebuildCalendars();
        }
    }
    // ── Time change ───────────────────────────────────────────────────────────
    onTimeChanged(event) {
        const { side, hour: rawHour, minute, second, ampm } = event;
        let hour = rawHour;
        if (!this.timePicker24Hour) {
            if (ampm === 'PM' && hour < 12)
                hour += 12;
            if (ampm === 'AM' && hour === 12)
                hour = 0;
        }
        if (side === 'left') {
            const newStart = this.internalStartDate.hour(hour).minute(minute).second(second);
            this.internalStartDate = this.svc.clampStartDate(newStart, this.config, this.resolvedLocale);
            if (this.singleDatePicker) {
                this.internalEndDate = this.internalStartDate.clone();
            }
            else if (this.internalEndDate &&
                this.internalEndDate.format('YYYY-MM-DD') === newStart.format('YYYY-MM-DD') &&
                this.internalEndDate.isBefore(newStart)) {
                this.internalEndDate = this.svc.clampEndDate(newStart.clone(), this.internalStartDate, this.config, this.resolvedLocale);
            }
        }
        else if (this.internalEndDate) {
            const newEnd = this.internalEndDate.hour(hour).minute(minute).second(second);
            this.internalEndDate = this.svc.clampEndDate(newEnd, this.internalStartDate, this.config, this.resolvedLocale);
        }
        this.rebuildCalendars();
        this.updateFormInputs();
        this.rebuildTimePickers();
    }
    // ── Range click ───────────────────────────────────────────────────────────
    onRangeClicked(range) {
        if (range === null) {
            this.showCalendarsPanel = true;
            this.chosenLabel = this.resolvedLocale.customRangeLabel;
            this.move();
            this.showCalendarEvent.emit();
        }
        else {
            this.chosenLabel = range.key;
            this.internalStartDate = range.start.clone();
            this.internalEndDate = range.end.clone();
            if (!this.timePicker) {
                this.internalStartDate = this.internalStartDate.startOf('day');
                this.internalEndDate = this.internalEndDate.endOf('day');
            }
            if (!this.alwaysShowCalendars) {
                this.showCalendarsPanel = false;
                this.hideCalendarEvent.emit();
            }
            this.clickApply();
        }
    }
    // ── Apply / Cancel ────────────────────────────────────────────────────────
    clickApply() {
        const range = {
            startDate: this.internalStartDate.clone(),
            endDate: (this.internalEndDate ?? this.internalStartDate).clone(),
            label: this.chosenLabel ?? undefined,
        };
        this.apply.emit(range);
        this.rangeSelected.emit(range);
        this.hide();
    }
    clickCancel() {
        this.internalStartDate = this.oldStartDate.clone();
        this.internalEndDate = this.oldEndDate ? this.oldEndDate.clone() : null;
        this.cancel.emit();
        this.hide();
    }
    // ── Template helpers ──────────────────────────────────────────────────────
    get showRanges() {
        return this.builtRanges.length > 0;
    }
    get showSingleCalendar() {
        return this.singleDatePicker;
    }
    get pickerClasses() {
        return {
            'daterangepicker': true,
            'single': this.singleDatePicker,
            'show-calendar': this.showCalendarsPanel,
            'show-ranges': this.showRanges,
            'auto-apply': this.autoApply && !this.timePicker,
            'ltr': this.resolvedLocale?.direction === 'ltr',
            'rtl': this.resolvedLocale?.direction === 'rtl',
            'drop-up': this.isDropUp,
            'opensright': this.opens === 'right',
            'opensleft': this.opens === 'left',
            'openscenter': this.opens === 'center',
        };
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.5", ngImport: i0, type: DateRangePickerComponent, deps: [{ token: DatePickerService }, { token: i0.RendererFactory2 }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "21.2.5", type: DateRangePickerComponent, isStandalone: true, selector: "drp-date-range-picker", inputs: { startDate: "startDate", endDate: "endDate", minDate: "minDate", maxDate: "maxDate", maxSpan: "maxSpan", singleDatePicker: "singleDatePicker", autoApply: "autoApply", showDropdowns: "showDropdowns", minYear: "minYear", maxYear: "maxYear", showWeekNumbers: "showWeekNumbers", showISOWeekNumbers: "showISOWeekNumbers", showCustomRangeLabel: "showCustomRangeLabel", timePicker: "timePicker", timePicker24Hour: "timePicker24Hour", timePickerIncrement: "timePickerIncrement", timePickerSeconds: "timePickerSeconds", linkedCalendars: "linkedCalendars", autoUpdateInput: "autoUpdateInput", alwaysShowCalendars: "alwaysShowCalendars", ranges: "ranges", opens: "opens", drops: "drops", buttonClasses: "buttonClasses", applyButtonClasses: "applyButtonClasses", cancelButtonClasses: "cancelButtonClasses", locale: "locale", isInvalidDate: "isInvalidDate", isCustomDate: "isCustomDate" }, outputs: { apply: "apply", cancel: "cancel", showPicker: "showPicker", hidePicker: "hidePicker", showCalendarEvent: "showCalendarEvent", hideCalendarEvent: "hideCalendarEvent", rangeSelected: "rangeSelected" }, host: { listeners: { "document:mousedown": "onDocumentMousedown($event)", "document:touchend": "onDocumentTouchend($event)", "window:resize": "onWindowResize()", "keydown": "onKeydown($event)" } }, viewQueries: [{ propertyName: "pickerPanelRef", first: true, predicate: ["pickerPanel"], descendants: true }, { propertyName: "triggerElRef", first: true, predicate: ["triggerEl"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<!-- Trigger element \u2014 consumers project their own input/button via ng-content -->\n<span #triggerEl (click)=\"toggle()\" (keydown)=\"onKeydown($event)\">\n  <ng-content></ng-content>\n</span>\n\n<!-- Picker panel \u2014 moved to document.body in ngAfterViewInit -->\n<div #pickerPanel\n  [ngClass]=\"pickerClasses\"\n  [ngStyle]=\"positionStyles\"\n  [hidden]=\"!isShowing\">\n\n  @if (showRanges) {\n    <div class=\"ranges\">\n      <drp-ranges\n        [ranges]=\"builtRanges\"\n        [showCustomRangeLabel]=\"showCustomRangeLabel\"\n        [customRangeLabel]=\"resolvedLocale.customRangeLabel\"\n        [chosenLabel]=\"chosenLabel\"\n        (rangeClicked)=\"onRangeClicked($event)\">\n      </drp-ranges>\n    </div>\n  }\n\n  <!-- Left calendar -->\n  <drp-calendar\n    side=\"left\"\n    [calendarState]=\"leftCalendarState\"\n    [locale]=\"resolvedLocale\"\n    [timePicker]=\"timePicker\"\n    [timePicker24Hour]=\"timePicker24Hour\"\n    [timePickerSeconds]=\"timePickerSeconds\"\n    [timePickerState]=\"leftTimePickerState\"\n    [timePickerDisabled]=\"false\"\n    [showDropdowns]=\"showDropdowns\"\n    [showWeekNumbers]=\"showWeekNumbers\"\n    [showISOWeekNumbers]=\"showISOWeekNumbers\"\n    [linkedCalendars]=\"linkedCalendars\"\n    [singleDatePicker]=\"singleDatePicker\"\n    [minDate]=\"resolvedMinDate\"\n    [maxDate]=\"resolvedMaxDate\"\n    [minYear]=\"effectiveMinYear\"\n    [maxYear]=\"effectiveMaxYear\"\n    [hoverDate]=\"hoverDate\"\n    [startDate]=\"internalStartDate\"\n    [endDate]=\"internalEndDate\"\n    (prevClicked)=\"onPrevClicked($event)\"\n    (nextClicked)=\"onNextClicked($event)\"\n    (monthYearChanged)=\"onMonthYearChanged($event)\"\n    (dateClicked)=\"onDateClicked($event)\"\n    (dateHovered)=\"onDateHovered($event)\"\n    (timeChanged)=\"onTimeChanged($event)\">\n  </drp-calendar>\n\n  <!-- Right calendar (hidden when singleDatePicker) -->\n  @if (!singleDatePicker) {\n    <drp-calendar\n      side=\"right\"\n      [calendarState]=\"rightCalendarState\"\n      [locale]=\"resolvedLocale\"\n      [timePicker]=\"timePicker\"\n      [timePicker24Hour]=\"timePicker24Hour\"\n      [timePickerSeconds]=\"timePickerSeconds\"\n      [timePickerState]=\"rightTimePickerState\"\n      [timePickerDisabled]=\"!internalEndDate\"\n      [showDropdowns]=\"showDropdowns\"\n      [showWeekNumbers]=\"showWeekNumbers\"\n      [showISOWeekNumbers]=\"showISOWeekNumbers\"\n      [linkedCalendars]=\"linkedCalendars\"\n      [singleDatePicker]=\"singleDatePicker\"\n      [minDate]=\"resolvedMinDate\"\n      [maxDate]=\"resolvedMaxDate\"\n      [minYear]=\"effectiveMinYear\"\n      [maxYear]=\"effectiveMaxYear\"\n      [hoverDate]=\"hoverDate\"\n      [startDate]=\"internalStartDate\"\n      [endDate]=\"internalEndDate\"\n      (prevClicked)=\"onPrevClicked($event)\"\n      (nextClicked)=\"onNextClicked($event)\"\n      (monthYearChanged)=\"onMonthYearChanged($event)\"\n      (dateClicked)=\"onDateClicked($event)\"\n      (dateHovered)=\"onDateHovered($event)\"\n      (timeChanged)=\"onTimeChanged($event)\">\n    </drp-calendar>\n  }\n\n  <drp-buttons\n    [selectedText]=\"selectedText\"\n    [applyDisabled]=\"isApplyDisabled\"\n    [applyLabel]=\"resolvedLocale.applyLabel\"\n    [cancelLabel]=\"resolvedLocale.cancelLabel\"\n    [buttonClasses]=\"buttonClasses\"\n    [applyButtonClasses]=\"applyButtonClasses\"\n    [cancelButtonClasses]=\"cancelButtonClasses\"\n    (applyClicked)=\"clickApply()\"\n    (cancelClicked)=\"clickCancel()\">\n  </drp-buttons>\n\n</div>\n", styles: [".daterangepicker{position:absolute;color:inherit;background-color:#fff;border-radius:4px;border:1px solid #ddd;width:278px;max-width:none;padding:0;margin-top:7px;top:100px;left:20px;z-index:3001;display:none;font-family:arial;font-size:15px;line-height:1em}.daterangepicker:before,.daterangepicker:after{position:absolute;display:inline-block;border-bottom-color:#0003;content:\"\"}.daterangepicker:before{top:-7px;border-right:7px solid transparent;border-left:7px solid transparent;border-bottom:7px solid #ccc}.daterangepicker:after{top:-6px;border-right:6px solid transparent;border-bottom:6px solid #fff;border-left:6px solid transparent}.daterangepicker.opensleft:before{right:9px}.daterangepicker.opensleft:after{right:10px}.daterangepicker.openscenter:before,.daterangepicker.openscenter:after{left:0;right:0;width:0;margin-left:auto;margin-right:auto}.daterangepicker.opensright:before{left:9px}.daterangepicker.opensright:after{left:10px}.daterangepicker.drop-up{margin-top:-7px}.daterangepicker.drop-up:before{top:initial;bottom:-7px;border-bottom:initial;border-top:7px solid #ccc}.daterangepicker.drop-up:after{top:initial;bottom:-6px;border-bottom:initial;border-top:6px solid #fff}.daterangepicker.single .daterangepicker .ranges,.daterangepicker.single .drp-calendar{float:none}.daterangepicker.single .drp-selected{display:none}.daterangepicker.show-calendar .drp-calendar,.daterangepicker.show-calendar .drp-buttons{display:block}.daterangepicker.auto-apply .drp-buttons{display:none}.daterangepicker .drp-calendar{display:none;max-width:270px}.daterangepicker .drp-calendar.left{padding:8px 0 8px 8px}.daterangepicker .drp-calendar.right{padding:8px}.daterangepicker .drp-calendar.single .calendar-table{border:none}.daterangepicker .calendar-table .next span,.daterangepicker .calendar-table .prev span{color:#fff;border:solid black;border-width:0 2px 2px 0;border-radius:0;display:inline-block;padding:3px}.daterangepicker .calendar-table .next span{transform:rotate(-45deg);-webkit-transform:rotate(-45deg)}.daterangepicker .calendar-table .prev span{transform:rotate(135deg);-webkit-transform:rotate(135deg)}.daterangepicker .calendar-table th,.daterangepicker .calendar-table td{white-space:nowrap;text-align:center;vertical-align:middle;min-width:32px;width:32px;height:24px;line-height:24px;font-size:12px;border-radius:4px;border:1px solid transparent;cursor:pointer}.daterangepicker .calendar-table{border:1px solid #fff;border-radius:4px;background-color:#fff}.daterangepicker .calendar-table table{width:100%;margin:0;border-spacing:0;border-collapse:collapse}.daterangepicker td.available:hover,.daterangepicker th.available:hover{background-color:#eee;border-color:transparent;color:inherit}.daterangepicker td.week,.daterangepicker th.week{font-size:80%;color:#ccc}.daterangepicker td.off,.daterangepicker td.off.in-range,.daterangepicker td.off.start-date,.daterangepicker td.off.end-date{background-color:#fff;border-color:transparent;color:#999}.daterangepicker td.in-range{background-color:#ebf4f8;border-color:transparent;color:#000;border-radius:0}.daterangepicker td.start-date{border-radius:4px 0 0 4px}.daterangepicker td.end-date{border-radius:0 4px 4px 0}.daterangepicker td.start-date.end-date{border-radius:4px}.daterangepicker td.active,.daterangepicker td.active:hover{background-color:#357ebd;border-color:transparent;color:#fff}.daterangepicker th.month{width:auto}.daterangepicker td.disabled,.daterangepicker option.disabled{color:#999;cursor:not-allowed;text-decoration:line-through}.daterangepicker select.monthselect,.daterangepicker select.yearselect{font-size:12px;padding:1px;height:auto;margin:0;cursor:default}.daterangepicker select.monthselect{margin-right:2%;width:56%}.daterangepicker select.yearselect{width:40%}.daterangepicker select.hourselect,.daterangepicker select.minuteselect,.daterangepicker select.secondselect,.daterangepicker select.ampmselect{width:50px;margin:0 auto;background:#eee;border:1px solid #eee;padding:2px;outline:0;font-size:12px}.daterangepicker .calendar-time{text-align:center;margin:4px auto 0;line-height:30px;position:relative}.daterangepicker .calendar-time select.disabled{color:#ccc;cursor:not-allowed}.daterangepicker .drp-buttons{clear:both;text-align:right;padding:8px;border-top:1px solid #ddd;display:none;line-height:12px;vertical-align:middle}.daterangepicker .drp-selected{display:inline-block;font-size:12px;padding-right:8px}.daterangepicker .drp-buttons .btn{margin-left:8px;font-size:12px;font-weight:700;padding:4px 8px}.daterangepicker.show-ranges.single.rtl .drp-calendar.left{border-right:1px solid #ddd}.daterangepicker.show-ranges.single.ltr .drp-calendar.left{border-left:1px solid #ddd}.daterangepicker.show-ranges.rtl .drp-calendar.right{border-right:1px solid #ddd}.daterangepicker.show-ranges.ltr .drp-calendar.left{border-left:1px solid #ddd}.daterangepicker .ranges{float:none;text-align:left;margin:0}.daterangepicker.show-calendar .ranges{margin-top:8px}.daterangepicker .ranges ul{list-style:none;margin:0 auto;padding:0;width:100%}.daterangepicker .ranges li{font-size:12px;padding:8px 12px;cursor:pointer}.daterangepicker .ranges li:hover{background-color:#eee}.daterangepicker .ranges li.active{background-color:#08c;color:#fff}@media(min-width:564px){.daterangepicker{width:auto}.daterangepicker .ranges ul{width:140px}.daterangepicker.single .ranges ul{width:100%}.daterangepicker.single .drp-calendar.left{clear:none}.daterangepicker.single .ranges,.daterangepicker.single .drp-calendar{float:left}.daterangepicker{direction:ltr;text-align:left}.daterangepicker .drp-calendar.left{clear:left;margin-right:0}.daterangepicker .drp-calendar.left .calendar-table{border-right:none;border-top-right-radius:0;border-bottom-right-radius:0}.daterangepicker .drp-calendar.right{margin-left:0}.daterangepicker .drp-calendar.right .calendar-table{border-left:none;border-top-left-radius:0;border-bottom-left-radius:0}.daterangepicker .drp-calendar.left .calendar-table{padding-right:8px}.daterangepicker .ranges,.daterangepicker .drp-calendar{float:left}}@media(min-width:730px){.daterangepicker .ranges{width:auto;float:left}.daterangepicker.rtl .ranges{float:right}.daterangepicker .drp-calendar.left{clear:none!important}}\n"], dependencies: [{ kind: "ngmodule", type: CommonModule }, { kind: "directive", type: i2.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { kind: "directive", type: i2.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { kind: "ngmodule", type: FormsModule }, { kind: "component", type: DrpCalendar, selector: "drp-calendar", inputs: ["side", "calendarState", "locale", "timePicker", "timePicker24Hour", "timePickerSeconds", "timePickerState", "timePickerDisabled", "showDropdowns", "showWeekNumbers", "showISOWeekNumbers", "linkedCalendars", "singleDatePicker", "minDate", "maxDate", "minYear", "maxYear", "hoverDate", "startDate", "endDate"], outputs: ["prevClicked", "nextClicked", "monthYearChanged", "dateClicked", "dateHovered", "timeChanged"] }, { kind: "component", type: Ranges, selector: "drp-ranges", inputs: ["ranges", "showCustomRangeLabel", "customRangeLabel", "chosenLabel"], outputs: ["rangeClicked"] }, { kind: "component", type: Buttons, selector: "drp-buttons", inputs: ["selectedText", "applyDisabled", "applyLabel", "cancelLabel", "buttonClasses", "applyButtonClasses", "cancelButtonClasses"], outputs: ["applyClicked", "cancelClicked"] }], encapsulation: i0.ViewEncapsulation.None });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.5", ngImport: i0, type: DateRangePickerComponent, decorators: [{
            type: Component,
            args: [{ selector: 'drp-date-range-picker', standalone: true, imports: [CommonModule, FormsModule, DrpCalendar, Ranges, Buttons], encapsulation: ViewEncapsulation.None, template: "<!-- Trigger element \u2014 consumers project their own input/button via ng-content -->\n<span #triggerEl (click)=\"toggle()\" (keydown)=\"onKeydown($event)\">\n  <ng-content></ng-content>\n</span>\n\n<!-- Picker panel \u2014 moved to document.body in ngAfterViewInit -->\n<div #pickerPanel\n  [ngClass]=\"pickerClasses\"\n  [ngStyle]=\"positionStyles\"\n  [hidden]=\"!isShowing\">\n\n  @if (showRanges) {\n    <div class=\"ranges\">\n      <drp-ranges\n        [ranges]=\"builtRanges\"\n        [showCustomRangeLabel]=\"showCustomRangeLabel\"\n        [customRangeLabel]=\"resolvedLocale.customRangeLabel\"\n        [chosenLabel]=\"chosenLabel\"\n        (rangeClicked)=\"onRangeClicked($event)\">\n      </drp-ranges>\n    </div>\n  }\n\n  <!-- Left calendar -->\n  <drp-calendar\n    side=\"left\"\n    [calendarState]=\"leftCalendarState\"\n    [locale]=\"resolvedLocale\"\n    [timePicker]=\"timePicker\"\n    [timePicker24Hour]=\"timePicker24Hour\"\n    [timePickerSeconds]=\"timePickerSeconds\"\n    [timePickerState]=\"leftTimePickerState\"\n    [timePickerDisabled]=\"false\"\n    [showDropdowns]=\"showDropdowns\"\n    [showWeekNumbers]=\"showWeekNumbers\"\n    [showISOWeekNumbers]=\"showISOWeekNumbers\"\n    [linkedCalendars]=\"linkedCalendars\"\n    [singleDatePicker]=\"singleDatePicker\"\n    [minDate]=\"resolvedMinDate\"\n    [maxDate]=\"resolvedMaxDate\"\n    [minYear]=\"effectiveMinYear\"\n    [maxYear]=\"effectiveMaxYear\"\n    [hoverDate]=\"hoverDate\"\n    [startDate]=\"internalStartDate\"\n    [endDate]=\"internalEndDate\"\n    (prevClicked)=\"onPrevClicked($event)\"\n    (nextClicked)=\"onNextClicked($event)\"\n    (monthYearChanged)=\"onMonthYearChanged($event)\"\n    (dateClicked)=\"onDateClicked($event)\"\n    (dateHovered)=\"onDateHovered($event)\"\n    (timeChanged)=\"onTimeChanged($event)\">\n  </drp-calendar>\n\n  <!-- Right calendar (hidden when singleDatePicker) -->\n  @if (!singleDatePicker) {\n    <drp-calendar\n      side=\"right\"\n      [calendarState]=\"rightCalendarState\"\n      [locale]=\"resolvedLocale\"\n      [timePicker]=\"timePicker\"\n      [timePicker24Hour]=\"timePicker24Hour\"\n      [timePickerSeconds]=\"timePickerSeconds\"\n      [timePickerState]=\"rightTimePickerState\"\n      [timePickerDisabled]=\"!internalEndDate\"\n      [showDropdowns]=\"showDropdowns\"\n      [showWeekNumbers]=\"showWeekNumbers\"\n      [showISOWeekNumbers]=\"showISOWeekNumbers\"\n      [linkedCalendars]=\"linkedCalendars\"\n      [singleDatePicker]=\"singleDatePicker\"\n      [minDate]=\"resolvedMinDate\"\n      [maxDate]=\"resolvedMaxDate\"\n      [minYear]=\"effectiveMinYear\"\n      [maxYear]=\"effectiveMaxYear\"\n      [hoverDate]=\"hoverDate\"\n      [startDate]=\"internalStartDate\"\n      [endDate]=\"internalEndDate\"\n      (prevClicked)=\"onPrevClicked($event)\"\n      (nextClicked)=\"onNextClicked($event)\"\n      (monthYearChanged)=\"onMonthYearChanged($event)\"\n      (dateClicked)=\"onDateClicked($event)\"\n      (dateHovered)=\"onDateHovered($event)\"\n      (timeChanged)=\"onTimeChanged($event)\">\n    </drp-calendar>\n  }\n\n  <drp-buttons\n    [selectedText]=\"selectedText\"\n    [applyDisabled]=\"isApplyDisabled\"\n    [applyLabel]=\"resolvedLocale.applyLabel\"\n    [cancelLabel]=\"resolvedLocale.cancelLabel\"\n    [buttonClasses]=\"buttonClasses\"\n    [applyButtonClasses]=\"applyButtonClasses\"\n    [cancelButtonClasses]=\"cancelButtonClasses\"\n    (applyClicked)=\"clickApply()\"\n    (cancelClicked)=\"clickCancel()\">\n  </drp-buttons>\n\n</div>\n", styles: [".daterangepicker{position:absolute;color:inherit;background-color:#fff;border-radius:4px;border:1px solid #ddd;width:278px;max-width:none;padding:0;margin-top:7px;top:100px;left:20px;z-index:3001;display:none;font-family:arial;font-size:15px;line-height:1em}.daterangepicker:before,.daterangepicker:after{position:absolute;display:inline-block;border-bottom-color:#0003;content:\"\"}.daterangepicker:before{top:-7px;border-right:7px solid transparent;border-left:7px solid transparent;border-bottom:7px solid #ccc}.daterangepicker:after{top:-6px;border-right:6px solid transparent;border-bottom:6px solid #fff;border-left:6px solid transparent}.daterangepicker.opensleft:before{right:9px}.daterangepicker.opensleft:after{right:10px}.daterangepicker.openscenter:before,.daterangepicker.openscenter:after{left:0;right:0;width:0;margin-left:auto;margin-right:auto}.daterangepicker.opensright:before{left:9px}.daterangepicker.opensright:after{left:10px}.daterangepicker.drop-up{margin-top:-7px}.daterangepicker.drop-up:before{top:initial;bottom:-7px;border-bottom:initial;border-top:7px solid #ccc}.daterangepicker.drop-up:after{top:initial;bottom:-6px;border-bottom:initial;border-top:6px solid #fff}.daterangepicker.single .daterangepicker .ranges,.daterangepicker.single .drp-calendar{float:none}.daterangepicker.single .drp-selected{display:none}.daterangepicker.show-calendar .drp-calendar,.daterangepicker.show-calendar .drp-buttons{display:block}.daterangepicker.auto-apply .drp-buttons{display:none}.daterangepicker .drp-calendar{display:none;max-width:270px}.daterangepicker .drp-calendar.left{padding:8px 0 8px 8px}.daterangepicker .drp-calendar.right{padding:8px}.daterangepicker .drp-calendar.single .calendar-table{border:none}.daterangepicker .calendar-table .next span,.daterangepicker .calendar-table .prev span{color:#fff;border:solid black;border-width:0 2px 2px 0;border-radius:0;display:inline-block;padding:3px}.daterangepicker .calendar-table .next span{transform:rotate(-45deg);-webkit-transform:rotate(-45deg)}.daterangepicker .calendar-table .prev span{transform:rotate(135deg);-webkit-transform:rotate(135deg)}.daterangepicker .calendar-table th,.daterangepicker .calendar-table td{white-space:nowrap;text-align:center;vertical-align:middle;min-width:32px;width:32px;height:24px;line-height:24px;font-size:12px;border-radius:4px;border:1px solid transparent;cursor:pointer}.daterangepicker .calendar-table{border:1px solid #fff;border-radius:4px;background-color:#fff}.daterangepicker .calendar-table table{width:100%;margin:0;border-spacing:0;border-collapse:collapse}.daterangepicker td.available:hover,.daterangepicker th.available:hover{background-color:#eee;border-color:transparent;color:inherit}.daterangepicker td.week,.daterangepicker th.week{font-size:80%;color:#ccc}.daterangepicker td.off,.daterangepicker td.off.in-range,.daterangepicker td.off.start-date,.daterangepicker td.off.end-date{background-color:#fff;border-color:transparent;color:#999}.daterangepicker td.in-range{background-color:#ebf4f8;border-color:transparent;color:#000;border-radius:0}.daterangepicker td.start-date{border-radius:4px 0 0 4px}.daterangepicker td.end-date{border-radius:0 4px 4px 0}.daterangepicker td.start-date.end-date{border-radius:4px}.daterangepicker td.active,.daterangepicker td.active:hover{background-color:#357ebd;border-color:transparent;color:#fff}.daterangepicker th.month{width:auto}.daterangepicker td.disabled,.daterangepicker option.disabled{color:#999;cursor:not-allowed;text-decoration:line-through}.daterangepicker select.monthselect,.daterangepicker select.yearselect{font-size:12px;padding:1px;height:auto;margin:0;cursor:default}.daterangepicker select.monthselect{margin-right:2%;width:56%}.daterangepicker select.yearselect{width:40%}.daterangepicker select.hourselect,.daterangepicker select.minuteselect,.daterangepicker select.secondselect,.daterangepicker select.ampmselect{width:50px;margin:0 auto;background:#eee;border:1px solid #eee;padding:2px;outline:0;font-size:12px}.daterangepicker .calendar-time{text-align:center;margin:4px auto 0;line-height:30px;position:relative}.daterangepicker .calendar-time select.disabled{color:#ccc;cursor:not-allowed}.daterangepicker .drp-buttons{clear:both;text-align:right;padding:8px;border-top:1px solid #ddd;display:none;line-height:12px;vertical-align:middle}.daterangepicker .drp-selected{display:inline-block;font-size:12px;padding-right:8px}.daterangepicker .drp-buttons .btn{margin-left:8px;font-size:12px;font-weight:700;padding:4px 8px}.daterangepicker.show-ranges.single.rtl .drp-calendar.left{border-right:1px solid #ddd}.daterangepicker.show-ranges.single.ltr .drp-calendar.left{border-left:1px solid #ddd}.daterangepicker.show-ranges.rtl .drp-calendar.right{border-right:1px solid #ddd}.daterangepicker.show-ranges.ltr .drp-calendar.left{border-left:1px solid #ddd}.daterangepicker .ranges{float:none;text-align:left;margin:0}.daterangepicker.show-calendar .ranges{margin-top:8px}.daterangepicker .ranges ul{list-style:none;margin:0 auto;padding:0;width:100%}.daterangepicker .ranges li{font-size:12px;padding:8px 12px;cursor:pointer}.daterangepicker .ranges li:hover{background-color:#eee}.daterangepicker .ranges li.active{background-color:#08c;color:#fff}@media(min-width:564px){.daterangepicker{width:auto}.daterangepicker .ranges ul{width:140px}.daterangepicker.single .ranges ul{width:100%}.daterangepicker.single .drp-calendar.left{clear:none}.daterangepicker.single .ranges,.daterangepicker.single .drp-calendar{float:left}.daterangepicker{direction:ltr;text-align:left}.daterangepicker .drp-calendar.left{clear:left;margin-right:0}.daterangepicker .drp-calendar.left .calendar-table{border-right:none;border-top-right-radius:0;border-bottom-right-radius:0}.daterangepicker .drp-calendar.right{margin-left:0}.daterangepicker .drp-calendar.right .calendar-table{border-left:none;border-top-left-radius:0;border-bottom-left-radius:0}.daterangepicker .drp-calendar.left .calendar-table{padding-right:8px}.daterangepicker .ranges,.daterangepicker .drp-calendar{float:left}}@media(min-width:730px){.daterangepicker .ranges{width:auto;float:left}.daterangepicker.rtl .ranges{float:right}.daterangepicker .drp-calendar.left{clear:none!important}}\n"] }]
        }], ctorParameters: () => [{ type: DatePickerService }, { type: i0.RendererFactory2 }], propDecorators: { startDate: [{
                type: Input
            }], endDate: [{
                type: Input
            }], minDate: [{
                type: Input
            }], maxDate: [{
                type: Input
            }], maxSpan: [{
                type: Input
            }], singleDatePicker: [{
                type: Input
            }], autoApply: [{
                type: Input
            }], showDropdowns: [{
                type: Input
            }], minYear: [{
                type: Input
            }], maxYear: [{
                type: Input
            }], showWeekNumbers: [{
                type: Input
            }], showISOWeekNumbers: [{
                type: Input
            }], showCustomRangeLabel: [{
                type: Input
            }], timePicker: [{
                type: Input
            }], timePicker24Hour: [{
                type: Input
            }], timePickerIncrement: [{
                type: Input
            }], timePickerSeconds: [{
                type: Input
            }], linkedCalendars: [{
                type: Input
            }], autoUpdateInput: [{
                type: Input
            }], alwaysShowCalendars: [{
                type: Input
            }], ranges: [{
                type: Input
            }], opens: [{
                type: Input
            }], drops: [{
                type: Input
            }], buttonClasses: [{
                type: Input
            }], applyButtonClasses: [{
                type: Input
            }], cancelButtonClasses: [{
                type: Input
            }], locale: [{
                type: Input
            }], isInvalidDate: [{
                type: Input
            }], isCustomDate: [{
                type: Input
            }], apply: [{
                type: Output
            }], cancel: [{
                type: Output
            }], showPicker: [{
                type: Output
            }], hidePicker: [{
                type: Output
            }], showCalendarEvent: [{
                type: Output
            }], hideCalendarEvent: [{
                type: Output
            }], rangeSelected: [{
                type: Output
            }], pickerPanelRef: [{
                type: ViewChild,
                args: ['pickerPanel']
            }], triggerElRef: [{
                type: ViewChild,
                args: ['triggerEl']
            }], onDocumentMousedown: [{
                type: HostListener,
                args: ['document:mousedown', ['$event']]
            }], onDocumentTouchend: [{
                type: HostListener,
                args: ['document:touchend', ['$event']]
            }], onWindowResize: [{
                type: HostListener,
                args: ['window:resize']
            }], onKeydown: [{
                type: HostListener,
                args: ['keydown', ['$event']]
            }] } });

/*
 * Public API Surface of ng-daterangepicker
 */

/**
 * Generated bundle index. Do not edit.
 */

export { Buttons, CalendarGrid, CalendarHeader, DEFAULT_LOCALE, DatePickerService, DateRangePickerComponent, DrpCalendar, Ranges, TimePicker };
//# sourceMappingURL=ng-daterangepicker.mjs.map
