import { BehaviorSubject, Observable, of, OperatorFunction } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { EntityFilter } from '../typing/entity-filter';
import { EntityGraph } from '../typing/entity-graph';
import { EntityType } from '../typing/entity-type';
import { FilterParams } from '../typing/filter-params';
import { PageableList } from '../typing/pagable-list';
import { pluralize } from '../utility/pluralize';
import { typeOf } from '../utility/type-of';
import { Field } from './field';
import { ModelService } from './service';

export abstract class Model<T extends Model = any> {

  public static get mono(): string {
    return new (this as any as EntityType)().mono;
  }

  public static get multi(): string {
    return new (this as any as EntityType)().multi;
  }

  public static get type(): string {
    return new (this as any as EntityType)().type;
  }

  public static deleteAll(...ids: string[]): Observable<any> {
    return this.dispatch(`
      mutation deleteAll($ids: [String]!) {
        delete${this.multi}(ids: $ids)
      }
    `, { ids });
  }

  public static deleteOne(id: string): Observable<any> {
    return this.dispatch(`
      mutation deleteOne($id: String!) {
        delete${this.mono}(id: $id)
      }
    `, { id });
  }

  public static findAll<U extends Model = Model>(
    this: EntityType<U>,
    params: FilterParams<U>,
    graph: EntityGraph<U>
  ): Observable<PageableList<U>>;
  public static findAll<U extends Model = Model>(
    this: EntityType<U> & typeof Model,
    params: FilterParams<U>,
    graph: EntityGraph<U>
  ): Observable<PageableList<U>> {
    return this.dispatch(`
      query findAll($params: FilterSortPaginate_${this.type}Input!) {
        get${this.multi}(params: $params) {
          result ${this.graft(graph)}
          total
        }
      }
    `, { params }).pipe(map((data) => {
      const value: PageableList<U> = data[`get${this.multi}`];
      value.result = value?.result?.map((i) => new this(i));
      return value;
    }));
  }

  public static findOne<U extends Model = Model>(
    this: EntityType<U>,
    entity: EntityFilter<U>,
    graph: EntityGraph<U>
  ): Observable<U>;
  public static findOne<U extends Model = Model>(
    this: EntityType<U> & typeof Model,
    entity: EntityFilter<U>,
    graph: EntityGraph<U>
  ): Observable<U> {
    return this.dispatch(`
      query findOne($entity: ${this.type}Input!) {
        get${this.mono}(entity: $entity) ${this.graft(graph)}
      }
    `, { entity }).pipe(map((data) => {
      const value: U = data[`get${this.mono}`];
      return new this(value);
    }));
  }

  public static saveAll<U extends Model = Model>(
    this: EntityType<U>,
    items: U[],
    graph: EntityGraph<U>
  ): Observable<U[]>;
  public static saveAll<U extends Model = Model>(
    this: EntityType<U> & typeof Model,
    items: U[],
    graph: EntityGraph<U>
  ): Observable<U[]> {
    return this.dispatch(`
      mutation saveAll($items: [${this.type}Input]!) {
        save${this.multi}(entities: $items) ${this.graft(graph)}
      }
    `, { items: items.map((i) => i.serialize()) }).pipe(map((data) => {
      const value: U[] = data[`save${this.multi}`].result;
      return value.map((i) => new this(i));
    }));
  }

  public static saveOne<U extends Model = Model>(
    this: EntityType<U>,
    item: U,
    graph: EntityGraph<U>
  ): Observable<U>;
  public static saveOne<U extends Model = Model>(
    this: EntityType<U> & typeof Model,
    item: U,
    graph: EntityGraph<U>
  ): Observable<U> {
    return this.dispatch(`
      mutation saveOne($item: ${this.type}Input!) {
        save${this.mono}(entity: $item) ${this.graft(graph)}
      }
    `, { item: item.serialize() }).pipe(map((data) => {
      const value: U = data[`save${this.mono}`];
      return new this(value);
    }));
  }

  protected static graft<U extends Model = Model>(
    graph: EntityGraph<U>
  ): string {
    const result: string[] = ['{'];

    for (let n: number = 0; n < graph.length; n++) {
      if (n > 0) { result.push(' '); }

      if (typeOf.object(graph[n])) {
        for (const key in graph[n]) {
          const node: unknown = graph[n][key];

          if (typeOf.array(node) && node.length > 0) {
            result.push(key, this.graft(node));
          } else if (typeOf.function(node)) {
            const { [key]: sub, ...vars } = node();
            const keys: string[] = Object.keys(vars);
            result.push(key, '(');

            for (let m: number = 0; m < keys.length; m++) {
              if (m > 0) { result.push(' '); }
              result.push(`${keys[m]}:${JSON.stringify(vars[keys[m]])}`);
            }

            result.push(')', this.graft(sub));
          }
        }
      } else if (typeOf.string(graph[n])) {
        result.push(graph[n] as string);
      }
    }

    return result.concat('}').join('');
  }

