import { BehaviorSubject, Observable, of, OperatorFunction } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { EntityFilter } from '../typing/entity-filter';
import { EntityGraph } from '../typing/entity-graph';
import { EntityParts } from '../typing/entity-parts';
import { EntityType } from '../typing/entity-type';
import { FilterParams } from '../typing/filter-params';
import { PageableList } from '../typing/pagable-list';
import { pluralize } from '../utility/pluralize';
import { typeOf } from '../utility/type-of';
import { Field } from './field';
import { ModelService } from './service';

export abstract class Model<T extends Model = any> {

  public static get entity(): InstanceType<EntityType> {
    return new (this as EntityType)();
  }

  public static get mono(): string {
    return this.entity.mono;
  }

  public static get multi(): string {
    return this.entity.multi;
  }

  public static get type(): string {
    return this.entity.type;
  }

  public static commit<U extends Model = Model>(
    this: EntityType<U>,
    query: string,
    variables: Record<string, any> = { }
  ): Observable<any> {
    return ModelService.instance.commit(query, variables);
  }

  public static deleteAll<U extends Model = Model>(
    this: EntityType<U>,
    ...ids: string[]
  ): Observable<any> {
    return ModelService.instance.deleteAll(this, ...ids);
  }

  public static deleteOne<U extends Model = Model>(
    this: EntityType<U>,
    id: string
  ): Observable<any> {
    return ModelService.instance.deleteOne(this, id);
  }

  public static findAll<U extends Model = Model>(
    this: EntityType<U>,
    graph: EntityGraph<U>,
    params: FilterParams<U>
  ): Observable<PageableList<U>> {
    return ModelService.instance.findAll(this, graph, params);
  }

  public static findOne<U extends Model = Model>(
    this: EntityType<U>,
    graph: EntityGraph<U>,
    entity: EntityFilter<U>
  ): Observable<U> {
    return ModelService.instance.findOne(this, graph, entity);
  }

  public static saveAll<U extends Model = Model>(
    this: EntityType<U>,
    graph: EntityGraph<U>,
    items: U[]
  ): Observable<U[]> {
    return ModelService.instance.saveAll(this, graph, items);
  }

  public static saveOne<U extends Model = Model>(
    this: EntityType<U>,
    graph: EntityGraph<U>,
    item: U
  ): Observable<U> {
    return ModelService.instance.saveOne(this, graph, item);
  }

  public static serialize<U extends Model = Model>(
    this: EntityType<U>,
    item: U,
    shallow: boolean = false
  ): EntityParts<U> | undefined {
    return ModelService.instance.serialize(item, shallow);
  }

  public static treemap<U extends Model = Model>(
    this: EntityType<U>,
    item: U,
    shallow: boolean = false
  ): EntityGraph<U> | undefined {
    return ModelService.instance.treemap(item, shallow);
  }

  @Field(() => String)
  public id?: string;

  @Field(() => Date, false)
  public created?: Date;

  @Field(() => Date, false)
  public modified?: Date;

  // tslint:disable-next-line:variable-name
  public abstract readonly __typename: string;

  protected readonly øchanges!: BehaviorSubject<T>;

  public get changes(): Observable<T> {
    return this.øchanges.asObservable();
  }

  public get entity(): EntityType<T> {
    return this.constructor as EntityType<T>;
  }

  public get mono(): string {
    return this.type.endsWith('Entity')
      ? this.type.replace(/Entity$/, '')
      : this.type;
  }

  public get multi(): string {
    return pluralize(this.mono);
  }

  public get type(): string {
    return this.__typename;
  }

  public constructor(...parts: EntityParts<T>[]) {
    Object.defineProperty(this, 'øchanges', {
      value: new BehaviorSubject<T>(this as Model as T)
    });

    (this as Model as T).assign(...parts).subscribe();
  }

  public assign<U extends Model = T>(
    this: U,
    ...parts: EntityParts<U>[]
  ): Observable<U> {
    for (const part of parts) {
      (function assign(
        left: Record<string, any>,
        right: Record<string, any>
      ): Record<string, any> {
        for (const key in right) {
          if (typeOf.object(left[key]) && typeOf.object(right[key])) {
            left[key] = assign({ ...left[key] }, right[key]);
          } else {
            left[key] = right[key];
          }
        }

        return left;
      })(this, part);
    }

    this.øchanges.next(this);
    return of(this.øchanges.value);
  }

  public commit<U extends Model = T>(
    this: U,
    mapper: OperatorFunction<Record<string, any>, U>,
    mutation: string,
    variables: Record<string, any> = { }
  ): Observable<U> {
    return ModelService.instance.commit(
      mutation,
      variables
    ).pipe(
      mapper,
      switchMap((item) => this.assign(item as EntityParts<U>))
    );
  }

  public delete<U extends Model = T>(
    this: U
  ): Observable<U> {
    return ModelService.instance.deleteOne(
      this.entity,
      this.id!
    ).pipe(
      switchMap(() => this.reset())
    );
  }

  public find<U extends Model = T>(
    this: U,
    graph: EntityGraph<U>,
    entity: EntityFilter<U> = this.serialize(true) as EntityFilter<U>
  ): Observable<U> {
    return ModelService.instance.findOne(
      this.entity,
      graph,
      entity
    ).pipe(
      switchMap((item) => this.assign(item))
    );
  }

  public reset<U extends Model = T>(
    this: U
  ): Observable<U> {
    const keys: string[] = ['id', 'created', 'modified'];
    for (const key in Reflect.get(this, 'øfield')) { keys.push(key); }
    for (const key in Reflect.get(this, 'øhasMany')) { keys.push(key); }
    for (const key in Reflect.get(this, 'øhasOne')) { keys.push(key); }

    return this.assign(...keys.map((key) => ({
      ['ɵ' + key]: undefined
    })) as EntityParts<U>[]);
  }

  public save<U extends Model = T>(
    this: U,
    graph: EntityGraph<U> = this.treemap()
  ): Observable<U> {
    return ModelService.instance.saveOne(
      this.entity,
      graph,
      this
    ).pipe(
      switchMap((item) => this.assign(item))
    );
  }

  public serialize<U extends Model = T>(
    this: U,
    shallow: boolean = false
  ): EntityParts<U> | undefined {
    return ModelService.instance.serialize(this, shallow);
  }

  public treemap<U extends Model = T>(
    this: U,
    shallow: boolean = false
  ): EntityGraph<U> {
    return ModelService.instance.treemap(this, shallow);
  }

}
