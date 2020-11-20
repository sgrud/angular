import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../auth/service';
import { SgrudConfig } from '../sgrud-config';
import { EntityFields } from '../typing/entity-fields';
import { EntityGraph } from '../typing/entity-graph';
import { EntityPieces } from '../typing/entity-pieces';
import { EntityType } from '../typing/entity-type';
import { FilterParams } from '../typing/filter-params';
import { PageableList } from '../typing/pagable-list';
import { typeOf } from '../utility/type-of';
import { Model } from './model';

@Injectable({
  providedIn: 'root'
})

export class ModelService {

  private static øinstance: ModelService;

  public static get instance(): ModelService {
    return this.øinstance;
  }

  public constructor(
    private readonly authService: AuthService,
    private readonly httpClient: HttpClient,
    private readonly sgrudConfig: SgrudConfig
  ) {
    ModelService.øinstance = this;
  }

  public commit(
    query: string,
    variables: Record<string, any>
  ): Observable<any> {
    return this.authService.tokens.pipe(take(1), map((tokens) => ({
      Authorization: `Bearer ${tokens.access.raw}`
    })), switchMap((headers) => this.httpClient.post<any>(
      this.sgrudConfig.endpoints.graphql.href,
      { query: query.replace(/(^|\W)\s*/g, '$1'), variables },
      { headers }
    ).pipe(map((response) => response.data))));
  }

  public deleteAll<T extends Model>(
    model: EntityType<T>,
    ...ids: string[]
  ): Observable<any> {
    return this.commit(`
      mutation deleteAll($ids: [String]!) {
        delete${model.multi}(ids: $ids)
      }
    `, { ids });
  }

  public deleteOne<T extends Model>(
    model: EntityType<T>,
    id: string
  ): Observable<any> {
    return this.commit(`
      mutation deleteOne($id: String!) {
        delete${model.mono}(id: $id)
      }
    `, { id });
  }

  public findAll<T extends Model>(
    model: EntityType<T>,
    graph: EntityGraph<T>,
    params: FilterParams<T>
  ): Observable<PageableList<T>> {
    return this.commit(`
      query findAll($params: FilterSortPaginate_${model.type}Input!) {
        get${model.multi}(params: $params) {
          result ${this.unravel(graph)}
          total
        }
      }
    `, { params }).pipe(map((data) => {
      const value: PageableList<T> = data[`get${model.multi}`];
      value.result = value?.result?.map((i) => new model(i));
      return value;
    }));
  }

  public findOne<T extends Model>(
    model: EntityType<T>,
    graph: EntityGraph<T>,
    entity: EntityPieces<T>
  ): Observable<T> {
    return this.commit(`
      query findOne($entity: ${model.type}Input!) {
        get${model.mono}(entity: $entity) ${this.unravel(graph)}
      }
    `, { entity }).pipe(map((data) => {
      const value: T = data[`get${model.mono}`];
      return new model(value);
    }));
  }

  public saveAll<T extends Model>(
    model: EntityType<T>,
    graph: EntityGraph<T>,
    items: T[]
  ): Observable<T[]> {
    return this.commit(`
      mutation saveAll($items: [${model.type}Input]!) {
        save${model.multi}(entities: $items) ${this.unravel(graph)}
      }
    `, { items: items.map((i) => i.serialize()) }).pipe(map((data) => {
      const value: T[] = data[`save${model.multi}`].result;
      return value.map((i) => new model(i));
    }));
  }

  public saveOne<T extends Model>(
    model: EntityType<T>,
    graph: EntityGraph<T>,
    item: T
  ): Observable<T> {
    return this.commit(`
      mutation saveOne($item: ${model.type}Input!) {
        save${model.mono}(entity: $item) ${this.unravel(graph)}
      }
    `, { item: item.serialize() }).pipe(map((data) => {
      const value: T = data[`save${model.mono}`];
      return new model(value);
    }));
  }

  public serialize<T extends Model>(
    item: T,
    shallow: boolean
  ): EntityPieces<T> | undefined {
    const data: EntityPieces<T> = { };

    for (const key in Reflect.get(item, 'øfield') as Partial<T>) {
      if (!typeOf.undefined(item[key])) {
        // @ts-expect-error
        data[key] = this.valuate(item, key);
      }
    }

    if (!shallow) {
      for (const key in Reflect.get(item, 'øhasMany') as Partial<T>) {
        if (typeOf.array(item[key])) {
          // @ts-expect-error
          data[key] = item[key].map((i) => i.serialize(shallow));
        }
      }

      for (const key in Reflect.get(item, 'øhasOne') as Partial<T>) {
        if (typeOf.object(item[key])) {
          // @ts-expect-error
          data[key] = item[key].serialize(shallow);
        }
      }
    }

    return Object.keys(data).length ? data : undefined;
  }

  public treemap<T extends Model>(
    item: T,
    shallow: boolean
  ): EntityGraph<T> {
    const graph: EntityGraph<T> = [];

    for (const key in Reflect.get(item, 'øfield') as Partial<T>) {
      if (!typeOf.undefined(item[key])) {
        // @ts-expect-error
        graph.push(key);
      }
    }

    if (!shallow) {
      for (const key in Reflect.get(item, 'øhasMany') as Partial<T>) {
        if (typeOf.array(item[key])) {
          // @ts-expect-error
          graph.push({ [key]: item[key].map((i) => i.treemap(shallow)) });
        }
      }

      for (const key in Reflect.get(item, 'øhasOne') as Partial<T>) {
        if (typeOf.object(item[key])) {
          // @ts-expect-error
          graph.push({ [key]: item[key].treemap(shallow) });
        }
      }
    }

    return graph;
  }

  public unravel<T extends Model>(
    graph: EntityGraph<T>
  ): string {
    const result: string[] = ['{'];

    for (let n: number = 0; n < graph.length; n++) {
      if (n > 0) { result.push(' '); }
      let node: any = graph[n];

      if (typeOf.object(node)) {
        for (const key in node) {
          node = node[key];

          if (typeOf.array(node) && node.length > 0) {
            result.push(key, this.unravel(node));
          } else if (typeOf.function(node)) {
            const { [key]: sub, ...vars } = node();
            const keys: string[] = Object.keys(vars);
            result.push(key, '(');

            for (let m: number = 0; m < keys.length; m++) {
              if (m > 0) { result.push(' '); }
              result.push(`${keys[m]}:${JSON.stringify(vars[keys[m]])}`);
            }

            result.push(')', this.unravel(sub));
          }
        }
      } else if (typeOf.array(node) && node.length > 0) {
        result.push(this.unravel(node).slice(1, -1));
      } else if (typeOf.string(node)) {
        result.push(node);
      }
    }

    return result.concat('}').join('');
  }

  public valuate<T extends Model>(
    item: T,
    field: EntityFields<T>
  ): any {
    const value: any = item['ɵ' + field as EntityFields<T>];

    switch (true) {
      default: return undefined;
      case typeOf.null(value): return null;
      case value.constructor === Array: return (value as any[])?.slice();
      case value.constructor === Boolean: return (value as boolean)?.valueOf();
      case value.constructor === Date: return (value as Date)?.toISOString();
      case value.constructor === Number: return (value as number)?.valueOf();
      case value.constructor === Object: return (value as object)?.valueOf();
      case value.constructor === String: return (value as string)?.toString();
    }
  }

}
