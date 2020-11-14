const test: (arg: any, type: string) => boolean = (arg: any, type: string) => {
  return Object.prototype.toString.call(arg).match(type) !== null;
};

// tslint:disable:ban-types
export const typeOf: {
  array: (value: any) => value is any[];
  boolean: (value: any) => value is boolean;
  date: (value: any) => value is Date;
  function: (value: any) => value is Function;
  null: (value: any) => value is null;
  number: (value: any) => value is number;
  object: (value: any) => value is object;
  string: (value: any) => value is string;
  undefined: (value: any) => value is undefined;
} = {
  array: (value: any): value is any[] => test(value, 'Array'),
  boolean: (value: any): value is boolean => test(value, 'Boolean'),
  date: (value: any): value is Date => test(value, 'Date'),
  function: (value: any): value is Function => test(value, 'Function'),
  null: (value: any): value is null => test(value, 'Null'),
  number: (value: any): value is number => test(value, 'Number'),
  object: (value: any): value is object => test(value, 'Object'),
  string: (value: any): value is string => test(value, 'String'),
  undefined: (value: any): value is undefined => test(value, 'Undefined')
};
