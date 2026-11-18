import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserResponse } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';

@Component({ selector: 'app-user-directory', standalone: true, imports: [CommonModule, FormsModule, RouterLink], templateUrl: './user-directory.component.html', styleUrl: './user-directory.component.scss' })
export class UserDirectoryComponent implements OnInit {
  users: UserResponse[] = []; search = ''; roleFilter = 'ALL'; statusFilter = 'ALL'; loading = true; savingUsername = ''; error = ''; message = ''; page = 0; readonly pageSize = 10;
  constructor(private readonly userService: UserService) {}
  ngOnInit(): void { this.load(); }
  get filtered(): UserResponse[] { const term = this.search.trim().toLowerCase(); return this.users.filter(user => { const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.toLowerCase(); return (!term || name.includes(term) || user.username.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)) && (this.roleFilter === 'ALL' || user.roles.includes(this.roleFilter)) && (this.statusFilter === 'ALL' || (this.statusFilter === 'ACTIVE') === user.enabled); }); }
  get rows(): UserResponse[] { return this.filtered.slice(this.page * this.pageSize, (this.page + 1) * this.pageSize); }
  get pageCount(): number { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }
  get activeCount(): number { return this.users.filter(user => user.enabled).length; }
  get partnerCount(): number { return this.users.filter(user => user.roles.some(role => ['HOTEL_PARTNER','RESTAURANT_PARTNER','TRAVEL_AGENCY_PARTNER','TOUR_GUIDE','TRANSPORT_PROVIDER','DRIVER'].includes(role))).length; }
  initials(user: UserResponse): string { return `${user.firstName?.[0] ?? user.username[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase(); }
  setFilter(): void { this.page = 0; }
  toggleStatus(user: UserResponse): void { const next = !user.enabled; this.savingUsername = user.username; this.error = ''; this.message = ''; this.userService.updateStatus(user.username, { enabled: next }).subscribe({ next: updated => { this.users = this.users.map(item => item.username === user.username ? updated : item); this.message = `${user.username} ${next ? 'activated' : 'disabled'}.`; this.savingUsername = ''; }, error: error => { this.error = this.errorMessage(error); this.savingUsername = ''; } }); }
  private load(): void { this.loading = true; this.userService.getAll().subscribe({ next: users => { this.users = users ?? []; this.loading = false; }, error: error => { this.error = this.errorMessage(error); this.loading = false; } }); }
  private errorMessage(error: unknown): string { if (error instanceof HttpErrorResponse) { if (!error.status) return 'Cannot connect to the backend. Check that TRAVIXA is running.'; if (error.status === 401) return 'Your session has expired. Please sign in again.'; if (error.status === 403) return 'Your account cannot access the user directory.'; return error.error?.message ?? `The request failed (${error.status}).`; } return 'The user directory could not be loaded.'; }
}
