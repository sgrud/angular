import { JSONSchema } from '@ngx-pwa/local-storage';

export class AccessToken {

  public static readonly schema: JSONSchema = {
    type: 'object',
    properties: {
      exp: { type: 'integer' },
      id: { type: 'string' },
      raw: { type: 'string' },
      roles: { type: 'array', items: { type: 'string' } },
      scopes: {  type: 'array', items: { const: 'access', type: 'string' } },
      sub: { type: 'string' }
    },
    required: [
      'exp',
      'id',
      'raw',
      'roles',
      'scopes',
      'sub'
    ]
  };

  public readonly exp: number = 0;
  public readonly id: string = '';
  public readonly raw: string = '';
  public readonly roles: string[] = [];
  public readonly scopes: string[] = ['access'];
  public readonly sub: string = '';

  public constructor(...parts: Partial<AccessToken>[]) {
    Object.assign(this, ...parts);
  }

}
