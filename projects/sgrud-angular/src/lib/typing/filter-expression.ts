import { Model } from '../model/model';
import { FilterConjunction } from './filter-conjunction';
import { FilterOperator } from './filter-operator';

export type FilterExpression<T extends Model = Model> = {
  conjunction?: {
    operands: FilterExpression<T>[];
    operator?: FilterConjunction;
  };
  entity?: {
    operator?: FilterOperator;
    path: string;
    value: string;
  };
};
