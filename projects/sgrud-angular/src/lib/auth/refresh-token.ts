import { JSONSchema } from '@ngx-pwa/local-storage';

export class RefreshToken {

  public static readonly schema: JSONSchema = {
    type: 'object',
    properties: {
      exp: { type: 'integer' },
      raw: { type: 'string' },
      scopes: { type: 'array', items: { type: 'string', const: 'refresh' } },
      sub: { type: 'string' }
    },
    required: [
      'exp',
      'raw',
      'scopes',
      'sub'
    ]
  };

  public readonly exp: number = 0;
  public readonly raw: string = '';
  public readonly scopes: string[] = ['refresh'];
  public readonly sub: string = '';

  public get valid(): boolean {
    return this.exp - 60 > Date.now() / 1000;
  }

  public constructor(...parts: Partial<RefreshToken>[]) {
    Object.assign(this, ...parts);
  }

}
