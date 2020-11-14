import { typeOf } from '../utility/type-of';
import { Model } from './model';

export function Field<T extends new(...args: any[]) => InstanceType<T>>(
  typeFactory: () => T,
  serialize: boolean = true
): (
  model: Model,
  field: string
) => void {

  return (
    model: Model,
    field: string
  ) => {
    if (serialize) {
      Reflect.set(model, 'øfield', {
        ...Reflect.get(model, 'øfield'),
        [field]: typeFactory
      });
    }

    Object.defineProperties(model, {
      ['ɵ' + field]: {
        writable: true
      },
      [field]: {
        enumerable: true,
        get(): T {
          return this['ɵ' + field]?.valueOf();
        },
        set(value?: T): void {
          if (typeOf.null(value)) {
            this['ɵ' + field] = null;
          } else if (!typeOf.undefined(value)) {
            const type: new(...args: any[]) => InstanceType<T> = typeFactory();
            this['ɵ' + field] = new type(value);
            this.øchanges.next(this);
          }
        }
      }
    });
  };

}
