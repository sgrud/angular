import { Model } from '../model/model';
import { EntityFields } from './entity-fields';

export type EntityPieces<T extends Model = Model> = {
  [K in EntityFields<T>]?:
    Required<T>[K] extends (...args: any[]) => any
      ? never :
    Required<T>[K] extends Model<infer X>[]
      ? EntityPieces<X>[] :
    Required<T>[K] extends Model<infer Y>
      ? EntityPieces<Y> :
    Required<T>[K];
};
