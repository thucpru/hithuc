import { useMemo } from 'react';
import { PipecatClient } from '@pipecat-ai/client-js';
import { DailyTransport } from '@pipecat-ai/daily-transport';
import { PipecatClientProvider, PipecatClientAudio } from '@pipecat-ai/client-react';
import { ChatWidget } from './ChatWidget';
import { UiControlBridge } from './UiControlBridge';

/**
 * Mounts the chatbot: creates one PipecatClient (Daily transport) and renders
 * the floating widget, the UI-control bridge, and the audio output element.
 * Must live inside Router + LanguageProvider (the bridge uses their hooks).
 */
export function ChatProvider({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const client = useMemo(
    () =>
      new PipecatClient({
        transport: new DailyTransport(),
        enableMic: false,
        enableCam: false,
      }),
    [],
  );

  return (
    <PipecatClientProvider client={client}>
      <UiControlBridge />
      <ChatWidget defaultOpen={defaultOpen} />
      <PipecatClientAudio />
    </PipecatClientProvider>
  );
}

export default ChatProvider;
