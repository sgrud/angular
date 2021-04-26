import { Model } from '../model/model';
import { EntityFields } from './entity-fields';
import { EntityQuery } from './entity-query';

export type EntityGraph<T extends Model = Model> = {
  [K in EntityFields<T>]?:
    Required<T>[K] extends (...args: any[]) => any
      ? never :
    Required<T>[K] extends Model<infer X>[]
      ? Record<K, EntityGraph<X> | EntityQuery<K, X>> :
    Required<T>[K] extends Model<infer Y>
      ? Record<K, EntityGraph<Y> | EntityQuery<K, Y>> :
    K;
}[EntityFields<T>][];
