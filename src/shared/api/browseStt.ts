export type BrowserSttHandlers = {
  onStart?: () => void;
  onEnd?: () => void;
  onInterim?: (text: string) => void; // 말하는 중간
  onFinal?: (text: string) => void;   // 문장 확정(서버로 보낼 후보)
  onError?: (error: string) => void;
};

export type BrowserSttController = {
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export function createBrowserStt(
  lang: string,
  handlers: BrowserSttHandlers
): BrowserSttController {
  // @ts-expect-error webkit fallback
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return {
      isSupported: false,
      start: () => handlers.onError?.("not_supported"),
      stop: () => {},
      abort: () => {},
    };
  }

  const rec = new SpeechRecognition();
  rec.lang = lang;
  rec.interimResults = true; // 중간결과(실시간)
  rec.continuous = true;     // 연속 인식
  rec.maxAlternatives = 1;

  rec.onstart = () => handlers.onStart?.();
  rec.onend = () => handlers.onEnd?.();
  rec.onerror = (e: any) => handlers.onError?.(e?.error ?? "stt_error");

  rec.onresult = (event: any) => {
    let interim = "";
    let finalText = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      const text = res?.[0]?.transcript ?? "";
      if (res.isFinal) finalText += text;
      else interim += text;
    }

    const iText = interim.trim();
    const fText = finalText.trim();

    if (iText) handlers.onInterim?.(iText);
    if (fText) handlers.onFinal?.(fText);
  };

  return {
    isSupported: true,
    start: () => {
      try { rec.start(); } catch { /* 중복 start 방지용 */ }
    },
    stop: () => rec.stop(),
    abort: () => rec.abort(),
  };
}
