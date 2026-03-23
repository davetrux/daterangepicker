import { Component, signal } from '@angular/core';
import dayjs, { Dayjs } from 'dayjs';
import { DateRangePickerComponent } from 'ng-daterangepicker';
import { DateRange, RangeItem } from 'ng-daterangepicker';

@Component({
  selector: 'app-root',
  imports: [DateRangePickerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'ng-daterangepicker Demo';

  startDate: Dayjs = dayjs().subtract(29, 'days').startOf('day');
  endDate: Dayjs = dayjs().endOf('day');

  selectedRange = signal('Select a date range');

  ranges: Record<string, [Dayjs, Dayjs]> = {
    'Today': [dayjs(), dayjs()],
    'Yesterday': [dayjs().subtract(1, 'day'), dayjs().subtract(1, 'day')],
    'Last 7 Days': [dayjs().subtract(6, 'days'), dayjs()],
    'Last 30 Days': [dayjs().subtract(29, 'days'), dayjs()],
    'This Month': [dayjs().startOf('month'), dayjs().endOf('month')],
    'Last Month': [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')],
  };

  onRangeApplied(range: DateRange): void {
    this.startDate = range.startDate;
    this.endDate = range.endDate;
    this.selectedRange.set(
      range.startDate.format('MMM D, YYYY') + ' – ' + range.endDate.format('MMM D, YYYY')
    );
  }
}
