import { Model } from '../model/model';
import { FilterExpression } from './filter-expression';

export type FilterParams<T extends Model = Model> = {
  dir?: 'asc' | 'desc';
  expression?: FilterExpression<T>;
  page?: number;
  search?: string;
  size?: number;
  sort?: string;
};
