"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function handler(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!promptEvent || dismissed) return null;

  return (
    <div className="fixed inset-x-4 bottom-24 z-40 flex items-center gap-3 rounded-2xl border border-accent/50 bg-surface-elevated p-4 shadow-lg">
      <Download size={20} className="shrink-0 text-accent" />
      <div className="flex-1 text-sm">
        <p className="font-medium">Установить «Пятый вкус»</p>
        <p className="text-text-muted">Быстрый доступ прямо с экрана телефона</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          await promptEvent.prompt();
          setPromptEvent(null);
        }}
        className="pill bg-accent px-3 py-2 text-xs font-semibold text-accent-contrast"
      >
        Установить
      </button>
      <button
        type="button"
        aria-label="Закрыть"
        onClick={() => setDismissed(true)}
        className="text-text-muted"
      >
        <X size={16} />
      </button>
    </div>
  );
}
