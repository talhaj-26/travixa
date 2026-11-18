import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { CmsLanguage, CmsPage, CmsPageRequest, CmsPageStatus } from '../../../core/models/cms-page.model';
import { CmsPageService } from '../../../core/services/cms-page.service';

@Component({
  selector: 'app-content-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './content-management.component.html',
  styleUrl: './content-management.component.scss',
})
export class ContentManagementComponent implements OnInit {
  private readonly cmsService = inject(CmsPageService);
  pages: CmsPage[] = [];
  languages: CmsLanguage[] = [];
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';
  editorOpen = false;
  editingId: number | null = null;
  filter: 'ALL' | CmsPageStatus = 'ALL';
  readonly filters: Array<'ALL' | CmsPageStatus> = ['ALL', 'DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED'];
  form: CmsPageRequest = this.emptyForm();

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    forkJoin({ pages: this.cmsService.getAll(), languages: this.cmsService.getEnabledLanguages() }).subscribe({
      next: ({ pages, languages }) => { this.pages = pages; this.languages = languages; this.loading = false; },
      error: () => { this.errorMessage = 'CMS records could not be loaded. Check your access and API connection.'; this.loading = false; },
    });
  }

  get visiblePages(): CmsPage[] { return this.filter === 'ALL' ? this.pages : this.pages.filter((page) => page.status === this.filter); }

  startCreate(): void {
    this.editingId = null;
    this.form = { ...this.emptyForm(), languageId: this.languages.find((item) => item.defaultLanguage)?.id ?? this.languages[0]?.id ?? 0 };
    this.editorOpen = true;
    this.successMessage = '';
  }

  startEdit(page: CmsPage): void {
    this.editingId = page.id;
    this.form = { slug: page.slug, title: page.title, content: page.content, languageId: page.languageId, status: page.status };
    this.editorOpen = true;
    this.successMessage = '';
  }

  closeEditor(): void { this.editorOpen = false; }

  save(): void {
    this.errorMessage = '';
    this.successMessage = '';
    if (!this.form.languageId) { this.errorMessage = 'Select an enabled language before saving.'; return; }
    this.saving = true;
    const operation = this.editingId === null ? this.cmsService.create(this.form) : this.cmsService.update(this.editingId, this.form);
    operation.subscribe({
      next: (saved) => { this.saving = false; this.editorOpen = false; this.successMessage = `“${saved.title}” saved as ${this.statusLabel(saved.status)}.`; this.load(); },
      error: (error: { error?: { detail?: string; message?: string } }) => { this.saving = false; this.errorMessage = error.error?.detail ?? error.error?.message ?? 'CMS page could not be saved.'; },
    });
  }

  archive(page: CmsPage): void {
    this.errorMessage = '';
    const request: CmsPageRequest = { slug: page.slug, title: page.title, content: page.content, languageId: page.languageId, status: 'ARCHIVED' };
    this.cmsService.update(page.id, request).subscribe({
      next: () => { this.successMessage = `“${page.title}” archived.`; this.load(); },
      error: (error: { error?: { detail?: string; message?: string } }) => { this.errorMessage = error.error?.detail ?? error.error?.message ?? 'Page could not be archived.'; },
    });
  }

  delete(page: CmsPage): void {
    if (!window.confirm(`Delete “${page.title}” permanently?`)) return;
    this.cmsService.delete(page.id).subscribe({
      next: () => { this.successMessage = `“${page.title}” deleted.`; this.load(); },
      error: (error: { error?: { detail?: string; message?: string } }) => { this.errorMessage = error.error?.detail ?? error.error?.message ?? 'Page could not be deleted.'; },
    });
  }

  statusLabel(status: CmsPageStatus | 'ALL'): string { return status === 'ALL' ? 'All statuses' : status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()); }
  languageName(id: number): string { return this.languages.find((language) => language.id === id)?.nativeName ?? 'Language'; }
  trackById(_: number, page: CmsPage): number { return page.id; }
  private emptyForm(): CmsPageRequest { return { slug: '', title: '', content: '', languageId: 0, status: 'DRAFT' }; }
}
