import { Params } from '@angular/router';
import { Model } from '../model/model';
import { EntityFilter } from './entity-filter';
import { EntityGraph } from './entity-graph';
import { EntityType } from './entity-type';
import { FilterParams } from './filter-params';

export type EntityPromise<T extends Model = Model> = {
  entity: EntityType<T>;
  findAll?: (route: Params) => FilterParams<T>;
  findOne?: (route: Params) => EntityFilter<T>;
  graph: EntityGraph<T>;
};
