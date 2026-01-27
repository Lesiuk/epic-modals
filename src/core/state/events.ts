export type EventCallback<T = void> = (data: T) => void;

export function createEventEmitter<T>() {

  const listeners = new Map<keyof T, Set<EventCallback<any>>>();

  return {

    on<K extends keyof T>(event: K, callback: EventCallback<T[K]>): () => void {
      let set = listeners.get(event);
      if (!set) {
        set = new Set();
        listeners.set(event, set);
      }
      set.add(callback);

      return () => {
        set?.delete(callback);
        if (set?.size === 0) {
          listeners.delete(event);
        }
      };
    },

    emit<K extends keyof T>(event: K, data: T[K]): void {
      const set = listeners.get(event);
      if (set) {
        set.forEach((callback) => callback(data));
      }
    },

    off<K extends keyof T>(event?: K): void {
      if (event) {
        listeners.delete(event);
      } else {
        listeners.clear();
      }
    },

    listenerCount<K extends keyof T>(event: K): number {
      return listeners.get(event)?.size ?? 0;
    },
  };
}

export type EventEmitter<T> = ReturnType<typeof createEventEmitter<T>>;
