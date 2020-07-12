import { Model } from '../model/model';
import { EntityGraph } from './entity-graph';

export type EntityQuery<K extends string, T extends Model = Model> =
  () => Record<K, EntityGraph<T>> & Record<string, any>;
