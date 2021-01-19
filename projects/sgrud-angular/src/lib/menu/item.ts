import { Type } from '@angular/core';

export class MenuItem {

  public readonly children: Type<any>[] = [];

  public readonly hidden: boolean = false;

  public readonly icon?: string;

  public readonly label?: string;

  public readonly parent?: Type<any>;

  public readonly refer?: Type<any>;

  public readonly route: any[] = [];

  public constructor(...parts: Partial<MenuItem>[]) {
    Object.assign(this, ...parts);
  }

  public compare(menuItem?: MenuItem): MenuItem {
    switch (true) {
      default:
      case menuItem!.refer === this.parent:
      case menuItem!.children.includes(this.refer!):
      case menuItem!.children.includes(this.parent!):
        return menuItem!;

      case !menuItem:
      case this.refer === menuItem!.parent:
      case this.children.includes(menuItem!.refer!):
      case this.children.includes(menuItem!.parent!):
        return this;
    }
  }

}
