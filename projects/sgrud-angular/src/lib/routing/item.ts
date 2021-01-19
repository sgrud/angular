import { Type } from '@angular/core';
import { Data, Resolve } from '@angular/router';
import { Resolver } from './resolver';

export class RoutingItem {

  public readonly children: Type<any>[] = [];

  public readonly data?: Data;

  public readonly guards: Type<any>[] = [];

  public readonly hidden: boolean = false;

  public readonly outlet?: string;

  public readonly path: string = '';

  public readonly refer?: Type<any>;

  public readonly resolve?: Record<string, Resolver<any> | Type<Resolve<any>>>;

  public readonly roles?: string[];

  public constructor(...parts: Partial<RoutingItem>[]) {
    Object.assign(this, ...parts);
  }

}
