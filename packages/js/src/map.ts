import { type Equality, Marker } from "@starbeam/core";
import type { DescriptionArgs } from "@starbeam/debug";

import { Collection } from "./collection.js";

export class TrackedMap<K = unknown, V = unknown> implements Map<K, V> {
  static reactive<K, V>(description: DescriptionArgs): TrackedMap<K, V> {
    return new TrackedMap(description);
  }

  readonly #collection: Collection<K>;
  readonly #values: Marker;
  readonly #equals: Equality<V> = Object.is;
  readonly #vals: Map<K, V>;

  private constructor(description: DescriptionArgs) {
    this.#vals = new Map<K, V>();
    this.#values = Marker({
      ...description,
      transform: (d) => d.member("values"),
    });

    this.#collection = Collection.create(description, this);
  }

  // **** KEY GETTERS ****
  get(key: K): V | undefined {
    const has = this.#vals.has(key);

    this.#collection.get(key, has ? "hit" : "miss", " {entry}");
    return this.#vals.get(key);
  }

  has(key: K): boolean {
    const has = this.#vals.has(key);
    this.#collection.check(key, has ? "hit" : "miss", " {entry}");
    return has;
  }

  // **** ALL GETTERS ****
  entries(): IterableIterator<[K, V]> {
    this.#collection.iterateKeys();
    this.#values.consume();
    return this.#vals.entries();
  }

  keys(): IterableIterator<K> {
    this.#collection.iterateKeys();
    return this.#vals.keys();
  }

  values(): IterableIterator<V> {
    this.#collection.iterateKeys();
    this.#values.consume();
    return this.#vals.values();
  }

  forEach(fn: (value: V, key: K, map: Map<K, V>) => void): void {
    this.#collection.iterateKeys();
    this.#values.consume();
    this.#vals.forEach(fn);
  }

  get size(): number {
    this.#collection.iterateKeys();
    return this.#vals.size;
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    this.#collection.iterateKeys();
    this.#values.consume();
    return this.#vals[Symbol.iterator]();
  }

  get [Symbol.toStringTag](): string {
    return this.#vals[Symbol.toStringTag];
  }

  // **** KEY SETTERS ****
  set(key: K, value: V): this {
    const has = this.#vals.has(key);

    if (has) {
      const current = this.#vals.get(key) as V;

      if (this.#equals(current, value)) {
        return this;
      }
    }

    this.#values.update();
    this.#collection.set(key, has ? "key:stable" : "key:changes", " {entry}");
    this.#vals.set(key, value);

    return this;
  }

  delete(key: K): boolean {
    const has = this.#vals.has(key);

    if (!has) {
      return false;
    }

    this.#collection.splice();
    this.#values.update();
    this.#collection.delete(key);
    return this.#vals.delete(key);
  }

  // **** ALL SETTERS ****
  clear(): void {
    const hasItems = this.#vals.size > 0;

    if (!hasItems) {
      return;
    }

    this.#collection.splice();
    this.#values.update();
    this.#vals.clear();
  }
}

// So instanceof works
Object.setPrototypeOf(TrackedMap.prototype, Map.prototype);

export class TrackedWeakMap<K extends object = object, V = unknown>
  implements WeakMap<K, V>
{
  static reactive<K extends object, V>(
    description: DescriptionArgs
  ): WeakMap<K, V> {
    return new TrackedWeakMap(description) as WeakMap<K, V>;
  }

  readonly #collection: Collection<K>;
  readonly #vals: WeakMap<K, V>;
  readonly #equals: Equality<V> = Object.is;

  private constructor(description: DescriptionArgs) {
    // TypeScript doesn't correctly resolve the overloads for calling the `Map`
    // constructor for the no-value constructor. This resolves that.
    this.#vals = new WeakMap();

    // FIXME: Avoid using a regular Map in Collection to avoid leaks. The best
    // thing to do would probably be to have a non-iterable, object-keyed
    // Collection that WeakMap and WeakSet can use.
    this.#collection = Collection.create(description, this);
  }

  get(key: K): V | undefined {
    const has = this.#vals.has(key);

    this.#collection.get(key, has ? "hit" : "miss", " {entry}");
    return this.#vals.get(key);
  }

  has(key: K): boolean {
    const has = this.#vals.has(key);
    this.#collection.check(key, has ? "hit" : "miss", " {entry}");
    return has;
  }

  set(key: K, value: V): this {
    const has = this.#vals.has(key);

    if (has) {
      const current = this.#vals.get(key) as V;

      if (this.#equals(current, value)) {
        return this;
      }
    }

    this.#collection.set(key, has ? "key:stable" : "key:changes", " {entry}");
    this.#vals.set(key, value);

    return this;
  }

  delete(key: K): boolean {
    const has = this.#vals.has(key);

    if (!has) {
      return false;
    }

    this.#collection.delete(key);
    return this.#vals.delete(key);
  }

  get [Symbol.toStringTag](): string {
    return this.#vals[Symbol.toStringTag];
  }
}

// So instanceof works
Object.setPrototypeOf(TrackedWeakMap.prototype, WeakMap.prototype);
