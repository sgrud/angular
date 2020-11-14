import { EntityType } from '../typing/entity-type';
import { typeOf } from '../utility/type-of';
import { Model } from './model';

export function HasMany<T extends Model>(
  typeFactory: () => EntityType<T>,
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
      Reflect.set(model, 'øhasMany', {
        ...Reflect.get(model, 'øhasMany'),
        [field]: typeFactory
      });
    }

    Object.defineProperties(model, {
      ['ɵ' + field]: {
        writable: true
      },
      [field]: {
        enumerable: true,
        get(): T[] {
          return this['ɵ' + field]?.valueOf();
        },
        set(value?: T[]): void {
          if (typeOf.null(value)) {
            this['ɵ' + field] = null;
          } else if (typeOf.array(value)) {
            const type: EntityType<T> = typeFactory();
            this['ɵ' + field] = value.map((i) => new type(i));
            this.øchanges.next(this);
          }
        }
      }
    });
  };

}
