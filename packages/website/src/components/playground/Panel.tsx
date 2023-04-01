import { useCallback } from 'react';
import { useTheme } from 'next-themes';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';

interface PanelProps {
  language?: EditorMode;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  value: string;
}

type Theme = 'dark' | 'light';

export enum EditorMode {
  JAVASCRIPT = 'javascript',
  JSON = 'json',
}

function disableSpellcheck() {
  return EditorView.contentAttributes.of({
    spellcheck: 'false',
    'data-gramm': 'false',
  });
}

function languageExtension(language: EditorMode) {
  if (language === EditorMode.JSON) {
    return json();
  }

  return javascript({ jsx: true, typescript: true });
}

export default function Panel({
  onChange,
  language = EditorMode.JAVASCRIPT,
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
      extensions={[languageExtension(language), disableSpellcheck()]}
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
