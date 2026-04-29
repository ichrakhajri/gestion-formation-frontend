import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { TokenService } from './token.service';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API = 'http://localhost:8080/api/auth';

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {}

  login(login: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.API}/login`, { login, password }).pipe(
      tap(response => {
        // Extract role string from Spring Security authorities array
        // Spring returns: [{ authority: 'ROLE_ADMINISTRATEUR' }]
        const rawRole = response.role[0]?.authority ?? 'ROLE_USER';
        const role = rawRole.replace('ROLE_', '').toLowerCase();

        const user: User = {
          login: login,
          role: role,
          token: response.token
        };

        this.tokenService.saveToken(response.token);
        this.tokenService.saveUser(user);
      })
    );
  }

  logout(): void {
    this.tokenService.clear();
  }

  isLoggedIn(): boolean {
    return this.tokenService.isLoggedIn();
  }

  getRole(): string | null {
    return this.tokenService.getRole();
  }

  getUser(): User | null {
    return this.tokenService.getUser();
  }
}