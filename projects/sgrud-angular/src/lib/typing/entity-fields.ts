import { Model } from '../model/model';

export type EntityFields<T extends Model = Model> = string & Exclude<keyof T,
  '__typename' | Exclude<keyof Model, 'id' | 'created' | 'modified'>>;
