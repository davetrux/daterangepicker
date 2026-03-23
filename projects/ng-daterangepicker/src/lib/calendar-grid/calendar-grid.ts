import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dayjs } from 'dayjs';
import { CalendarCell, CalendarSide, CalendarState } from '../models/date-range-picker.models';

export interface DateClickEvent {
  cell: CalendarCell;
  side: CalendarSide;
}

@Component({
  selector: 'drp-calendar-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-grid.html',
  styleUrl: './calendar-grid.css',
})
export class CalendarGrid implements OnChanges {
  @Input({ required: true }) side!: CalendarSide;
  @Input({ required: true }) calendarState!: CalendarState;
  @Input() showWeekNumbers = false;
  @Input() showISOWeekNumbers = false;
  @Input() hoverDate: Dayjs | null = null;
  @Input() startDate: Dayjs | null = null;
  @Input() endDate: Dayjs | null = null;

  @Output() dateClicked = new EventEmitter<DateClickEvent>();
  @Output() dateHovered = new EventEmitter<DateClickEvent>();

  ngOnChanges(): void {}

  getCellClasses(cell: CalendarCell): Record<string, boolean> {
    const result: Record<string, boolean> = {};
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

  onCellMousedown(cell: CalendarCell, event: MouseEvent): void {
    event.stopPropagation();
    if (!cell.isAvailable) return;
    this.dateClicked.emit({ cell, side: this.side });
  }

  onCellMouseenter(cell: CalendarCell): void {
    if (!cell.isAvailable) return;
    this.dateHovered.emit({ cell, side: this.side });
  }
}
