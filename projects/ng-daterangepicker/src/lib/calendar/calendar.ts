import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dayjs } from 'dayjs';
import {
  CalendarSide,
  CalendarState,
  DateRangeLocale,
  TimePickerState,
} from '../models/date-range-picker.models';
import { CalendarHeader, MonthYearChangeEvent } from '../calendar-header/calendar-header';
import { CalendarGrid, DateClickEvent } from '../calendar-grid/calendar-grid';
import { TimePicker, TimeChangeEvent } from '../time-picker/time-picker';

@Component({
  selector: 'drp-calendar',
  standalone: true,
  imports: [CommonModule, CalendarHeader, CalendarGrid, TimePicker],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class DrpCalendar {
  @Input({ required: true }) side!: CalendarSide;
  @Input({ required: true }) calendarState!: CalendarState;
  @Input({ required: true }) locale!: DateRangeLocale;
  @Input() timePicker = false;
  @Input() timePicker24Hour = false;
  @Input() timePickerSeconds = false;
  @Input() timePickerState?: TimePickerState;
  @Input() timePickerDisabled = false;
  @Input() showDropdowns = false;
  @Input() showWeekNumbers = false;
  @Input() showISOWeekNumbers = false;
  @Input() linkedCalendars = true;
  @Input() singleDatePicker = false;
  @Input() minDate: Dayjs | false = false;
  @Input() maxDate: Dayjs | false = false;
  @Input() minYear = 1924;
  @Input() maxYear = 2124;
  @Input() hoverDate: Dayjs | null = null;
  @Input() startDate: Dayjs | null = null;
  @Input() endDate: Dayjs | null = null;

  @Output() prevClicked = new EventEmitter<CalendarSide>();
  @Output() nextClicked = new EventEmitter<CalendarSide>();
  @Output() monthYearChanged = new EventEmitter<MonthYearChangeEvent>();
  @Output() dateClicked = new EventEmitter<DateClickEvent>();
  @Output() dateHovered = new EventEmitter<DateClickEvent>();
  @Output() timeChanged = new EventEmitter<TimeChangeEvent>();
}
