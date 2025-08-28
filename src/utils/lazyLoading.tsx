import { lazy, Suspense, type ComponentType } from "react";

interface LazyComponentProps {
  fallback?: React.ComponentType;
}

export function withLazyLoading<T extends object>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  fallbackComponent?: React.ComponentType
) {
  const LazyComponent = lazy(importFunc);

  return function LazyWrapper(props: T & LazyComponentProps) {
    const FallbackComponent =
      props.fallback ||
      fallbackComponent ||
      (() => (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ));
    return (
      <Suspense fallback={<FallbackComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
