import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { RTVIEvent } from '@pipecat-ai/client-js';
import { useRTVIClientEvent } from '@pipecat-ai/client-react';
import { useLanguage } from '@/context/LanguageContext';
import { isProjectType, Lang } from '@/types/content';

interface UiMessage {
  type?: string;
  action?: string;
  args?: Record<string, unknown>;
}

/**
 * Bridges bot-driven UI actions (RTVI server messages of shape
 * `{type:'ui', action, args}`) to the React app: navigation, language, theme.
 * Mounted inside Router + LanguageProvider so it can use their hooks.
 */
export function UiControlBridge() {
  const navigate = useNavigate();
  const { setLang } = useLanguage();
  const { setTheme } = useTheme();

  const onServerMessage = useCallback(
    (msg: UiMessage) => {
      if (!msg || msg.type !== 'ui' || !msg.action) return;
      const args = msg.args ?? {};
      switch (msg.action) {
        case 'navigate': {
          const path = String(args.path ?? '/');
          if (path.startsWith('/')) navigate(path);
          break;
        }
        case 'open_project':
          if (args.slug) navigate(`/project/${args.slug}`);
          break;
        case 'filter_work': {
          const type = String(args.type ?? '');
          navigate(isProjectType(type) ? `/work/${type}` : '/work');
          break;
        }
        case 'set_language':
          if (args.lang === 'vi' || args.lang === 'en') setLang(args.lang as Lang);
          break;
        case 'set_theme':
          if (args.theme === 'light' || args.theme === 'dark') setTheme(String(args.theme));
          break;
        case 'scroll_to':
          if (args.section) {
            document.getElementById(String(args.section))?.scrollIntoView({ behavior: 'smooth' });
          }
          break;
        default:
          break;
      }
    },
    [navigate, setLang, setTheme],
  );

  useRTVIClientEvent(RTVIEvent.ServerMessage, onServerMessage);
  return null;
}
