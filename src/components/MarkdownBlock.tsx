import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownBlock({ markdown }: { markdown: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
