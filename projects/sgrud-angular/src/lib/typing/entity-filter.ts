import { Model } from '../model/model';
import { EntityFields } from './entity-fields';

export type EntityFilter<T extends Model = Model> = {
  [K in EntityFields<T>]?:
    Required<T>[K] extends Model<infer U>[]
      ? EntityFilter<U> :
    Required<T>[K] extends Model<infer V>
      ? EntityFilter<V> :
    Required<T>[K] extends (...args: any[]) => any
      ? never :
    Required<T>[K];
};
