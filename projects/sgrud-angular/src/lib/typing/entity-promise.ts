import { Params } from '@angular/router';
import { Model } from '../model/model';
import { EntityGraph } from './entity-graph';
import { EntityPieces } from './entity-pieces';
import { EntityType } from './entity-type';
import { FilterParams } from './filter-params';

export type EntityPromise<T extends Model = Model> = {
  entity: EntityType<T>;
  findAll?: (route: Params) => FilterParams<T>;
  findOne?: (route: Params) => EntityPieces<T>;
  graph: EntityGraph<T>;
};
