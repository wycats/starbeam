export type Unsubscribe = () => void;

export class ObjectLifetime {
  static create(): ObjectLifetime {
    return new ObjectLifetime();
  }

  static finalize(
    lifetime: ObjectLifetime,
    finalizing?: (block: () => void) => void
  ) {
    lifetime.#finalizeIn(finalizing);
  }

  #finalizers: Set<() => void> = new Set();
  #children: Set<ObjectLifetime> = new Set();
  #finalized = false;

  readonly on = {
    finalize: (finalizer: () => void): Unsubscribe => {
      this.#finalizers.add(finalizer);
      return () => this.#finalizers.delete(finalizer);
    },
  };

  link(child: ObjectLifetime): Unsubscribe {
    this.#children.add(child);
    return () => this.#children.delete(child);
  }

  #finalizeIn(finalizing?: (block: () => void) => void) {
    if (this.#finalized) {
      return;
    }

    this.#finalized = true;

    if (finalizing) {
      finalizing(() => {
        this.#finalize();
      });
    } else {
      this.#finalize();
    }
  }

  #finalize() {
    for (const finalizer of this.#finalizers) {
      finalizer();
    }

    for (const child of this.#children) {
      child.#finalize();
    }
  }
}
