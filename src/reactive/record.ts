import type { ReactiveMetadata } from ".";
import { isObject } from "..";
import { Reactive } from "./core";

export type InnerDict = {
  readonly [P in keyof any]: Reactive<unknown>;
};

/**
 * `ReactiveRecord` wraps a JavaScript object whose values are other Reactive`
 * values. The keys of a `ReactiveRecord` are fixed at construction time, and
 * the `Reactive` values may not be changed at runtime.
 *
 * If you want to update the values of a `ReactiveRecord`, the reactive value
 * must be a `Cell`, and you must update the `Cell` directly.
 */
export class ReactiveRecord<D extends InnerDict> {
  static is(value: unknown): value is AnyReactiveRecord {
    return isObject(value) && value instanceof ReactiveRecord;
  }

  readonly #dict: D;
  readonly metadata: ReactiveMetadata;

  constructor(dict: D) {
    this.#dict = dict;
    this.metadata = {
      isStatic: Object.values(this.#dict).every(Reactive.isStatic),
    };
  }

  get<K extends keyof D>(key: K): D[K] {
    return this.#dict[key];
  }
}

export type AnyReactiveRecord = ReactiveRecord<InnerDict>;
