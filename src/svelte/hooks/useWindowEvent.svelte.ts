export function useWindowEvent() {

  function addListener<K extends keyof WindowEventMap>(
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => unknown,
    options?: AddEventListenerOptions
  ): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    window.addEventListener(type, listener, options);

    return () => {
      window.removeEventListener(type, listener, options);
    };
  }

  function addListenerEffect<K extends keyof WindowEventMap>(
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => unknown,
    options?: AddEventListenerOptions
  ) {
    $effect(() => {
      if (typeof window === 'undefined') return;

      const cleanup = addListener(type, listener, options);

      return cleanup;
    });
  }

  return {
    addListener,
    addListenerEffect,
  };
}
