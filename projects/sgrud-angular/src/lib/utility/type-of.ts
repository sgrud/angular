// tslint:disable:ban-types

const test: (arg: any, type: string) => boolean = (arg: any, type: string) => {
  return Object.prototype.toString.call(arg).match(type) !== null;
};

export const typeOf: {
  array: (arg: any) => arg is any[];
  boolean: (arg: any) => arg is boolean;
  date: (arg: any) => arg is Date;
  function: (arg: any) => arg is Function;
  null: (arg: any) => arg is null;
  number: (arg: any) => arg is number;
  object: (arg: any) => arg is object;
  string: (arg: any) => arg is string;
  undefined: (arg: any) => arg is undefined;
} = {
  array: (arg: any): arg is any[] => test(arg, 'Array'),
  boolean: (arg: any): arg is boolean => test(arg, 'Boolean'),
  date: (arg: any): arg is Date => test(arg, 'Date'),
  function: (arg: any): arg is Function => test(arg, 'Function'),
  null: (arg: any): arg is null => test(arg, 'Null'),
  number: (arg: any): arg is number => test(arg, 'Number'),
  object: (arg: any): arg is object => test(arg, 'Object'),
  string: (arg: any): arg is string => test(arg, 'String'),
  undefined: (arg: any): arg is undefined => test(arg, 'Undefined')
};
