import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LocalStorage, VALIDATION_ERROR } from '@ngx-pwa/local-storage';
import { BehaviorSubject, combineLatest, EMPTY, Observable, of, Subscription, throwError, timer } from 'rxjs';
import { catchError, defaultIfEmpty, filter, map, tap } from 'rxjs/operators';
import { SgrudConfig } from '../sgrud-config';
import { Tokens } from '../typing/tokens';
import { AccessToken } from './access-token';
import { RefreshToken } from './refresh-token';

@Injectable({
  providedIn: 'root'
})

export class AuthService {

  private readonly øaccessToken: BehaviorSubject<AccessToken>;

  private readonly ørefreshToken: BehaviorSubject<RefreshToken>;

  private øtimeout: Subscription = EMPTY.subscribe();

  public get tokens(): Observable<Tokens> {
    return combineLatest([
      this.øaccessToken.pipe(filter((accessToken) => accessToken.exp >= 0)),
      this.ørefreshToken.pipe(filter((refreshToken) => refreshToken.exp >= 0))
    ]).pipe(map(([accessToken, refreshToken]) => ({
      access: accessToken,
      refresh: refreshToken
    })));
  }

  public constructor(
    private readonly httpClient: HttpClient,
    private readonly localStorage: LocalStorage,
    private readonly sgrudConfig: SgrudConfig
  ) {
    this.øaccessToken = new BehaviorSubject<AccessToken>(new AccessToken({
      exp: -1
    }));

    this.ørefreshToken = new BehaviorSubject<RefreshToken>(new RefreshToken({
      exp: -1
    }));

    this.localStorage.getItem<RefreshToken>('refreshToken', {
      schema: RefreshToken.schema
    }).pipe(
      catchError((error) => {
        return error.message !== VALIDATION_ERROR
          ? throwError(error)
          : defaultIfEmpty();
      }),
      map((refreshToken) => this.update({
        refresh: new RefreshToken(refreshToken!).raw
      }))
    ).subscribe(() => this.ørefreshToken.subscribe((token) => {
      this.localStorage.setItem('refreshToken', token).subscribe();
    }));
  }

  public login(loginName: string, password: string): Observable<Tokens> {
    return this.httpClient.post<Record<string, string>>(
      this.sgrudConfig.endpoints.login.href,
      { loginName, password }
    ).pipe(map((response) => this.update(response)));
  }

  public logout(): Observable<void> {
    return of(this.øtimeout.unsubscribe()).pipe(tap(() => {
      this.øaccessToken.next(new AccessToken());
      this.ørefreshToken.next(new RefreshToken());
    }));
  }

  public refresh(): Observable<Tokens> {
    return this.httpClient.get<Record<string, string>>(
      this.sgrudConfig.endpoints.refresh.href,
      { headers: { Authorization: `Bearer ${this.ørefreshToken.value.raw}` } }
    ).pipe(map((response) => this.update(response)));
  }

  private update(response: Record<string, string>): Tokens {
    const tokens: Tokens = {
      access: this.øaccessToken.value,
      refresh: this.ørefreshToken.value
    };

    for (const key in response) {
      if (response[key]) {
        const base64: string = response[key].split('.')[1];
        const token: Record<string, any> = JSON.parse(atob(base64));
        token.exp = token.exp - 30;
        token.raw = response[key];

        switch (key) {
          case 'access':
            this.øaccessToken.next(tokens[key] = new AccessToken(token));
            break;

          case 'refresh':
            this.ørefreshToken.next(tokens[key] = new RefreshToken(token));
            break;
        }
      }
    }

    const accessExp = Math.max(0, tokens.access.exp * 1000 - Date.now());
    const refreshExp = Math.max(0, tokens.refresh.exp * 1000 - Date.now());
    this.øtimeout = refreshExp > accessExp
      ? timer(accessExp).subscribe(() => this.refresh().subscribe())
      : timer(refreshExp).subscribe(() => this.logout().subscribe());

    return tokens;
  }

}
