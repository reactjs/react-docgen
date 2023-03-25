import type { RefObject } from 'react';
import { useCallback } from 'react';
import { useTheme } from 'next-themes';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import type { EditorMode } from './Playground';
import { EditorView } from '@codemirror/view';

interface PanelProps {
  codeSample?: string;
  mode?: EditorMode;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  ref?: RefObject<unknown>;
  value: string;
}

type Theme = 'dark' | 'light';

function disableSpellcheck() {
  return EditorView.contentAttributes.of({
    spellcheck: 'false',
    'data-gramm': 'false',
  });
}

export default function Panel({
  onChange,
  readOnly = false,
  value,
}: PanelProps) {
  const { resolvedTheme } = useTheme();
  let changeHandler;

  if (onChange) {
    changeHandler = useCallback(onChange, []);
  }

  return (
    <CodeMirror
      value={value}
      height="100%"
      minHeight="100%"
      extensions={[javascript({ jsx: true }), disableSpellcheck()]}
      onChange={changeHandler}
      theme={(resolvedTheme as Theme) || 'light'}
      readOnly={readOnly}
      basicSetup={{
        foldGutter: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        lineNumbers: true,
      }}
    />
  );
}
