import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LocalStorage, VALIDATION_ERROR } from '@ngx-pwa/local-storage';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { SgrudConfig } from '../sgrud-config';
import { Tokens } from '../typing/tokens';
import { AccessToken } from './access-token';
import { RefreshToken } from './refresh-token';

@Injectable({
  providedIn: 'root'
})

export class AuthService {

  private øtokens: BehaviorSubject<Tokens>;

  public get tokens(): Observable<Tokens> {
    return this.øtokens.pipe(filter<Tokens>(Boolean), switchMap((tokens) => {
      switch (true) {
        default:
        case !tokens.refresh.raw: return of(tokens);
        case !tokens.refresh.valid: return this.logout();
        case !tokens.access.valid: return this.refresh();
      }
    }));
  }

  public constructor(
    private readonly httpClient: HttpClient,
    private readonly localStorage: LocalStorage,
    private readonly sgrudConfig: SgrudConfig
  ) {
    this.øtokens = new BehaviorSubject<Tokens>(null!);

    this.localStorage.getItem<RefreshToken>('refreshToken', {
      schema: RefreshToken.schema
    }).pipe(catchError((error) => {
      return error.message !== VALIDATION_ERROR
        ? throwError(error)
        : of(null);
    })).subscribe((token) => this.øtokens.next({
      access: new AccessToken(),
      refresh: new RefreshToken(token!)
    }));
  }

  public login(loginName: string, password: string): Observable<Tokens> {
    return this.httpClient.post<Record<string, string>>(
      this.sgrudConfig.endpoints.login.href,
      {
        loginName,
        password
      }
    ).pipe(
      map((response) => this.valuate(response)),
      switchMap((tokens) => this.localStorage.setItem(
        'refreshToken',
        tokens.refresh
      ).pipe(map(() => tokens))),
      tap((tokens) => this.øtokens.next(tokens))
    );
  }

  public logout(): Observable<Tokens> {
    return of({
      access: new AccessToken(),
      refresh: new RefreshToken()
    }).pipe(
      switchMap((tokens) => this.localStorage.setItem(
        'refreshToken',
        tokens.refresh
      ).pipe(map(() => tokens))),
      tap((tokens) => this.øtokens.next(tokens))
    );
  }

  public refresh(): Observable<Tokens> {
    return this.httpClient.get<Record<string, string>>(
      this.sgrudConfig.endpoints.refresh.href,
      {
        headers: {
          authorization: `Bearer ${this.øtokens.value.refresh.raw}`
        }
      }
    ).pipe(
      map((response) => this.valuate(response)),
      tap((tokens) => this.øtokens.next(tokens))
    );
  }

  private valuate(response?: Record<string, string | undefined>): Tokens {
    const tokens: Tokens = this.øtokens.value;

    for (const key in response) {
      if (response[key]) {
        const base64: string = response[key]!.split('.')[1];
        const token: Record<string, any> = JSON.parse(atob(base64));
        token.raw = response[key];

        switch (key) {
          case 'access':
            tokens.access = new AccessToken(token);
            break;

          case 'refresh':
            tokens.refresh = new RefreshToken(token);
            break;
        }
      }
    }

    return tokens;
  }

}
