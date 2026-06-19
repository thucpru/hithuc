import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownProps {
  children: string;
  className?: string;
}

/** Renders markdown content with the Tailwind typography (`prose`) styling. */
export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={cn('prose prose-neutral max-w-none', className)}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
