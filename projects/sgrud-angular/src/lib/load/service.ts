import { HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class LoadService {

  private readonly øcounter: BehaviorSubject<number>;

  private readonly ørequests: Set<HttpRequest<any>>;

  public get counter(): Observable<number> {
    return this.øcounter.asObservable();
  }

  public constructor() {
    this.øcounter = new BehaviorSubject<number>(0);
    this.ørequests = new Set<HttpRequest<any>>();
  }

  public enqueue(request: HttpRequest<any>): void {
    this.ørequests.add(request);
    this.øcounter.next(this.ørequests.size);
  }

  public resolve(request: HttpRequest<any>): void {
    this.ørequests.delete(request);
    this.øcounter.next(this.ørequests.size);
  }

}
