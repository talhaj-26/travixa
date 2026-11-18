import { User, UserRole } from './user.model';


//---------------------------------New
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
}

/** Exact token fields returned by the Spring Boot backend. */
export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  refreshToken: string;
  username: string;
  email: string;
  roles: string[];
}

/**
 * Compatibility model for existing Angular components that
 * currently expect response.user.
 */
export interface AuthResponse extends TokenResponse {
  user: User;
}

//---------------------------------End

export interface AuthSession {
  user: User;
  accessToken: string;
  expiresAt?: number;
}
