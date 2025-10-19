
import { lazy, ComponentType } from 'react';

interface PreloadableComponent<T extends ComponentType<any>> {
  preload: () => Promise<{ default: T }>;
}

export function lazyWithPreload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): T & PreloadableComponent<T> {
  const Component = lazy(factory) as T & PreloadableComponent<T>;
  Component.preload = factory;
  return Component;
}

// Preload on hover/focus for better UX
export function usePreloadOnHover<T extends ComponentType<any>>(
  Component: T & PreloadableComponent<T>
) {
  return {
    onMouseEnter: () => Component.preload(),
    onFocus: () => Component.preload(),
  };
}
