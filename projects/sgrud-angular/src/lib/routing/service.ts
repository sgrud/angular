import { Injectable, Type, ValueProvider } from '@angular/core';
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

  public static for(target: Type<any>): ValueProvider {
    const provider: ValueProvider = {
      multi: true,
      provide: ROUTES,
      useValue: []
    };

    for (const routingItem of RoutingService.øroutingItems) {
      if (routingItem.refer === target) {
        const route: Route = this.routing(routingItem);
        provider.useValue = route.component ? [route] : route.children!;
        provider.useValue.push({
          path: '**',
          pathMatch: 'full',
          redirectTo: route.path
        });
      }
    }

    return provider;
  }

  public static register(routingItem: RoutingItem): void {
    if (!RoutingService.øroutingItems.includes(routingItem)) {
      RoutingService.øroutingItems.push(routingItem);
    }
  }

  private static routing(routingItem: RoutingItem): Route {
    const route: Route = {
      canActivate: routingItem.guards.filter((guard) => {
        return guard.prototype.hasOwnProperty('canActivate');
      }),
      canActivateChild: routingItem.guards.filter((guard) => {
        return guard.prototype.hasOwnProperty('canActivateChild');
      }),
      data: {
        refer: routingItem.refer,
        ...routingItem.data
      },
      outlet: routingItem.outlet,
      path: routingItem.path
    };

    if (!routingItem.hidden) {
      route.component = routingItem.refer;
    }

    if (routingItem.roles?.length) {
      route.canActivate = [
        ...route.canActivate!,
        RoutingService
      ];

      route.canActivateChild = [
        ...route.canActivateChild!,
        RoutingService
      ];

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

  public lookup(target: Type<any>): string[][] {
    const paths: string[][] = [];

    for (const routingItem of RoutingService.øroutingItems) {
      if (routingItem.refer === target) {
        for (const leftItem of RoutingService.øroutingItems) {
          for (const child of leftItem.children) {
            if (routingItem.refer === child) {
              if (leftItem.path) {
                for (const leftPaths of this.lookup(leftItem.refer!)) {
                  paths.push(leftPaths.concat(routingItem.path.split('/')));
                }
              } else {
                paths.push(routingItem.path.split('/'));
              }
            }
          }
        }
      }
    }

    return paths;
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
            promise.graph,
            promise.findAll(route.params)
          ).pipe(map((data) => data.result!));
        }

        if (promise.findOne) {
          return promise.entity.findOne(
            promise.graph,
            promise.findOne(route.params)
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
