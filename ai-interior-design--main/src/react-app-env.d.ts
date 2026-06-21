// Minimal ambient declarations to satisfy TypeScript when React types are missing
declare module 'react' {
  const React: any;
  export default React;
  export const useState: any;
  export const useEffect: any;
  export const useRef: any;
  export const useMemo: any;
  export const useCallback: any;
  export const Fragment: any;
  export function createElement(...args: any[]): any;
}

declare module 'react-dom' {
  const x: any;
  export default x;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
    'model-viewer': any;
  }
}
