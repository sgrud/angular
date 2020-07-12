import { Model } from '../model/model';

export type PageableList<T extends Model = Model> = {
  result?: T[];
  total?: number;
};
