import { Injectable } from '@angular/core';
import { NavigationEnd, Route, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { typeOf } from '../utility/type-of';
import { MenuItem } from './item';

@Injectable({
  providedIn: 'root'
})

export class MenuService {

  private static readonly ømenuItems: MenuItem[] = [];

  public static register(menuItem: MenuItem): void {
    const menuItems: MenuItem[] = MenuService.ømenuItems;

    if (!menuItems.includes(menuItem)) {
      for (const leftItem of menuItems) {
        switch (true) {
          case leftItem.parent !== menuItem.refer
            && menuItem.children.includes(leftItem.refer!):
            menuItems[menuItems.indexOf(leftItem)] = new MenuItem({
              ...leftItem, parent: menuItem.refer
            });
            break;

          case leftItem.refer !== menuItem.parent
            && leftItem.children.includes(menuItem.refer!):
            menuItem = new MenuItem({
              ...menuItem, parent: leftItem.refer
            });
            break;

          case leftItem.parent === menuItem.refer
            && !menuItem.children.includes(leftItem.refer!):
            menuItem = new MenuItem({
              ...menuItem, children: menuItem.children.concat(leftItem.refer!)
            });
            break;

          case leftItem.refer === menuItem.parent
            && !leftItem.children.includes(menuItem.refer!):
            menuItems[menuItems.indexOf(leftItem)] = new MenuItem({
              ...leftItem, children: leftItem.children.concat(menuItem.refer!)
            });
            break;
        }
      }

      menuItems.push(menuItem);
    }
  }

  public get activeItems(): Observable<MenuItem[]> {
    return this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.routerState.root),
      startWith(this.router.routerState.root),
      map((route) => {
        const activeItems: MenuItem[] = [];

        do {
          for (let menuItem of MenuService.ømenuItems) {
            if (
              menuItem.refer === route.routeConfig?.component &&
              menuItem.route.join('/').endsWith(route.routeConfig?.path!)
            ) {
              if (!activeItems.includes(menuItem)) {
                activeItems.push(menuItem);
              }

              while (menuItem.parent) {
                for (const leftItem of MenuService.ømenuItems) {
                  if (leftItem.refer === menuItem.parent) {
                    if (!activeItems.includes(menuItem = leftItem)) {
                      activeItems.push(menuItem);
                    }
                  }
                }
              }
            }
          }
        } while (route = route.firstChild!);

        return activeItems.sort((left, right) => {
          return left.compare(right) === right ? 1 : -1;
        });
      })
    );
  }

  public get listedItems(): Observable<MenuItem[]> {
    return of((function lister(menuItem: MenuItem): MenuItem[] {
      const listed: MenuItem[] = [menuItem];

      for (const child of menuItem.children) {
        for (const leftItem of MenuService.ømenuItems) {
          if (leftItem.refer === child) {
            listed.push(...lister(leftItem));
          }
        }
      }

      return listed;
    }(MenuService.ømenuItems.reduce((left, right) => {
        return left.compare(right);
    }))).filter((menuItem) => {
      return !menuItem.hidden;
    }));
  }

  public get parsedItems(): Observable<MenuItem[]> {
    return this.activeItems.pipe(map((activeItems) => {
      return (function parser(menuItem: MenuItem): MenuItem[] {
        const parsed: MenuItem[] = [];

        for (const child of menuItem.children) {
          for (const leftItem of MenuService.ømenuItems) {
            if (leftItem.refer === child) {
              parsed.push(leftItem);

              if (activeItems.includes(leftItem)) {
                parsed.push(...parser(leftItem));
              }
            }
          }
        }

        return parsed;
      })(MenuService.ømenuItems.reduce((left, right) => {
        return left.compare(right);
      }));
    }));
  }

  public constructor(
    private readonly router: Router
  ) {
    const menuItems: MenuItem[] = MenuService.ømenuItems;

    for (const menuItem of menuItems) {
      if (!menuItem.route.length) {
        const route: any[] = this.routing(menuItem);

        if (route.length) {
          menuItems[menuItems.indexOf(menuItem)] = new MenuItem({
            ...menuItem, route: this.routing(menuItem)
          });
        }
      }
    }

    loop: for (const menuItem of menuItems) {
      if (!menuItem.route.length && menuItem.children.length) {
        for (const child of menuItem.children) {
          for (const leftItem of menuItems) {
            if (leftItem.route && leftItem.refer === child) {
              menuItems[menuItems.indexOf(menuItem)] = new MenuItem({
                ...menuItem, route: leftItem.route
              });

              continue loop;
            }
          }
        }
      }
    }
  }

  private routing(
    menuItem: MenuItem,
    path: any[] = ['/'],
    routes: Route[] = this.router.config
  ): any[] {
    let result: any[] = [];

    for (const route of routes) {
      switch (true) {
        case route.component === menuItem.refer:
          result = this.treemap(path, route);
          break;

        case typeOf.array(routes = route.children!):
        case typeOf.array(routes = (route as any)._loadedConfig?.routes):
          result = this.routing(menuItem, this.treemap(path, route), routes);
          break;
      }

      if (result.length) {
        break;
      }
    }

    return result;
  }

  private treemap(path: any[], route: Route): any[] {
    if (route.path) {
      path = path.slice();
      const last: any = path[path.length - 1];
      const next: object | string = route.outlet
        ? { [route.outlet]: [route.path] }
        : route.path;

      switch (true) {
          case typeOf.object(last) && typeOf.object(next):
            last.outlets = { ...last.outlets, ...(next as object) };
            break;

          case typeOf.object(last) && typeOf.string(next):
            last.outlets[Object.keys(last.outlets).pop()!].push(next);
            break;

          case typeOf.string(last) || typeOf.undefined(last):
            path.push(typeOf.object(next) ? { outlets: next } : next);
            break;
      }
    }

    return path;
  }

}
