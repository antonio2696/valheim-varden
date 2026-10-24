import { HttpBackend, HttpEvent, HttpRequest, HttpResponse } from '@angular/common/http';
import { Provider } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import type { AuthenticatedUser } from '../app/auth/auth.store';
import type { ConstructionList } from '../app/pages/home/construction-list.model';

export class InMemoryApiBackend implements HttpBackend {
    private readonly user: AuthenticatedUser = {
        id: 1,
        username: 'viking',
        email: 'viking@example.com',
        admin: false
    };
    private lists: ConstructionList[] = [];

    handle(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
        if (
            request.url === '/api/auth/me' ||
            request.url === '/api/auth/login' ||
            request.url === '/api/auth/register'
        ) {
            return this.response({ success: true, user: this.user });
        }
        if (request.url === '/api/auth/logout') {
            return this.response({ success: true });
        }
        if (request.url === '/api/lists' && request.method === 'GET') {
            return this.response({ success: true, lists: this.lists });
        }
        if (request.url === '/api/lists' && request.method === 'POST') {
            const body = this.record(request.body);
            const list = this.record(body['list']) as unknown as ConstructionList;
            const saved = {
                ...list,
                ownerUserId: this.user.id,
                isShared: body['shared'] === true
            };
            this.lists = [saved, ...this.lists.filter((current) => current.id !== saved.id)];
            return this.response({ success: true, list: saved }, 201);
        }

        const listId = request.url.match(/^\/api\/lists\/([^/?]+)$/)?.[1];
        if (listId && request.method === 'PUT') {
            const body = this.record(request.body);
            const list = this.record(body['list']) as unknown as ConstructionList;
            const saved = {
                ...list,
                ownerUserId: this.lists.find((current) => current.id === listId)?.ownerUserId ?? 1,
                isShared: body['shared'] === true
            };
            this.lists = [saved, ...this.lists.filter((current) => current.id !== listId)];
            return this.response({ success: true, list: saved });
        }
        if (listId && request.method === 'DELETE') {
            this.lists = this.lists.filter((list) => list.id !== listId);
            return this.response({ success: true });
        }

        return this.response({ success: false, message: 'Unexpected test API request.' }, 404);
    }

    private record(value: unknown): Record<string, unknown> {
        return typeof value === 'object' && value !== null
            ? (value as Record<string, unknown>)
            : {};
    }

    private response(body: unknown, status = 200): Observable<HttpEvent<unknown>> {
        return of(new HttpResponse({ status, body }));
    }
}

export function provideTestApi(): Array<Provider | ReturnType<typeof provideHttpClient>> {
    return [provideHttpClient(), { provide: HttpBackend, useClass: InMemoryApiBackend }];
}
