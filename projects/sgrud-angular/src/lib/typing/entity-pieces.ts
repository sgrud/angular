import { Model } from '../model/model';
import { EntityFields } from './entity-fields';

export type EntityPieces<T extends Model = Model> = {
  [K in EntityFields<T>]?:
    Required<T>[K] extends Model<infer U>[]
      ? EntityPieces<U>[] :
    Required<T>[K] extends Model<infer V>
      ? EntityPieces<V> :
    Required<T>[K] extends (...args: any[]) => any
      ? never :
    Required<T>[K];
};
