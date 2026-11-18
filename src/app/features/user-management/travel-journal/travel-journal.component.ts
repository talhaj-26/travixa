import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../shared/toast/toast.service';

interface JournalEntry { id: number; title: string; destination: string; date: string; story: string; mood: string; }

@Component({
  selector: 'app-travel-journal', standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <section class="journal-page"><header><span>MY TRAVEL JOURNAL</span><h1>Keep every journey close.</h1><p>Save moments, memories and places you want to revisit.</p></header>
    <div class="journal-layout"><form class="entry-form" (ngSubmit)="save()"><h2>{{ editingId ? 'Edit memory' : 'Add a memory' }}</h2>
      <label>Title<input name="title" [(ngModel)]="draft.title" placeholder="Sunset at Laboni Beach" required /></label>
      <label>Destination<input name="destination" [(ngModel)]="draft.destination" placeholder="Cox's Bazar" required /></label>
      <label>Travel date<input name="date" [(ngModel)]="draft.date" type="date" required /></label>
      <label>Mood<select name="mood" [(ngModel)]="draft.mood"><option>✨ Amazing</option><option>🌿 Peaceful</option><option>🏔 Adventurous</option><option>🍲 Delicious</option></select></label>
      <label>Memory<textarea name="story" [(ngModel)]="draft.story" rows="5" placeholder="What made this trip special?" required></textarea></label>
      <div class="form-actions"><button class="primary" type="submit">{{ editingId ? 'Update entry' : 'Save to journal' }}</button>@if (editingId) { <button type="button" class="secondary" (click)="reset()">Cancel</button> }</div>
    </form>
    <div class="entries">@if (!entries.length) { <div class="empty">✦<h2>Your story starts here.</h2><p>Add your first travel memory.</p></div> } @else { @for (entry of entries; track entry.id) { <article><div class="entry-meta"><span>{{ entry.mood }}</span><time>{{ entry.date | date:'d MMM y' }}</time></div><h2>{{ entry.title }}</h2><strong>⌖ {{ entry.destination }}</strong><p>{{ entry.story }}</p><footer><button type="button" (click)="edit(entry)">Edit</button><button type="button" class="danger" (click)="remove(entry.id)">Delete</button></footer></article> } }</div>
    </div></section>`,
  styles: [`
    .journal-page{max-width:1180px;margin:0 auto;padding:8rem 1.5rem 5rem;color:var(--color-text,#334155)}header span{color:var(--color-primary-700,#0f766e);font:800 .7rem var(--font-mono,monospace);letter-spacing:.15em}h1{margin:.55rem 0;font:800 clamp(2rem,5vw,3.6rem) var(--font-display,serif);color:var(--color-heading,#0f172a)}header p{max-width:42rem;color:var(--color-muted,#64748b)}.journal-layout{display:grid;grid-template-columns:minmax(280px,.85fr) 1.4fr;gap:1.5rem;margin-top:2.5rem}.entry-form,article,.empty{border:1px solid var(--color-border,#e2e8f0);border-radius:1.2rem;background:var(--color-surface,#fff);box-shadow:0 1rem 2.4rem rgba(15,23,42,.06)}.entry-form{padding:1.35rem;height:max-content}.entry-form h2{margin:0 0 1rem;color:var(--color-heading,#0f172a);font:750 1.2rem var(--font-display,serif)}label{display:grid;gap:.4rem;margin:.7rem 0;font-size:.8rem;font-weight:750}input,textarea,select{width:100%;border:1px solid var(--color-border-2,#cbd5e1);border-radius:.65rem;padding:.65rem .72rem;background:transparent;color:inherit;font:inherit}.form-actions,footer{display:flex;gap:.55rem;margin-top:1rem}button{border:0;border-radius:.65rem;padding:.6rem .85rem;font:750 .78rem var(--font-body,sans-serif);cursor:pointer}.primary{background:var(--color-primary-700,#0f766e);color:#fff}.secondary{background:var(--color-bg-2,#f1f5f9);color:inherit}.entries{display:grid;gap:1rem}article{padding:1.25rem}.entry-meta{display:flex;justify-content:space-between;color:var(--color-muted,#64748b);font-size:.78rem}article h2{margin:.8rem 0 .35rem;color:var(--color-heading,#0f172a);font:750 1.35rem var(--font-display,serif)}article strong{color:var(--color-primary-700,#0f766e);font-size:.82rem}article p{line-height:1.65}footer{justify-content:flex-end;border-top:1px solid var(--color-border,#e2e8f0);padding-top:.8rem}footer button{background:var(--color-bg-2,#f1f5f9)}footer .danger{color:#dc2626}.empty{text-align:center;padding:4rem 1rem;color:var(--color-muted,#64748b)}.empty h2{color:var(--color-heading,#0f172a)}:host-context([data-theme='dark']) .entry-form,:host-context([data-theme='dark']) article,:host-context([data-theme='dark']) .empty{background:#172033;border-color:rgba(148,163,184,.2)}:host-context([data-theme='dark']) h1,:host-context([data-theme='dark']) article h2,:host-context([data-theme='dark']) .empty h2,:host-context([data-theme='dark']) .entry-form h2{color:#f8fafc}@media(max-width:800px){.journal-page{padding-top:6.5rem}.journal-layout{grid-template-columns:1fr}}
  `],
})
export class TravelJournalComponent {
  private readonly toast = inject(ToastService); private readonly key = 'travixa-travel-journal';
  entries: JournalEntry[] = this.read(); editingId: number | null = null;
  draft: Omit<JournalEntry, 'id'> = { title: '', destination: '', date: '', story: '', mood: '✨ Amazing' };
  save(): void { if (!this.draft.title.trim() || !this.draft.destination.trim() || !this.draft.date || !this.draft.story.trim()) return; const entry: JournalEntry = { id: this.editingId ?? Date.now(), ...this.draft, title: this.draft.title.trim(), destination: this.draft.destination.trim(), story: this.draft.story.trim() }; this.entries = this.editingId ? this.entries.map((item) => item.id === entry.id ? entry : item) : [entry, ...this.entries]; this.persist(); this.toast.success(this.editingId ? 'Memory updated' : 'Memory saved', 'Your travel journal is stored on this device.'); this.reset(); }
  edit(entry: JournalEntry): void { this.editingId = entry.id; this.draft = { title: entry.title, destination: entry.destination, date: entry.date, story: entry.story, mood: entry.mood }; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  remove(id: number): void { this.entries = this.entries.filter((entry) => entry.id !== id); this.persist(); this.toast.info('Memory removed', 'The journal entry was deleted.'); }
  reset(): void { this.editingId = null; this.draft = { title: '', destination: '', date: '', story: '', mood: '✨ Amazing' }; }
  private read(): JournalEntry[] { try { return JSON.parse(localStorage.getItem(this.key) ?? '[]') as JournalEntry[]; } catch { return []; } } private persist(): void { localStorage.setItem(this.key, JSON.stringify(this.entries)); }
}
