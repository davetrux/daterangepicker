import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dayjs } from 'dayjs';
import { CalendarSide, CalendarState, DateRangeLocale } from '../models/date-range-picker.models';

export interface MonthYearChangeEvent {
  side: CalendarSide;
  month: number;
  year: number;
}

@Component({
  selector: 'drp-calendar-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar-header.html',
  styleUrl: './calendar-header.css',
})
export class CalendarHeader {
  @Input({ required: true }) side!: CalendarSide;
  @Input({ required: true }) calendarState!: CalendarState;
  @Input({ required: true }) locale!: DateRangeLocale;
  @Input() showDropdowns = false;
  @Input() showWeekNumbers = false;
  @Input() showISOWeekNumbers = false;
  @Input() linkedCalendars = true;
  @Input() singleDatePicker = false;
  @Input() minDate: Dayjs | false = false;
  @Input() maxDate: Dayjs | false = false;
  @Input() minYear = 1924;
  @Input() maxYear = 2124;

  @Output() prevClicked = new EventEmitter<CalendarSide>();
  @Output() nextClicked = new EventEmitter<CalendarSide>();
  @Output() monthYearChanged = new EventEmitter<MonthYearChangeEvent>();

  get currentMonth(): number {
    return this.calendarState.calendar[1][1].date.month();
  }

  get currentYear(): number {
    return this.calendarState.calendar[1][1].date.year();
  }

  get monthLabel(): string {
    return this.locale.monthNames[this.currentMonth] + this.calendarState.calendar[1][1].date.format(' YYYY');
  }

  get effectiveMinYear(): number {
    return (this.minDate && this.minDate.year()) || this.minYear;
  }

  get effectiveMaxYear(): number {
    return (this.maxDate && this.maxDate.year()) || this.maxYear;
  }

  get showPrev(): boolean {
    const minDate = this.minDate;
    return (!minDate || minDate.isBefore(this.calendarState.firstDay)) &&
      (!this.linkedCalendars || this.side === 'left');
  }

  get showNext(): boolean {
    const maxDate = this.maxDate;
    return (!maxDate || maxDate.isAfter(this.calendarState.lastDay)) &&
      (!this.linkedCalendars || this.side === 'right' || this.singleDatePicker);
  }

  isMonthDisabled(m: number): boolean {
    const inMinYear = this.currentYear === this.effectiveMinYear;
    const inMaxYear = this.currentYear === this.effectiveMaxYear;
    if (inMinYear && this.minDate && m < this.minDate.month()) return true;
    if (inMaxYear && this.maxDate && m > this.maxDate.month()) return true;
    return false;
  }

  getYears(): number[] {
    const years: number[] = [];
    for (let y = this.effectiveMinYear; y <= this.effectiveMaxYear; y++) years.push(y);
    return years;
  }

  onMonthChange(month: string): void {
    this.monthYearChanged.emit({ side: this.side, month: +month, year: this.currentYear });
  }

  onYearChange(year: string): void {
    this.monthYearChanged.emit({ side: this.side, month: this.currentMonth, year: +year });
  }
}
