import { Type, ɵNG_COMP_DEF, ɵNG_MOD_DEF } from '@angular/core';
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
    switch (true) {
      case ɵNG_COMP_DEF in target:
        MenuService.register(new MenuItem({
          refer: target,
          label: target.name
        }, menuItem));
        break;

      case ɵNG_MOD_DEF in target:
        MenuService.register(new MenuItem({
          hidden: true,
          refer: target,
          label: target.name
        }, menuItem));
        break;
    }
  };

}
