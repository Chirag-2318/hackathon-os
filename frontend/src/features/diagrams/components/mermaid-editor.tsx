import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';

interface MermaidEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MermaidEditor({ value, onChange }: MermaidEditorProps) {
  return (
    <div className="flex-1 overflow-hidden bg-[#1E1E1E] flex flex-col font-mono text-sm">
      <div className="h-10 shrink-0 bg-[#2D2D2D] border-b border-[#3E3E42] flex items-center px-4">
        <span className="text-slate-300">diagram.mermaid</span>
      </div>
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={value}
          height="100%"
          theme="dark"
          extensions={[markdown()]}
          onChange={onChange}
          className="h-full font-mono [&_.cm-editor]:h-full [&_.cm-scroller]:font-mono"
        />
      </div>
    </div>
  );
}
