import { Model } from '../model/model';
import { EntityPieces } from './entity-pieces';
import { FilterExpression } from './filter-expression';
import { FilterOperator } from './filter-operator';

export type FilterParams<T extends Model = Model> = {
  dir?: '' | 'asc' | 'desc';
  expression?: FilterExpression<T>;
  entities?: EntityPieces<T>[];
  operators?: Record<string, FilterOperator>;
  page?: number;
  search?: string;
  size?: number;
  sort?: string;
};
