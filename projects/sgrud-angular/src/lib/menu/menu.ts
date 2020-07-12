import { Type } from '@angular/core';
import { MenuItem } from './item';
import { MenuService } from './service';

export function Menu(
  menuItem: Partial<MenuItem>
): (
  target: Type<any>
) => void {

  return (
    target: Type<any>
  ) => {
    MenuService.register(new MenuItem({
      refer: target,
      label: target.name
    }, menuItem));
  };

}
