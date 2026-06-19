import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Mic, MicOff } from 'lucide-react';
import { RTVIEvent } from '@pipecat-ai/client-js';
import {
  usePipecatClient,
  usePipecatClientTransportState,
  useRTVIClientEvent,
} from '@pipecat-ai/client-react';
import { useLanguage } from '@/context/LanguageContext';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
}

function getSessionId(): string {
  const KEY = 'hithuc.chat.sid';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function ChatWidget({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const client = usePipecatClient();
  const state = usePipecatClientTransportState();
  const { lang } = useLanguage();

  const [open, setOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [micOn, setMicOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamingRef = useRef(false);

  const connected = state === 'connected' || state === 'ready';
  const connecting = state === 'connecting' || state === 'authenticating';

  // Stream assistant tokens into the last bot bubble.
  useRTVIClientEvent(
    RTVIEvent.BotLlmText,
    useCallback((data: { text?: string }) => {
      const text = data?.text ?? '';
      if (!text) return;
      setMessages((prev) => {
        if (streamingRef.current && prev.length && prev[prev.length - 1].role === 'bot') {
          const next = [...prev];
          next[next.length - 1] = { role: 'bot', text: next[next.length - 1].text + text };
          return next;
        }
        streamingRef.current = true;
        return [...prev, { role: 'bot', text }];
      });
    }, []),
  );

  // Voice: show finalized user speech.
  useRTVIClientEvent(
    RTVIEvent.UserTranscript,
    useCallback((data: { text?: string; final?: boolean }) => {
      if (!data?.final || !data.text) return;
      streamingRef.current = false;
      setMessages((prev) => [...prev, { role: 'user', text: data.text! }]);
    }, []),
  );

  const ensureConnected = useCallback(async () => {
    if (connected || connecting) return;
    setError(null);
    try {
      await client.startBotAndConnect({
        endpoint: '/api/agent/session',
        requestData: { sessionId: getSessionId(), lang, turnstileToken: '' },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect');
    }
  }, [client, connected, connecting, lang]);

  const openPanel = useCallback(() => {
    setOpen(true);
    void ensureConnected();
  }, [ensureConnected]);

  // Auto-connect when mounted already open (lazy-launched from the button).
  useEffect(() => {
    if (defaultOpen) void ensureConnected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    streamingRef.current = false;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    void client.sendText(text).catch((err) => setError(String(err)));
  }, [client, input]);

  const toggleMic = useCallback(() => {
    const next = !micOn;
    setMicOn(next);
    try {
      // enableMic exists on the client; guard in case of version drift.
      (client as unknown as { enableMic?: (on: boolean) => void }).enableMic?.(next);
    } catch {
      /* noop */
    }
  }, [client, micOn]);

  if (!open) {
    return (
      <button
        onClick={openPanel}
        aria-label="Open chat"
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg hover:opacity-90 transition-opacity"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col rounded-lg border border-gray-200 bg-background shadow-xl">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <span className="text-sm font-semibold text-foreground">
          {lang === 'vi' ? 'Trợ lý' : 'Assistant'}
          {connecting && <span className="ml-2 text-xs text-muted-foreground">…</span>}
        </span>
        <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {lang === 'vi'
              ? 'Hỏi mình về các dự án, blog, hoặc bảo mình mở trang nào đó.'
              : 'Ask about the projects, the blog, or tell me to open a page.'}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <span
              className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                m.role === 'user' ? 'bg-foreground text-background' : 'bg-gray-100 text-foreground'
              }`}
            >
              {m.text}
            </span>
          </div>
        ))}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <div className="flex items-center gap-2 border-t border-gray-200 p-2">
        <button
          onClick={toggleMic}
          aria-label={micOn ? 'Mute mic' : 'Enable mic'}
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md ${
            micOn ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={lang === 'vi' ? 'Nhắn tin…' : 'Type a message…'}
          className="flex-1 rounded-md border border-gray-200 bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
        />
        <button
          onClick={send}
          aria-label="Send"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-foreground text-background hover:opacity-90"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
