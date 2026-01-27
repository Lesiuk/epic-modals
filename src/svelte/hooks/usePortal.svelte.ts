type PortalTarget = string | HTMLElement | null;

const DEFAULT_PORTAL_ID = 'modal-portal';

function getPortalContainer(target: PortalTarget): HTMLElement | null {
  if (typeof window === 'undefined') return null;

  if (target instanceof HTMLElement) {
    return target;
  }

  if (typeof target === 'string') {
    const existing = document.querySelector<HTMLElement>(target);
    if (existing) return existing;

    if (target.startsWith('#')) {
      const id = target.slice(1);
      const element = document.createElement('div');
      element.id = id;
      document.body.appendChild(element);
      return element;
    }
  }

  let portal = document.getElementById(DEFAULT_PORTAL_ID);
  if (!portal) {
    portal = document.createElement('div');
    portal.id = DEFAULT_PORTAL_ID;
    document.body.appendChild(portal);
  }

  return portal;
}

export function usePortal() {

  function mount(element: HTMLElement, target: PortalTarget = null): () => void {
    const container = getPortalContainer(target);

    if (!container) {

      return () => {};
    }

    container.appendChild(element);

    return () => {
      if (element.parentNode === container) {
        container.removeChild(element);
      }

      if (
        container.id !== DEFAULT_PORTAL_ID &&
        container.children.length === 0 &&
        container.parentNode
      ) {
        container.parentNode.removeChild(container);
      }
    };
  }

  return {
    mount,
  };
}
