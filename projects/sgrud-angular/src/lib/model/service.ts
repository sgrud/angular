import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../auth/service';
import { SgrudConfig } from '../sgrud-config';

@Injectable({
  providedIn: 'root'
})

export class ModelService {

  private static øinstance: ModelService;

  public static get instance(): ModelService {
    return this.øinstance;
  }

  public constructor(
    private readonly authService: AuthService,
    private readonly httpClient: HttpClient,
    private readonly sgrudConfig: SgrudConfig
  ) {
    ModelService.øinstance = this;
  }

  public dispatch<T = Record<string, any>>(
    query: string,
    variables: Record<string, any> = { }
  ): Observable<T> {
    return this.authService.tokens.pipe(take(1), switchMap((tokens) => {
      return this.httpClient.post<{ data: T }>(
        this.sgrudConfig.endpoints.graphql.href,
        { query, variables },
        { headers: { Authorization: `Bearer ${tokens.access.raw}` } }
      ).pipe(map((response) => response.data));
    }));
  }

}
