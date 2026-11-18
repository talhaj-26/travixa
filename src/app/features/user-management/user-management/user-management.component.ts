
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  UserCreateRequest,
  UserResponse,
  UserRole,
  UserUpdateRequest,
} from '../../../core/models/user.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ConfirmDialogComponent,
],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent implements OnInit {
  users: UserResponse[] = [];
  filteredUsers: UserResponse[] = [];

  userForm!: FormGroup;

  isEditMode = false;
  isEditorOpen = false;
  isViewOpen = false;
  isLoading = false;

  editingUsername: string | null = null;
  selectedUser: UserResponse | null = null;
  pendingDelete: UserResponse | null = null;

  searchTerm = '';
  selectedStatus = 'ALL';

  errorMessage = '';
  successMessage = '';

  readonly isSuperAdmin: boolean;
  readonly isAdmin: boolean;

  readonly roles: Array<{ value: UserRole; label: string }> = [
    { value: 'CUSTOMER', label: 'Customer / Traveler' },
    { value: 'HOTEL_PARTNER', label: 'Hotel Partner' },
    { value: 'HOTEL_STAFF', label: 'Hotel Staff' },
    { value: 'RESTAURANT_PARTNER', label: 'Restaurant Partner' },
    { value: 'RESTAURANT_STAFF', label: 'Restaurant Staff' },
    { value: 'TRAVEL_AGENCY_PARTNER', label: 'Travel Agency Partner' },
    { value: 'TRAVEL_AGENCY_STAFF', label: 'Travel Agency Staff' },
    { value: 'TOUR_GUIDE', label: 'Tour Guide' },
    { value: 'TRANSPORT_PROVIDER', label: 'Transport Provider' },
    { value: 'DRIVER', label: 'Driver' },
    { value: 'SUPPORT_EXECUTIVE', label: 'Support Executive' },
    { value: 'FINANCE_ACCOUNTANT', label: 'Finance / Accountant' },
    { value: 'CONTENT_MANAGER', label: 'Content Manager' },
    { value: 'ROLE_USER', label: 'Standard User' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {
    const role = this.authService.getCurrentRole();

    this.isSuperAdmin = role === 'SUPER_ADMIN';
    this.isAdmin = role === 'ADMIN';
  }

  ngOnInit(): void {
    console.count('UserManagementComponent initialized');
    this.createForm();
    this.loadUsers();
  }

  // --------------------------------------------------
  // ROLE PERMISSIONS
  // --------------------------------------------------

  get availableRoles(): Array<{ value: UserRole; label: string }> {
    return this.isSuperAdmin
      ? this.roles
      : this.roles.filter(
        (role) =>
          role.value !== 'ADMIN' &&
          role.value !== 'SUPER_ADMIN',
      );
  }

  canManage(user: UserResponse): boolean {
    if (this.isSuperAdmin) {
      return true;
    }

    return !user.roles.some(
      (role) =>
        role === 'ADMIN' ||
        role === 'SUPER_ADMIN',
    );
  }

  canDelete(user: UserResponse): boolean {
    return this.canManage(user);
  }

  // --------------------------------------------------
  // FORM
  // --------------------------------------------------

  createForm(): void {
    this.userForm = this.fb.group({
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      firstName: [
        '',
        [
          Validators.required,
          Validators.maxLength(100),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.maxLength(100),
        ],
      ],
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(254),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(72),
        ],
      ],
      roles: [
        ['CUSTOMER' as UserRole],
        Validators.required,
      ],
    });
  }

  private setPasswordValidators(): void {
    const passwordControl = this.userForm.get('password');

    if (!passwordControl) {
      return;
    }

    if (this.isEditMode) {
      passwordControl.clearValidators();
    } else {
      passwordControl.setValidators([
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(72),
      ]);
    }

    passwordControl.updateValueAndValidity({
      emitEvent: false,
    });
  }

  get f() {
    return this.userForm.controls;
  }

  // --------------------------------------------------
  // LOAD AND FILTER USERS
  // --------------------------------------------------

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getAll().subscribe({
      next: (data) => {
        this.users = data ?? [];
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(
          error,
          'Unable to load users from the TRAVIXA backend.',
        );

        this.isLoading = false;
      },
    });
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredUsers = this.users.filter((user) => {
      const fullName = this.fullName(user).toLowerCase();

      const matchesSearch =
        !search ||
        fullName.includes(search) ||
        user.username.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.roles.some((role) =>
          role.toLowerCase().includes(search),
        );

      const matchesStatus =
        this.selectedStatus === 'ALL' ||
        (this.selectedStatus === 'ACTIVE' && user.enabled) ||
        (this.selectedStatus === 'INACTIVE' && !user.enabled);

      return matchesSearch && matchesStatus;
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'ALL';
    this.applyFilters();
  }

  // --------------------------------------------------
  // CREATE USER
  // --------------------------------------------------

  openCreate(): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.isEditMode = false;
    this.editingUsername = null;
    this.selectedUser = null;
    this.isViewOpen = false;

    this.userForm.enable();

    this.userForm.reset({
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      roles: ['CUSTOMER'],
    });

    this.setPasswordValidators();
    this.isEditorOpen = true;
  }

  private createUser(request: UserCreateRequest): void {
    this.isLoading = true;

    this.userService.add(request).subscribe({
      next: () => {
        this.successMessage = 'User created successfully.';
        this.closeEditor();
        this.loadUsers();
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(
          error,
          'Failed to create user.',
        );

        this.isLoading = false;
      },
    });
  }

  // --------------------------------------------------
  // EDIT USER
  // --------------------------------------------------

  editUser(user: UserResponse): void {
    if (!this.canManage(user)) {
      this.errorMessage =
        'You do not have permission to edit this account.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.selectedUser = null;
    this.isViewOpen = false;

    this.isEditMode = true;
    this.editingUsername = user.username;

    this.userForm.enable();

    this.userForm.reset({
      username: user.username,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email,
      password: '',
      roles: user.roles,
    });

    // The current backend PUT endpoint updates profile fields only.
    this.userForm.get('username')?.disable();
    this.userForm.get('roles')?.disable();

    this.setPasswordValidators();
    this.isEditorOpen = true;
  }

  private updateUser(
    username: string,
    request: UserUpdateRequest,
  ): void {
    this.isLoading = true;

    this.userService.update(username, request).subscribe({
      next: () => {
        this.successMessage = 'User updated successfully.';
        this.closeEditor();
        this.loadUsers();
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(
          error,
          'Failed to update user.',
        );

        this.isLoading = false;
      },
    });
  }

  submitForm(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const value = this.userForm.getRawValue();

    if (this.isEditMode && this.editingUsername) {
      const request: UserUpdateRequest = {
        firstName: String(value.firstName).trim(),
        lastName: String(value.lastName).trim(),
        email: String(value.email).trim().toLowerCase(),
      };

      this.updateUser(this.editingUsername, request);
      return;
    }

    const requestedRoles = value.roles as UserRole[];

    if (
      !this.isSuperAdmin &&
      requestedRoles.some(
        (role) =>
          role === 'ADMIN' ||
          role === 'SUPER_ADMIN',
      )
    ) {
      this.errorMessage =
        'Only SUPER_ADMIN can assign administrator roles.';
      return;
    }

    const request: UserCreateRequest = {
      username: String(value.username).trim(),
      firstName: String(value.firstName).trim(),
      lastName: String(value.lastName).trim(),
      email: String(value.email).trim().toLowerCase(),
      password: String(value.password),
      roles: requestedRoles,
    };

    this.createUser(request);
  }

  closeEditor(): void {
    this.isEditorOpen = false;
    this.userForm.enable();

    this.isEditMode = false;
    this.editingUsername = null;

    this.userForm.reset({
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      roles: ['CUSTOMER'],
    });

    this.setPasswordValidators();
  }

  // --------------------------------------------------
  // VIEW USER
  // --------------------------------------------------

  viewUser(user: UserResponse): void {
    this.selectedUser = user;
    this.isViewOpen = true;
  }

  closeView(): void {
    this.isViewOpen = false;
    this.selectedUser = null;
  }

  // --------------------------------------------------
  // ENABLE / DISABLE USER
  // --------------------------------------------------

  toggleStatus(user: UserResponse): void {
    if (!this.canManage(user)) {
      this.errorMessage =
        'You do not have permission to change this account status.';
      return;
    }

    const enabled = !user.enabled;

    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    this.userService
      .updateStatus(user.username, { enabled })
      .subscribe({
        next: () => {
          this.successMessage = enabled
            ? `${user.username} has been enabled.`
            : `${user.username} has been disabled.`;

          this.loadUsers();
        },
        error: (error: unknown) => {
          this.errorMessage = this.getErrorMessage(
            error,
            'Failed to change account status.',
          );

          this.isLoading = false;
        },
      });
  }

  // --------------------------------------------------
  // DELETE USER
  // --------------------------------------------------

  deleteUser(user: UserResponse): void {
    if (!this.canDelete(user)) {
      this.errorMessage =
        'You do not have permission to remove this account.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.pendingDelete = user;
  }

  confirmDelete(): void {
    const user = this.pendingDelete;

    if (!user) {
      return;
    }

    if (!this.canDelete(user)) {
      this.errorMessage =
        'You do not have permission to remove this account.';

      this.pendingDelete = null;
      return;
    }

    this.isLoading = true;

    this.userService.delete(user.username).subscribe({
      next: () => {
        this.pendingDelete = null;
        this.successMessage =
          `${user.username} deleted successfully.`;

        this.loadUsers();
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(
          error,
          'Failed to delete user.',
        );

        this.isLoading = false;
      },
    });
  }

  cancelDelete(): void {
    this.pendingDelete = null;
  }

  // --------------------------------------------------
  // DISPLAY HELPERS
  // --------------------------------------------------

  fullName(user: UserResponse): string {
    return [
      user.firstName,
      user.lastName,
    ]
      .filter((part): part is string =>
        Boolean(part?.trim()),
      )
      .join(' ') || user.username;
  }

  initials(user: UserResponse): string {
    const name = this.fullName(user);

    return (
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || 'U'
    );
  }

  roleLabel(role: string): string {
    return role
      .replace(/^ROLE_/, '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  formatDate(value: string | null): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString();
  }

  // --------------------------------------------------
  // DASHBOARD METRICS
  // --------------------------------------------------

  get totalUsers(): number {
    return this.users.length;
  }

  get activeUsers(): number {
    return this.users.filter(
      (user) => user.enabled,
    ).length;
  }

  get inactiveUsers(): number {
    return this.users.filter(
      (user) => !user.enabled,
    ).length;
  }

  get administratorUsers(): number {
    return this.users.filter((user) =>
      user.roles.some(
        (role) =>
          role === 'ADMIN' ||
          role === 'SUPER_ADMIN',
      ),
    ).length;
  }

  get partnerUsers(): number {
    const partnerRoles: string[] = [
      'HOTEL_PARTNER',
      'HOTEL_STAFF',
      'RESTAURANT_PARTNER',
      'RESTAURANT_STAFF',
      'TRAVEL_AGENCY_PARTNER',
      'TRAVEL_AGENCY_STAFF',
      'TOUR_GUIDE',
      'TRANSPORT_PROVIDER',
      'DRIVER',
    ];

    return this.users.filter((user) =>
      user.roles.some((role) =>
        partnerRoles.includes(role),
      ),
    ).length;
  }

  // --------------------------------------------------
  // ERROR HANDLING
  // --------------------------------------------------

  private getErrorMessage(
    error: unknown,
    fallback: string,
  ): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Cannot connect to the backend. Check that TRAVIXA is running.';
      }

      if (error.status === 401) {
        return 'Your session has expired. Please sign in again.';
      }

      if (error.status === 403) {
        return 'Access denied. Your account does not have permission for this action.';
      }

      if (error.status === 404) {
        return error.error?.message ||
          'The requested user could not be found.';
      }

      if (error.status === 409) {
        return error.error?.message ||
          'Username or email is already in use.';
      }

      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }

      if (error.error?.message) {
        return error.error.message;
      }
    }

    return fallback;
  }
}
