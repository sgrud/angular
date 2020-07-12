import { Model } from '../model/model';

export type EntityType<T extends Model = Model> =
  Readonly<typeof Model> & (new(...parts: Partial<T>[]) => T);
