import { Model } from '../model/model';
import { EntityFields } from './entity-fields';

export type EntityParts<T extends Model = Model> = {
  [K in EntityFields<T>]?:
    Required<T>[K] extends Model<infer U>[]
      ? EntityParts<U>[] :
    Required<T>[K] extends Model<infer V>
      ? EntityParts<V> :
    Required<T>[K];
};
