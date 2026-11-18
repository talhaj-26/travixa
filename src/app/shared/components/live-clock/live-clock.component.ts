import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-live-clock',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="live-clock" aria-live="polite"><span class="live-clock__time">{{ time }}</span><span class="live-clock__date">{{ date }}</span></div>`,
  styles: [`
    .live-clock { display:flex; align-items:center; gap:.42rem; padding:.42rem .62rem; border:1px solid rgba(13,148,136,.16); border-radius:.7rem; background:rgba(13,148,136,.055); color:var(--color-heading,#0f172a); font-family:var(--font-mono,monospace); white-space:nowrap; }
    .live-clock__time { color:var(--color-primary-700,#0f766e); font-size:.69rem; font-weight:800; }
    .live-clock__date { color:var(--color-muted,#64748b); font:650 .6rem var(--font-body,sans-serif); }
    :host-context([data-theme='dark']) .live-clock { background:rgba(45,212,191,.09); border-color:rgba(94,234,212,.18); } :host-context([data-theme='dark']) .live-clock__date { color:#cbd5e1; }
    @media (max-width:1199px) { .live-clock__date { display:none; } } @media (max-width:767px) { :host { display:none; } }
  `],
})
export class LiveClockComponent implements OnInit, OnDestroy {
  time = '';
  date = '';
  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.updateClock();
    this.intervalId = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private updateClock(): void {
    const now = new Date();
    this.time = new Intl.DateTimeFormat('en-BD', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }).format(now);
    this.date = new Intl.DateTimeFormat('en-BD', { weekday: 'short', day: 'numeric', month: 'short' }).format(now);
  }
}
