# Auth Flow (JWT)

Stateless JWT auth. The frontend stores the token in `localStorage` and sends it as
`Authorization: Bearer <token>` on API calls.

## Register
```
POST /api/auth/register {email, password, fullName}
  → AuthService.register
      • reject if email exists (409 EmailAlreadyExistsException)
      • hash password (BCrypt)
      • save users row (role=USER, plan=REGULAR)
      • issue JWT
  → 201 { token, tokenType, expiresInMs, user }
```

## Login
```
POST /api/auth/login {email, password}
  → AuthService.login
      • AuthenticationManager.authenticate(...)   (bad creds → 401; disabled account → 403)
      • load user, issue JWT
  → 200 { token, tokenType, expiresInMs, user }
```
A disabled account (admin-set `users.enabled = false`, see `admin-monitoring.md`) can't log
in — `DaoAuthenticationProvider` throws `DisabledException`, mapped to **403** "This account
has been disabled." An already-issued JWT from *before* being disabled still works until it
expires — this only blocks new logins, it doesn't revoke a live session.

## Protected request
```
GET /api/users/me   Authorization: Bearer <token>
  → JwtAuthenticationFilter
      • extract + verify token (signature, expiry) via JwtService
      • load user via CustomUserDetailsService (by email)
      • set SecurityContext authentication
  → controller runs with @AuthenticationPrincipal User
```

## Key components (backend `security/`)
| Component                  | Role                                                       |
|----------------------------|------------------------------------------------------------|
| `SecurityConfig`           | Stateless chain, CORS, public vs. protected routes.        |
| `JwtService`               | Generate/verify HMAC-signed JWTs.                          |
| `JwtAuthenticationFilter`  | Per-request bearer-token authentication.                   |
| `CustomUserDetailsService` | Load `User` by email.                                     |

## Public vs. protected
- **Public:** `/api/auth/**`, `/actuator/health`, `/actuator/info`.
- **Admin-only:** `/api/admin/**` (valid JWT **with ROLE_ADMIN**; else 403). Enforced in
  `SecurityConfig` and again via `@PreAuthorize` on the controller. See `admin-monitoring.md`.
- **Protected:** everything else (valid JWT required).
