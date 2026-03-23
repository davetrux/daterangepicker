import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarSide, TimePickerState } from '../models/date-range-picker.models';

export interface TimeChangeEvent {
  side: CalendarSide;
  hour: number;
  minute: number;
  second: number;
  ampm: 'AM' | 'PM';
}

@Component({
  selector: 'drp-time-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './time-picker.html',
  styleUrl: './time-picker.css',
})
export class TimePicker {
  @Input({ required: true }) side!: CalendarSide;
  @Input({ required: true }) state!: TimePickerState;
  @Input() disabled = false;
  @Input() timePicker24Hour = false;
  @Input() timePickerSeconds = false;

  @Output() timeChanged = new EventEmitter<TimeChangeEvent>();

  selectedHour!: number;
  selectedMinute!: number;
  selectedSecond = 0;
  selectedAmpm: 'AM' | 'PM' = 'AM';

  ngOnChanges(): void {
    if (this.state) {
      this.selectedHour = this.state.selectedHour;
      this.selectedMinute = this.state.selectedMinute;
      this.selectedSecond = this.state.selectedSecond;
      this.selectedAmpm = this.state.selectedAmpm;
    }
  }

  emitChange(): void {
    this.timeChanged.emit({
      side: this.side,
      hour: this.selectedHour,
      minute: this.selectedMinute,
      second: this.selectedSecond,
      ampm: this.selectedAmpm,
    });
  }
}
