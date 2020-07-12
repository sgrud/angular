import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class SgrudConfig {

  public readonly endpoints!: {
    error: URL;
    graphql: URL;
    login: URL;
    refresh: URL;
  };

}
