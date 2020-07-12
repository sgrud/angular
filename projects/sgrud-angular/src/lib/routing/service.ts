import { Injectable, Provider, Type } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Resolve, Route, ROUTES } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../auth/service';
import { Model } from '../model/model';
import { EntityPromise } from '../typing/entity-promise';
import { RoutingItem } from './item';
import { Resolver } from './resolver';

@Injectable({
  providedIn: 'root'
})

export class RoutingService
  implements CanActivate, CanActivateChild, Resolve<Model | Model[]> {

  private static readonly øroutingItems: RoutingItem[] = [];

  public static for(target: Type<any>): Provider[] {
    for (const routingItem of RoutingService.øroutingItems) {
      if (routingItem.refer === target) {
        return [
          {
            multi: true,
            provide: ROUTES,
            useValue: [
              this.routing(routingItem),
              {
                path: '**',
                pathMatch: 'full',
                redirectTo: routingItem.path
              }
            ]
          }
        ];
      }
    }

    return [];
  }

  public static register(routingItem: RoutingItem): void {
    if (!RoutingService.øroutingItems.includes(routingItem)) {
      RoutingService.øroutingItems.push(routingItem);
    }
  }

  private static routing(routingItem: RoutingItem): Route {
    const route: Route = {
      component: routingItem.hidden ? undefined : routingItem.refer,
      path: routingItem.path
    };

    if (routingItem.roles?.length) {
      route.canActivate = [RoutingService];
      route.canActivateChild = [RoutingService];

      route.data = {
        ...route.data,
        roles: routingItem.roles
      };
    }

    for (const key in routingItem.resolve) {
      if (routingItem.resolve[key] instanceof Resolver) {
        route.data = {
          ...route.data,
          resolve: {
            ...route.data?.resolve,
            [key]: routingItem.resolve[key]
          }
        };

        route.resolve = {
          ...route.resolve,
          [key]: RoutingService
        };
      } else {
        route.resolve = {
          ...route.resolve,
          [key]: routingItem.resolve[key]
        };
      }
    }

    for (const child of routingItem.children) {
      for (const leftItem of RoutingService.øroutingItems) {
        if (leftItem.refer === child) {
          route.children = [
            ...(route.children || []),
            this.routing(leftItem)
          ];
        }
      }
    }

    return route;
  }

  public constructor(
    private readonly authService: AuthService
  ) { }

  public canActivate(
    route: ActivatedRouteSnapshot
  ): Observable<boolean> {
    return this.guard(route);
  }

  public canActivateChild(
    route: ActivatedRouteSnapshot
  ): Observable<boolean> {
    return this.guard(route);
  }

  public resolve(
    route: ActivatedRouteSnapshot & { resolved: Record<string, true> }
  ): Observable<Model | Model[]> {
    for (const key in route.routeConfig?.resolve) {
      if (route.routeConfig?.data?.resolve[key] && !route.resolved?.[key]) {
        const promise: EntityPromise = route.routeConfig.data.resolve[key];
        route.resolved = { ...route.resolved, [key]: true };

        if (promise.findAll) {
          return promise.entity.findAll(
            promise.findAll(route.params),
            promise.graph
          ).pipe(map((data) => data.result!));
        }

        if (promise.findOne) {
          return promise.entity.findOne(
            promise.findOne(route.params),
            promise.graph
          );
        }
      }
    }

    return EMPTY;
  }

  private guard(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.authService.tokens.pipe(take(1), map((tokens) => {
      for (const role of route.routeConfig?.data?.roles || []) {
        if (tokens.access.roles.includes(role)) {
          return true;
        }
      }

      return false;
    }));
  }

}
