import { Injectable } from '@angular/core';
import { NavigationEnd, Route, Router } from '@angular/router';
import { Observable } from 'rxjs';
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
          case menuItem.children.includes(leftItem.refer!)
            && menuItem.refer !== leftItem.parent:
            menuItems[menuItems.indexOf(leftItem)] = new MenuItem({
              ...leftItem, parent: menuItem.refer
            });
            break;

          case leftItem.children.includes(menuItem.refer!)
            && leftItem.refer !== menuItem.parent:
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
              menuItem.route?.endsWith(route.routeConfig?.path!)
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
      if (!menuItem.route?.startsWith('/')) {
        (function routing(routes: Route[], path: string[]): boolean {
          for (const route of routes) {
            switch (true) {
              case route.component === menuItem.refer:
                path.push((menuItem.route || route.path)!);
                menuItems[menuItems.indexOf(menuItem)] = new MenuItem({
                  ...menuItem, route: path.join('/')
                });
                return true;

              case route.children && routing(
                route.children,
                path.concat(route.path!)
              ): return true;

              case route.loadChildren && routing(
                (route as any)._loadedConfig?.routes || [],
                path.concat(route.path!)
              ): return true;
            }
          }

          return false;
        })(this.router.config, ['/']);
      }
    }

    loop: for (const menuItem of menuItems) {
      if (typeOf.undefined(menuItem.route) && menuItem.children.length) {
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

}
