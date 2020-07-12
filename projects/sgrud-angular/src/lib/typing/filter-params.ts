import { Model } from '../model/model';
import { EntityFilter } from './entity-filter';
import { FilterOperator } from './filter-operator';

export type FilterParams<T extends Model = Model> = {
  dir?: '' | 'asc' | 'desc';
  entities?: EntityFilter<T>[];
  operators?: Record<string, FilterOperator>;
  page?: number;
  search?: string;
  size?: number;
  sort?: string;
};
