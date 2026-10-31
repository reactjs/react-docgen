import { useCallback, useImperativeHandle, useMemo } from 'react';

export function Input(props) {
  const missing = useCallback();
  const number = useCallback(42, []);
  const args = [() => {}, []];
  const spread = useCallback(...args);
  const nested = useCallback(
    useCallback(() => {}, []),
    [],
  );
  const memoized = useMemo(() => () => {}, []);
  const render = useCallback(() => {}, []);

  {
    const useCallback = (fn) => fn;
    const local = useCallback(() => {}, []);
    useImperativeHandle(props.ref, () => ({ local }));
  }

  try {
  } catch (useCallback) {
    const caught = useCallback(() => {}, []);
    useImperativeHandle(props.ref, () => ({ caught }));
  }

  {
    const useImperativeHandle = (ref, factory) => factory();
    useImperativeHandle(props.ref, () => ({ unrelated() {} }));
  }

  function nestedComponent() {
    const hidden = useCallback(() => {}, []);
    useImperativeHandle(props.ref, () => ({ hidden }));
  }

  useImperativeHandle(props.ref, () => ({
    missing,
    number,
    spread,
    nested,
    memoized,
    render,
    notAMethod: 42,
    plain() {},
  }));
  return <input />;
}
