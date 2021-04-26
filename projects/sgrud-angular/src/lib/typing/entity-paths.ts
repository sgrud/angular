import { Model } from '../model/model';
import { EntityFields } from './entity-fields';

export type EntityPaths<T extends Model = Model, U extends string = ''> = {
  [K in EntityFields<T>]:
    U extends '.....'
      ? never :
    Required<T>[K] extends (...args: any[]) => any
      ? never :
    Required<T>[K] extends Model<infer X>[]
      ? `${K}.${EntityPaths<X, `${U}.`>}` :
    Required<T>[K] extends Model<infer Y>
      ? `${K}.${EntityPaths<Y, `${U}.`>}` :
    K;
}[EntityFields<T>];
