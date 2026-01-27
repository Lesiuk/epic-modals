export function appendElement(node: HTMLElement, element: HTMLElement | null | undefined) {
  if (element) {
    node.appendChild(element);
  }

  return {
    update(newElement: HTMLElement | null | undefined) {

      node.innerHTML = '';

      if (newElement) {
        node.appendChild(newElement);
      }
    },
    destroy() {

      node.innerHTML = '';
    }
  };
}
