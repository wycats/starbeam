import { type DescriptionArgs, Stack } from "@starbeam/debug";
import { type ReactiveInternals, REACTIVE } from "@starbeam/timeline";

import { Reactive } from "../../reactive.js";
import { Formula } from "../formula/formula.js";

type Key = unknown;
type Entry<T> = [Key, T];

class ReactiveFormulaList<T, U> implements Reactive<U[]> {
  static create<T, U>(
    this: void,
    iterable: Iterable<T>,
    {
      key,
      value,
    }: {
      key: (item: T) => Key;
      value: (item: T) => U;
    },
    desc?: string | DescriptionArgs
  ) {
    const descArgs = Stack.description(desc);

    const list = Formula(
      () => [...iterable].map((item): [Key, T] => [key(item), item]),
      descArgs
    );
    const description = Reactive.description(list);
    const last = list.current;

    const map = new Map<Key, Formula<U>>();

    for (const [key, item] of last) {
      map.set(
        key,
        Formula(() => value(item), { description: description.member("item") })
      );
    }

    return new ReactiveFormulaList(last, list, map, value);
  }

  #last: Entry<T>[];
  #inputs: Formula<Entry<T>[]>;
  #map: Map<Key, Formula<U>>;
  #value: (item: T) => U;

  #outputs: Formula<U[]>;

  constructor(
    last: Entry<T>[],
    list: Formula<Entry<T>[]>,
    map: Map<Key, Formula<U>>,
    value: (item: T) => U
  ) {
    this.#last = last;
    this.#inputs = list;
    this.#map = map;
    this.#value = value;

    this.#outputs = Formula(() => {
      this.#update();

      return [...this.#map.values()].map((formula) => formula.current);
    });
  }

  get [REACTIVE](): ReactiveInternals {
    return this.#outputs[REACTIVE];
  }

  get current(): U[] {
    return this.#outputs.current;
  }

  #update() {
    const next = this.#inputs.current;

    if (this.#last === next) {
      return;
    }

    this.#last = next;

    const map: Map<Key, Formula<U>> = new Map();

    for (const [key, item] of next) {
      const formula = this.#map.get(key);

      if (formula === undefined) {
        map.set(
          key,
          Formula(() => this.#value(item), {
            description: Reactive.description(this.#inputs).member("item"),
          })
        );
      } else {
        map.set(key, formula);
      }
    }

    this.#map = map;
  }
}

export type FormulaList<U> = ReactiveFormulaList<unknown, U>;
export const FormulaList = ReactiveFormulaList.create;
