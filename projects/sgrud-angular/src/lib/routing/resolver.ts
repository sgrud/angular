import { Params } from '@angular/router';
import { Model } from '../model/model';
import { EntityFilter } from '../typing/entity-filter';
import { EntityGraph } from '../typing/entity-graph';
import { EntityPromise } from '../typing/entity-promise';
import { EntityType } from '../typing/entity-type';
import { FilterParams } from '../typing/filter-params';

export class Resolver<T extends Model = Model>
  implements EntityPromise<T> {

  public readonly entity!: EntityType<T>;

  public readonly findAll?: (route: Params) => FilterParams<T>;

  public readonly findOne?: (route: Params) => EntityFilter<T>;

  public readonly graph!: EntityGraph<T>;

  public constructor(...parts: Partial<Resolver<T>>[]) {
    Object.assign(this, ...parts);
  }

}
