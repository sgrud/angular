export class Enumerator extends String { }

export function Enumerate<T>(enumerator: T): T {
  return Object.keys(enumerator).reduce((obj, key) => ({
    ...obj, [key]: new Enumerator(enumerator[key as keyof typeof enumerator])
  }), { }) as T;
}
