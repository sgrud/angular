import { Type } from '@angular/core';
import { Resolve } from '@angular/router';
import { Resolver } from './resolver';

export class RoutingItem {

  public readonly children: Type<any>[] = [];

  public readonly hidden: boolean = false;

  public readonly path?: string;

  public readonly refer?: Type<any>;

  public readonly resolve?: Record<string, Resolver<any> | Type<Resolve<any>>>;

  public readonly roles?: string[];

  public constructor(...parts: Partial<RoutingItem>[]) {
    Object.assign(this, ...parts);
  }

}
