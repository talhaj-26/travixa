import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'bdtCurrency', standalone: true })
export class BdtCurrencyPipe implements PipeTransform {
  transform(amount: number | string | null | undefined, fractionDigits = 0): string {
    const value = Number(amount);
    if (!Number.isFinite(value)) return '৳0';
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', currencyDisplay: 'narrowSymbol', minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(value);
  }
}
