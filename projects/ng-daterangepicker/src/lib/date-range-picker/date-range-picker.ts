import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  RendererFactory2,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import dayjs, { Dayjs } from 'dayjs';

import {
  CalendarSide,
  CalendarState,
  DateRange,
  DateRangeLocale,
  DateRangePickerConfig,
  RangeItem,
  TimePickerState,
} from '../models/date-range-picker.models';
import { DatePickerService } from '../date-picker.service';
import { DrpCalendar } from '../calendar/calendar';
import { Ranges } from '../ranges/ranges';
import { Buttons } from '../buttons/buttons';
import { MonthYearChangeEvent } from '../calendar-header/calendar-header';
import { DateClickEvent } from '../calendar-grid/calendar-grid';
import { TimeChangeEvent } from '../time-picker/time-picker';

@Component({
  selector: 'drp-date-range-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, DrpCalendar, Ranges, Buttons],
  templateUrl: './date-range-picker.html',
  styleUrl: './date-range-picker.css',
  encapsulation: ViewEncapsulation.None,
})
export class DateRangePickerComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  // ── Inputs ───────────────────────────────────────────────────────────────
  @Input() startDate?: Dayjs | string;
  @Input() endDate?: Dayjs | string;
  @Input() minDate?: Dayjs | string | false;
  @Input() maxDate?: Dayjs | string | false;
  @Input() maxSpan?: Record<string, number> | false;
  @Input() singleDatePicker = false;
  @Input() autoApply = false;
  @Input() showDropdowns = false;
  @Input() minYear?: number;
  @Input() maxYear?: number;
  @Input() showWeekNumbers = false;
  @Input() showISOWeekNumbers = false;
  @Input() showCustomRangeLabel = true;
  @Input() timePicker = false;
  @Input() timePicker24Hour = false;
  @Input() timePickerIncrement = 1;
  @Input() timePickerSeconds = false;
  @Input() linkedCalendars = true;
  @Input() autoUpdateInput = true;
  @Input() alwaysShowCalendars = false;
  @Input() ranges?: Record<string, [Dayjs | string, Dayjs | string]>;
  @Input() opens: 'left' | 'right' | 'center' = 'right';
  @Input() drops: 'up' | 'down' | 'auto' = 'down';
  @Input() buttonClasses = 'btn btn-sm';
  @Input() applyButtonClasses = 'btn-primary';
  @Input() cancelButtonClasses = 'btn-default';
  @Input() locale?: Partial<DateRangeLocale>;
  @Input() isInvalidDate?: (date: Dayjs) => boolean;
  @Input() isCustomDate?: (date: Dayjs) => string | string[] | false;

  // ── Outputs ──────────────────────────────────────────────────────────────
  @Output() apply = new EventEmitter<DateRange>();
  @Output() cancel = new EventEmitter<void>();
  @Output() showPicker = new EventEmitter<void>();
  @Output() hidePicker = new EventEmitter<void>();
  @Output() showCalendarEvent = new EventEmitter<void>();
  @Output() hideCalendarEvent = new EventEmitter<void>();
  @Output() rangeSelected = new EventEmitter<DateRange>();

  // ── ViewChild refs ────────────────────────────────────────────────────────
  @ViewChild('pickerPanel') pickerPanelRef!: ElementRef<HTMLDivElement>;
  @ViewChild('triggerEl') triggerElRef!: ElementRef<HTMLElement>;

  // ── Internal state ────────────────────────────────────────────────────────
  isShowing = false;
  showCalendarsPanel = false;
  resolvedLocale!: DateRangeLocale;
  internalStartDate!: Dayjs;
  internalEndDate!: Dayjs | null;
  oldStartDate!: Dayjs;
  oldEndDate!: Dayjs | null;
  leftCalendarState!: CalendarState;
  rightCalendarState!: CalendarState;
  leftTimePickerState?: TimePickerState;
  rightTimePickerState?: TimePickerState;
  builtRanges: RangeItem[] = [];
  chosenLabel: string | null = null;
  hoverDate: Dayjs | null = null;
  positionStyles: Record<string, string> = { top: '0', left: '0' };
  isApplyDisabled = true;
  isDropUp = false;
  selectedText = '';
  resolvedMinDate: Dayjs | false = false;
  resolvedMaxDate: Dayjs | false = false;
  effectiveMinYear = 1924;
  effectiveMaxYear = 2124;
  previousRightTime?: Dayjs;

  private config!: DateRangePickerConfig;

  private renderer: Renderer2;

  constructor(private svc: DatePickerService, rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  ngOnInit(): void {
    this.initConfig();
    this.updateView();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.keys(changes).length) {
      this.initConfig();
      this.updateView();
    }
  }

  ngAfterViewInit(): void {
    if (this.pickerPanelRef) {
      this.renderer.appendChild(document.body, this.pickerPanelRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.pickerPanelRef?.nativeElement?.parentNode) {
      this.renderer.removeChild(document.body, this.pickerPanelRef.nativeElement);
    }
  }

  // ── Initialization ────────────────────────────────────────────────────────

  private initConfig(): void {
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
    const start: Dayjs = parsedStart !== false ? parsedStart : dayjs().startOf('day');
    const end: Dayjs = parsedEnd !== false ? parsedEnd : dayjs().endOf('day');

    this.internalStartDate = this.svc.clampStartDate(start, this.config, this.resolvedLocale);
    if (this.singleDatePicker) {
      this.internalEndDate = this.internalStartDate.clone();
    } else {
      this.internalEndDate = this.svc.clampEndDate(end, this.internalStartDate, this.config, this.resolvedLocale);
    }
    if (!this.timePicker) {
      this.internalStartDate = this.internalStartDate.startOf('day');
      if (this.internalEndDate) this.internalEndDate = this.internalEndDate.endOf('day');
    }

    // Build ranges
    this.builtRanges = this.ranges
      ? this.svc.buildRanges(this.ranges, this.config, this.resolvedLocale)
      : [];

    // Determine if calendars panel should always be visible
    this.showCalendarsPanel = this.builtRanges.length === 0 || this.alwaysShowCalendars;
  }

  // ── View update ───────────────────────────────────────────────────────────

  updateView(): void {
    this.updateMonthsInView();
    this.rebuildCalendars();
    this.updateFormInputs();
    this.updateSelectedText();
    if (this.timePicker) this.rebuildTimePickers();
  }

  private leftMonthDate!: Dayjs;
  private rightMonthDate!: Dayjs;

  private updateMonthsInView(): void {
    if (!this.leftMonthDate) {
      this.leftMonthDate = this.internalStartDate.clone().date(2);
      this.rightMonthDate = this.internalStartDate.clone().date(2).add(1, 'month');
    }

    if (this.internalEndDate) {
      const startFmt = this.internalStartDate.format('YYYY-MM');
      const endFmt = this.internalEndDate.format('YYYY-MM');
      const leftFmt = this.leftMonthDate.format('YYYY-MM');
      const rightFmt = this.rightMonthDate.format('YYYY-MM');

      if (
        !this.singleDatePicker &&
        (startFmt === leftFmt || startFmt === rightFmt) &&
        (endFmt === leftFmt || endFmt === rightFmt)
      ) return;

      this.leftMonthDate = this.internalStartDate.clone().date(2);
      if (!this.linkedCalendars &&
        (this.internalEndDate.month() !== this.internalStartDate.month() ||
          this.internalEndDate.year() !== this.internalStartDate.year())) {
        this.rightMonthDate = this.internalEndDate.clone().date(2);
      } else {
        this.rightMonthDate = this.internalStartDate.clone().date(2).add(1, 'month');
      }
    } else {
      if (
        this.leftMonthDate.format('YYYY-MM') !== this.internalStartDate.format('YYYY-MM') &&
        this.rightMonthDate.format('YYYY-MM') !== this.internalStartDate.format('YYYY-MM')
      ) {
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

  private rebuildCalendars(): void {
    this.leftCalendarState = this.svc.buildCalendar(
      this.leftMonthDate, this.internalStartDate, this.internalEndDate, this.hoverDate,
      'left', this.config, this.resolvedLocale
    );
    this.rightCalendarState = this.svc.buildCalendar(
      this.rightMonthDate, this.internalStartDate, this.internalEndDate, this.hoverDate,
      'right', this.config, this.resolvedLocale
    );
  }

  private rebuildTimePickers(): void {
    const maxDate = this.resolvedMaxDate;
    let effectiveMax = maxDate;
    if (this.maxSpan && (!maxDate || (this.internalStartDate.clone().add(this.maxSpan as any).isBefore(maxDate)))) {
      effectiveMax = this.internalStartDate.clone().add(this.maxSpan as any);
    }

    this.leftTimePickerState = this.svc.buildTimePicker(
      this.internalStartDate, this.resolvedMinDate, effectiveMax, this.config
    );

    if (this.internalEndDate) {
      this.rightTimePickerState = this.svc.buildTimePicker(
        this.internalEndDate, this.internalStartDate, effectiveMax, this.config
      );
    }
  }

  private updateFormInputs(): void {
    this.isApplyDisabled = !(
      this.singleDatePicker ||
      (this.internalEndDate &&
        (this.internalStartDate.isBefore(this.internalEndDate) ||
          this.internalStartDate.isSame(this.internalEndDate)))
    );
  }

  private updateSelectedText(): void {
    if (this.internalEndDate) {
      this.selectedText =
        this.internalStartDate.format(this.resolvedLocale.format) +
        this.resolvedLocale.separator +
        this.internalEndDate.format(this.resolvedLocale.format);
    } else {
      this.selectedText = this.internalStartDate.format(this.resolvedLocale.format);
    }
  }

  // ── Show / Hide ───────────────────────────────────────────────────────────

  toggle(): void {
    this.isShowing ? this.hide() : this.show();
  }

  show(): void {
    if (this.isShowing) return;
    this.oldStartDate = this.internalStartDate.clone();
    this.oldEndDate = this.internalEndDate ? this.internalEndDate.clone() : null;
    this.previousRightTime = this.internalEndDate ? this.internalEndDate.clone() : undefined;
    this.updateView();
    this.positionStyles = { ...this.positionStyles, visibility: 'hidden' };
    this.isShowing = true;
    setTimeout(() => this.move(), 0); // wait for panel to render
    this.showPicker.emit();
  }

  hide(): void {
    if (!this.isShowing) return;

    if (!this.internalEndDate) {
      this.internalStartDate = this.oldStartDate!.clone();
      this.internalEndDate = this.oldEndDate ? this.oldEndDate.clone() : null;
    }

    const changed =
      !this.internalStartDate.isSame(this.oldStartDate) ||
      (this.internalEndDate && !this.internalEndDate.isSame(this.oldEndDate!));

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

  move(): void {
    const trigger = this.triggerElRef?.nativeElement;
    const panel = this.pickerPanelRef?.nativeElement;
    if (!trigger || !panel) return;

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

    let top: number;
    if (drops === 'up') {
      top = triggerRect.top + scrollY - panelHeight;
    } else {
      top = triggerRect.bottom + scrollY;
    }

    let left: string = 'auto';
    let right: string = 'auto';

    // Reset panel to measure width
    panel.style.top = '0';
    panel.style.left = '0';
    panel.style.right = 'auto';

    if (this.opens === 'left') {
      const containerRight = viewportWidth - triggerRect.right - scrollX;
      if (panelWidth + containerRight > viewportWidth) {
        left = '9px';
      } else {
        right = `${containerRight}px`;
        left = 'auto';
      }
    } else if (this.opens === 'center') {
      const containerLeft = triggerRect.left + scrollX - panelWidth / 2 + triggerRect.width / 2;
      if (containerLeft < 0) {
        left = '9px';
      } else if (containerLeft + panelWidth > viewportWidth) {
        right = '0';
        left = 'auto';
      } else {
        left = `${containerLeft}px`;
      }
    } else {
      // right (open to right)
      const containerLeft = triggerRect.left + scrollX;
      if (containerLeft + panelWidth > viewportWidth) {
        right = '0';
        left = 'auto';
      } else {
        left = `${containerLeft}px`;
      }
    }

    this.positionStyles = {
      top: `${top}px`,
      left,
      right,
      position: 'absolute',
      visibility: 'visible',
    };
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  @HostListener('document:mousedown', ['$event'])
  onDocumentMousedown(event: MouseEvent): void {
    if (!this.isShowing) return;
    const target = event.target as HTMLElement;
    const panel = this.pickerPanelRef?.nativeElement;
    const trigger = this.triggerElRef?.nativeElement;
    if (panel?.contains(target) || trigger?.contains(target)) return;
    this.hide();
  }

  @HostListener('document:touchend', ['$event'])
  onDocumentTouchend(event: TouchEvent): void {
    if (!this.isShowing) return;
    const target = event.target as HTMLElement;
    const panel = this.pickerPanelRef?.nativeElement;
    const trigger = this.triggerElRef?.nativeElement;
    if (panel?.contains(target) || trigger?.contains(target)) return;
    this.hide();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isShowing) this.move();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab' || event.key === 'Enter') this.hide();
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.hide();
    }
  }

  // ── Calendar navigation ───────────────────────────────────────────────────

  onPrevClicked(side: CalendarSide): void {
    if (side === 'left') {
      this.leftMonthDate = this.leftMonthDate.subtract(1, 'month');
      if (this.linkedCalendars) this.rightMonthDate = this.rightMonthDate.subtract(1, 'month');
    } else {
      this.rightMonthDate = this.rightMonthDate.subtract(1, 'month');
    }
    this.rebuildCalendars();
    if (this.timePicker) this.rebuildTimePickers();
    this.move();
  }

  onNextClicked(side: CalendarSide): void {
    if (side === 'left') {
      this.leftMonthDate = this.leftMonthDate.add(1, 'month');
    } else {
      this.rightMonthDate = this.rightMonthDate.add(1, 'month');
      if (this.linkedCalendars) this.leftMonthDate = this.leftMonthDate.add(1, 'month');
    }
    this.rebuildCalendars();
    if (this.timePicker) this.rebuildTimePickers();
    this.move();
  }

  onMonthYearChanged(event: MonthYearChangeEvent): void {
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
      if (this.linkedCalendars) this.rightMonthDate = this.leftMonthDate.clone().add(1, 'month');
    } else {
      this.rightMonthDate = this.rightMonthDate.month(month).year(year);
      if (this.linkedCalendars) this.leftMonthDate = this.rightMonthDate.clone().subtract(1, 'month');
    }
    this.rebuildCalendars();
    if (this.timePicker) this.rebuildTimePickers();
  }

  // ── Date click / hover ────────────────────────────────────────────────────

  onDateClicked(event: DateClickEvent): void {
    const { cell } = event;
    const date = cell.date;

    if (this.internalEndDate || date.isBefore(this.internalStartDate, 'day')) {
      // Picking start date
      let newStart = date.clone();
      if (this.timePicker && this.leftTimePickerState) {
        let hour = this.leftTimePickerState.selectedHour;
        const ampm = this.leftTimePickerState.selectedAmpm;
        if (!this.timePicker24Hour) {
          if (ampm === 'PM' && hour < 12) hour += 12;
          if (ampm === 'AM' && hour === 12) hour = 0;
        }
        newStart = newStart.hour(hour)
          .minute(this.leftTimePickerState.selectedMinute)
          .second(this.leftTimePickerState.selectedSecond);
      }
      this.internalEndDate = null;
      this.internalStartDate = this.svc.clampStartDate(newStart, this.config, this.resolvedLocale);
    } else if (!this.internalEndDate && date.isBefore(this.internalStartDate)) {
      this.internalEndDate = this.internalStartDate.clone();
    } else {
      // Picking end date
      let newEnd = date.clone();
      if (this.timePicker && this.rightTimePickerState) {
        let hour = this.rightTimePickerState.selectedHour;
        const ampm = this.rightTimePickerState.selectedAmpm;
        if (!this.timePicker24Hour) {
          if (ampm === 'PM' && hour < 12) hour += 12;
          if (ampm === 'AM' && hour === 12) hour = 0;
        }
        newEnd = newEnd.hour(hour)
          .minute(this.rightTimePickerState.selectedMinute)
          .second(this.rightTimePickerState.selectedSecond);
      }
      this.internalEndDate = this.svc.clampEndDate(newEnd, this.internalStartDate, this.config, this.resolvedLocale);
      if (this.autoApply) {
        this.chosenLabel = this.svc.calculateChosenLabel(
          this.internalStartDate, this.internalEndDate, this.builtRanges, this.config
        );
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

  onDateHovered(event: DateClickEvent): void {
    if (!this.internalEndDate) {
      this.hoverDate = event.cell.date;
      this.rebuildCalendars();
    }
  }

  // ── Time change ───────────────────────────────────────────────────────────

  onTimeChanged(event: TimeChangeEvent): void {
    const { side, hour: rawHour, minute, second, ampm } = event;
    let hour = rawHour;
    if (!this.timePicker24Hour) {
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
    }

    if (side === 'left') {
      const newStart = this.internalStartDate.hour(hour).minute(minute).second(second);
      this.internalStartDate = this.svc.clampStartDate(newStart, this.config, this.resolvedLocale);
      if (this.singleDatePicker) {
        this.internalEndDate = this.internalStartDate.clone();
      } else if (this.internalEndDate &&
        this.internalEndDate.format('YYYY-MM-DD') === newStart.format('YYYY-MM-DD') &&
        this.internalEndDate.isBefore(newStart)) {
        this.internalEndDate = this.svc.clampEndDate(newStart.clone(), this.internalStartDate, this.config, this.resolvedLocale);
      }
    } else if (this.internalEndDate) {
      const newEnd = this.internalEndDate.hour(hour).minute(minute).second(second);
      this.internalEndDate = this.svc.clampEndDate(newEnd, this.internalStartDate, this.config, this.resolvedLocale);
    }

    this.rebuildCalendars();
    this.updateFormInputs();
    this.rebuildTimePickers();
  }

  // ── Range click ───────────────────────────────────────────────────────────

  onRangeClicked(range: RangeItem | null): void {
    if (range === null) {
      this.showCalendarsPanel = true;
      this.chosenLabel = this.resolvedLocale.customRangeLabel;
      this.move();
      this.showCalendarEvent.emit();
    } else {
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

  clickApply(): void {
    const range: DateRange = {
      startDate: this.internalStartDate.clone(),
      endDate: (this.internalEndDate ?? this.internalStartDate).clone(),
      label: this.chosenLabel ?? undefined,
    };
    this.apply.emit(range);
    this.rangeSelected.emit(range);
    this.hide();
  }

  clickCancel(): void {
    this.internalStartDate = this.oldStartDate!.clone();
    this.internalEndDate = this.oldEndDate ? this.oldEndDate.clone() : null;
    this.cancel.emit();
    this.hide();
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  get showRanges(): boolean {
    return this.builtRanges.length > 0;
  }

  get showSingleCalendar(): boolean {
    return this.singleDatePicker;
  }

  get pickerClasses(): Record<string, boolean> {
    return {
      'daterangepicker': true,
      'open': this.isShowing,
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
}
