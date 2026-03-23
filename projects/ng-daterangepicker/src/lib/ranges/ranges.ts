import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RangeItem } from '../models/date-range-picker.models';

@Component({
  selector: 'drp-ranges',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ranges.html',
  styleUrl: './ranges.css',
})
export class Ranges {
  @Input() ranges: RangeItem[] = [];
  @Input() showCustomRangeLabel = true;
  @Input() customRangeLabel = 'Custom Range';
  @Input() chosenLabel: string | null = null;

  @Output() rangeClicked = new EventEmitter<RangeItem | null>();
}