  protected static dispatch(
    query: string,
    variables?: Record<string, any>
  ): Observable<any> {
    return ModelService.instance.dispatch(query, variables);
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

  public constructor(...parts: Partial<T>[]) {
    Object.defineProperty(this, 'øchanges', {
      value: new BehaviorSubject<T>(this as any as T)
    });

    this.assign(...parts as any[]).subscribe();
  }

  public assign<U extends Model = Model>(
    this: U & Record<string, any>,
    ...parts: Record<string, any>[]
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
    return of(this as U);
  }

  public delete<U extends Model = Model>(
    this: U
  ): Observable<U> {
    return this.entity.deleteOne(
      this.id!
    ).pipe(
      switchMap(() => this.reset())
    );
  }

  public find<U extends Model = Model>(
    this: U,
    graph: EntityGraph<U>,
    filter: EntityFilter<U> = this.serialize(true) as EntityFilter<U>
  ): Observable<U> {
    return this.entity.findOne(
      filter,
      graph as EntityGraph
    ).pipe(
      switchMap((item) => this.assign(item))
    );
  }

  public mutate<U extends Model = Model>(
    this: U,
    mapper: OperatorFunction<Record<string, any>, U>,
    mutation: string,
    variables?: any
  ): Observable<U> {
    return Model.dispatch(
      mutation,
      variables
    ).pipe(
      mapper,
      switchMap((item) => this.assign(item))
    );
  }

  public reset<U extends Model = Model>(
    this: U
  ): Observable<U> {
    const keys: string[] = ['id', 'created', 'modified'];
    for (const key in Reflect.get(this, 'øfields')) { keys.push(key); }
    for (const key in Reflect.get(this, 'øhasMany')) { keys.push(key); }
    for (const key in Reflect.get(this, 'øhasOne')) { keys.push(key); }

    return this.assign(...keys.map((key) => ({
      ['ɵ' + key]: undefined
    })) as any[]);
  }

  public save<U extends Model = Model>(
    this: U,
    graph: EntityGraph<U> = this.treemap()
  ): Observable<U> {
    return this.entity.saveOne(
      this,
      graph as EntityGraph
    ).pipe(
      switchMap((item) => this.assign(item))
    );
  }

  public serialize<U extends Model = Model>(
    shallow?: boolean
  ): Record<string, any> | undefined;
  public serialize<U extends Model = Model>(
    this: U & Record<string, string & U & U[]>,
    shallow: boolean = false
  ): Record<string, any> | undefined {
    const data: Record<string, any> = { };

    for (const key in Reflect.get(this, 'øfields')) {
      if (!typeOf.undefined(this[key])) {
        data[key] = this.valuate(key);
      }
    }

    if (!shallow) {
      for (const key in Reflect.get(this, 'øhasMany')) {
        if (typeOf.array(this[key])) {
          data[key] = this[key].map((item) => item.serialize());
        }
      }

      for (const key in Reflect.get(this, 'øhasOne')) {
        if (typeOf.object(this[key])) {
          data[key] = this[key].serialize();
        }
      }
    }

    return Object.keys(data).length ? data : undefined;
  }

  public treemap<U extends Model = Model>(
    shallow?: boolean
  ): EntityGraph<U>;
  public treemap<U extends Model = Model>(
    this: U & Record<string, string & U & U[]>,
    shallow: boolean = false
  ): EntityGraph<U> {
    const graph: any[] = [];

    for (const key in Reflect.get(this, 'øfields')) {
      if (!typeOf.undefined(this[key])) {
        graph.push(key);
      }
    }

    if (!shallow) {
      for (const key in Reflect.get(this, 'øhasMany')) {
        if (typeOf.array(this[key]) && this[key].length) {
          graph.push({ [key]: this[key][0].treemap() });
        }
      }

      for (const key in Reflect.get(this, 'øhasOne')) {
        if (typeOf.object(this[key])) {
          graph.push({ [key]: this[key].treemap() });
        }
      }
    }

    return graph;
  }

  public valuate<U extends Model = Model>(
    field: string
  ): any;
  public valuate<U extends Model = Model>(
    this: U & Record<string, any>,
    field: string
  ): any {
    switch (this['ɵ' + field].constructor) {
      case Array: return (this['ɵ' + field] as any[]).slice();
      case Boolean: return (this['ɵ' + field] as boolean).valueOf();
      case Date: return (this['ɵ' + field] as Date).toISOString();
      case Number: return (this['ɵ' + field] as number).valueOf();
      case Object: return (this['ɵ' + field] as object).valueOf();
      case String: return (this['ɵ' + field] as string).toString();
      default: return undefined;
    }
  }

}
