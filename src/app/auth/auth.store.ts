import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface AuthenticatedUser {
    id: number;
    username: string;
    email: string;
    admin: boolean;
}

interface AuthResponse {
    success: boolean;
    user: AuthenticatedUser;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
    private readonly http = inject(HttpClient);
    readonly user = signal<AuthenticatedUser | null>(null);
    readonly error = signal<string | null>(null);
    readonly isLoading = signal(false);
    private activeRequests = 0;
    private sessionCheck?: Promise<boolean>;

    ensureSession(): Promise<boolean> {
        if (this.user()) {
            return Promise.resolve(true);
        }
        if (!this.sessionCheck) {
            this.sessionCheck = this.checkSession().finally(() => {
                this.sessionCheck = undefined;
            });
        }
        return this.sessionCheck;
    }

    async login(username: string, password: string): Promise<boolean> {
        return this.authenticate('/api/auth/login', { username, password });
    }

    async register(username: string, email: string, password: string): Promise<boolean> {
        return this.authenticate('/api/auth/register', { username, email, password });
    }

    async logout(): Promise<boolean> {
        this.error.set(null);
        return this.trackRequest(async () => {
            try {
                await firstValueFrom(
                    this.http.post('/api/auth/logout', {}, { withCredentials: true })
                );
                this.user.set(null);
                return true;
            } catch (error) {
                this.setError(error, 'Não foi possível encerrar a sessão.');
                return false;
            }
        });
    }

    clearError(): void {
        this.error.set(null);
    }

    private async checkSession(): Promise<boolean> {
        return this.trackRequest(async () => {
            try {
                const response = await firstValueFrom(
                    this.http.get<AuthResponse>('/api/auth/me', { withCredentials: true })
                );
                this.user.set(response.user);
                return true;
            } catch (error) {
                this.user.set(null);
                if (!(error instanceof HttpErrorResponse && error.status === 401)) {
                    this.setError(error, 'Não foi possível verificar sua sessão.');
                }
                return false;
            }
        });
    }

    private async authenticate(
        endpoint: string,
        credentials: { username: string; password: string; email?: string }
    ): Promise<boolean> {
        this.error.set(null);
        return this.trackRequest(async () => {
            try {
                const response = await firstValueFrom(
                    this.http.post<AuthResponse>(endpoint, credentials, { withCredentials: true })
                );
                this.user.set(response.user);
                return true;
            } catch (error) {
                this.setError(error, 'Não foi possível autenticar.');
                return false;
            }
        });
    }

    private async trackRequest<T>(request: () => Promise<T>): Promise<T> {
        this.activeRequests += 1;
        this.isLoading.set(true);
        try {
            return await request();
        } finally {
            this.activeRequests -= 1;
            this.isLoading.set(this.activeRequests > 0);
        }
    }

    private setError(error: unknown, fallbackMessage: string): void {
        const apiMessage =
            error instanceof HttpErrorResponse &&
            typeof error.error === 'object' &&
            error.error !== null &&
            'message' in error.error &&
            typeof error.error.message === 'string'
                ? error.error.message
                : null;
        this.error.set(apiMessage ?? fallbackMessage);
    }
}
