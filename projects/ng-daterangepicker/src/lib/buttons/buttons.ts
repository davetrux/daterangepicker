import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'drp-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './buttons.html',
  styleUrl: './buttons.css',
})
export class Buttons {
  @Input() selectedText = '';
  @Input() applyDisabled = true;
  @Input() applyLabel = 'Apply';
  @Input() cancelLabel = 'Cancel';
  @Input() buttonClasses = 'btn btn-sm';
  @Input() applyButtonClasses = 'btn-primary';
  @Input() cancelButtonClasses = 'btn-default';

  @Output() applyClicked = new EventEmitter<void>();
  @Output() cancelClicked = new EventEmitter<void>();
}
