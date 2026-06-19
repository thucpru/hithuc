import { Suspense, lazy, useState } from 'react';
import { MessageCircle } from 'lucide-react';

// Heavy (Pipecat + Daily) — only loaded once the user opens the chat, keeping
// it off the initial/critical bundle.
const ChatProvider = lazy(() => import('./ChatProvider'));

/**
 * Lightweight always-rendered launcher. Renders just a button until first
 * click, then lazy-mounts the full chat (which opens immediately).
 */
export function ChatLauncher() {
  const [mounted, setMounted] = useState(false);

  if (mounted) {
    return (
      <Suspense fallback={null}>
        <ChatProvider defaultOpen />
      </Suspense>
    );
  }

  return (
    <button
      onClick={() => setMounted(true)}
      aria-label="Open chat"
      className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg hover:opacity-90 transition-opacity"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}
