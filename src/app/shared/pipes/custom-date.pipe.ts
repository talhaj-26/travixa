import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'travixaDate', standalone: true })
export class CustomDatePipe implements PipeTransform {
  transform(value: Date | string | number | null | undefined, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-BD', options).format(date);
  }
}
