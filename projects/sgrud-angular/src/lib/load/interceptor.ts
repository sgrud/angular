import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoadService } from './service';

@Injectable({
  providedIn: 'root'
})

export class LoadInterceptor
  implements HttpInterceptor {

  public constructor(
    private readonly loadService: LoadService
  ) { }

  public intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    this.loadService.enqueue(request);

    return new Observable<HttpEvent<any>>((observer) => {
      next.handle(request).subscribe(observer);
      return () => this.loadService.resolve(request);
    });
  }

}
