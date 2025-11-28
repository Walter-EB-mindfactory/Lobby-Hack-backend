# API Documentation for Frontend Integration

## Base URL
```
http://localhost:3000/api
```

## Authentication Endpoints

### 1. Register User (Local Auth)
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "Juan",
  "lastName": "Pérez"
}
```

**Response 201:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...",
  "user": {
    "id": "uuid-123",
    "email": "user@example.com",
    "name": "Juan Pérez",
    "roles": ["visitante"]
  }
}
```

### 2. Login (Local Auth)
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...",
  "user": {
    "id": "uuid-123",
    "email": "user@example.com",
    "name": "Juan Pérez",
    "roles": ["visitante"]
  }
}
```

### 3. Iniciar Login con Google (Federated)
```http
GET /auth/google
```

**Response 302:** Redirect to Google OAuth

**En Angular:**
```typescript
loginWithGoogle(): void {
  window.location.href = 'http://localhost:3000/api/auth/google';
}
```

### 4. Callback de Google
```http
GET /auth/google/callback?code=<authorization_code>
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...",
  "refreshToken": "1//0gabcdef...",
  "user": {
    "id": "uuid-123",
    "googleId": "11223344556677889900",
    "email": "lautaro@example.com",
    "name": "Lautaro Murua",
    "roles": ["autorizante"]
  }
}
```

### 5. Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "1//0gabcdef..."
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC..."
}
```

### 6. Get Profile
```http
GET /auth/profile
Authorization: Bearer <accessToken>
```

**Response 200:**
```json
{
  "id": "uuid-123",
  "email": "user@example.com",
  "roles": ["autorizante"]
}
```

## Angular Integration Example

### Service
```typescript
// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    googleId?: string;
    email: string;
    name: string;
    roles: string[];
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load user from localStorage on init
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  // Local login
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }

  // Register
  register(email: string, password: string, firstName?: string, lastName?: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, { 
      email, 
      password, 
      firstName, 
      lastName 
    }).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  // Google OAuth login
  loginWithGoogle(): void {
    window.location.href = `${this.apiUrl}/google`;
  }

  // Refresh token
  refreshToken(refreshToken: string): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          localStorage.setItem('accessToken', response.accessToken);
        })
      );
  }

  // Get profile
  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  // Logout
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  // Helper to handle auth response
  private handleAuthResponse(response: LoginResponse): void {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  // Get current access token
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // Get refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }
}
```

### Interceptor
```typescript
// auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getAccessToken();

    if (token) {
      req = this.addToken(req, token);
    }

    return next.handle(req).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = this.authService.getRefreshToken();

      if (refreshToken) {
        return this.authService.refreshToken(refreshToken).pipe(
          switchMap((response: any) => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next(response.accessToken);
            return next.handle(this.addToken(request, response.accessToken));
          }),
          catchError(err => {
            this.isRefreshing = false;
            this.authService.logout();
            return throwError(() => err);
          })
        );
      }
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token != null),
      take(1),
      switchMap(token => next.handle(this.addToken(request, token)))
    );
  }
}
```

### Guard
```typescript
// auth.guard.ts
import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isAuthenticated()) {
      // Check roles if needed
      const requiredRoles = route.data['roles'] as Array<string>;
      if (requiredRoles) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const hasRole = requiredRoles.some(role => user.roles?.includes(role));
        
        if (!hasRole) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
      }
      return true;
    }

    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
```

### App Module Registration
```typescript
// app.module.ts
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';

@NgModule({
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
})
export class AppModule {}
```

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refresh Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Roles
- `admin` - Full access
- `recepcionista` - Receptionist access
- `autorizante` - Authorizer access
- `visitante` - Basic visitor access (default)

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be longer than 8 characters"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Email already exists"
}
```
