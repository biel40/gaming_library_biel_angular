import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'spanishDate',
  standalone: true
})
export class SpanishDatePipe implements PipeTransform {
  private readonly monthsShort = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
  ];

  private readonly monthsLong = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  /**
   * Transforms a date to Spanish format
   * @param value - The date to transform
   * @param format - The format to use: 'short' (dd/MM/yyyy) or 'long' (dd MMMM, yyyy)
   * @returns Formatted date string in Spanish, or empty string if value is null/undefined
   */
  transform(value: Date | string | null | undefined, format: 'short' | 'long' = 'short'): string {
    if (!value) {
      return '';
    }

    const date = typeof value === 'string' ? new Date(value) : value;
    
    if (isNaN(date.getTime())) {
      return '';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = date.getMonth();
    const year = date.getFullYear();

    if (format === 'short') {
      const monthPadded = String(month + 1).padStart(2, '0');
      return `${day}/${monthPadded}/${year}`;
    } else if (format === 'long') {
      const monthName = this.monthsLong[month];
      return `${day} de ${monthName} de ${year}`;
    }

    return '';
  }
}
