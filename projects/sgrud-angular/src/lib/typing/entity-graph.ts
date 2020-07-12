import { Model } from '../model/model';
import { EntityFields } from './entity-fields';
import { EntityQuery } from './entity-query';

export type EntityGraph<T extends Model = Model> = {
  [K in EntityFields<T>]?:
    Required<T>[K] extends Model<infer U>[]
      ? Record<K, EntityGraph<U> | EntityQuery<K, U>> :
    Required<T>[K] extends Model<infer V>
      ? Record<K, EntityGraph<V> | EntityQuery<K, V>> :
    Required<T>[K] extends (...args: any[]) => any
      ? never :
    K;
}[EntityFields<T>][];
