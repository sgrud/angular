import { Type, ɵNG_COMP_DEF, ɵNG_MOD_DEF } from '@angular/core';
import { RoutingItem } from './item';
import { RoutingService } from './service';

export function Routing(
  routingItem: Partial<RoutingItem>
): (
  target: Type<any>
) => void {

  return (
    target: Type<any>
  ) => {
    switch (true) {
      case ɵNG_COMP_DEF in target:
        RoutingService.register(new RoutingItem({
          path: '',
          refer: target
        }, routingItem));
        break;

      case ɵNG_MOD_DEF in target:
        RoutingService.register(new RoutingItem({
          hidden: true,
          refer: target
        }, routingItem));
        break;
    }
  };

}
