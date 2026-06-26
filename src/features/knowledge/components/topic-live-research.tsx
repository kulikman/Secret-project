"use client";

import { ExternalLink, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface TopicLiveResearchProps {
  slug: string;
  title: string;
}

interface LiveResearchResult {
  citations: string[];
  content: string;
  generatedAt: string;
  model: string;
  provider: "perplexity";
  searchResults: Array<{
    snippet: string | null;
    title: string | null;
    url: string;
  }>;
}

interface ResearchEnvelope {
  ok: boolean;
  data?: {
    research: LiveResearchResult | null;
    status?: "not_configured";
  };
  error?: string;
}

interface DraftEnvelope {
  ok: boolean;
  data?: {
    draft: {
      created_at: string;
      id: string;
      status: string;
      topic_node_id: string;
    };
  };
  error?: string;
}

export function TopicLiveResearch({ slug, title }: TopicLiveResearchProps): React.ReactElement {
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [research, setResearch] = useState<LiveResearchResult | null>(null);

  async function loadResearch(): Promise<void> {
    setDraftError(null);
    setDraftMessage(null);
    setResearchError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/topics/${encodeURIComponent(slug)}/research`, {
        method: "POST",
      });
      const payload = (await response.json()) as ResearchEnvelope;

      if (payload.ok && payload.data?.status === "not_configured") {
        setResearchError("Perplexity пока не настроен: добавь PERPLEXITY_API_KEY на сервере.");
        return;
      }

      if (!response.ok || !payload.ok || !payload.data?.research) {
        setResearchError(
          payload.error
            ? "Не удалось собрать live research. Попробуй ещё раз позже."
            : "Research endpoint вернул пустой ответ."
        );
        return;
      }

      setResearch(payload.data.research);
    } catch {
      setResearchError("Не удалось связаться с research endpoint.");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveDraft(): Promise<void> {
    if (!research) return;

    setDraftError(null);
    setDraftMessage(null);
    setIsSavingDraft(true);

    try {
      const response = await fetch(
        `/api/admin/topics/${encodeURIComponent(slug)}/research-drafts`,
        {
          body: JSON.stringify(research),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      );
      const payload = (await response.json()) as DraftEnvelope;

      if (!response.ok || !payload.ok || !payload.data?.draft) {
        if (response.status === 401 || response.status === 403) {
          setDraftError("Сохранение доступно только админам/редакторам.");
          return;
        }

        setDraftError("Не удалось сохранить черновик. Проверь admin-доступ и попробуй ещё раз.");
        return;
      }

      setDraftMessage(`Черновик сохранён: ${payload.data.draft.id}`);
    } catch {
      setDraftError("Не удалось связаться с admin draft endpoint.");
    } finally {
      setIsSavingDraft(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-cyan-500/20 bg-slate-950 p-5 text-slate-100 shadow-[0_18px_70px_rgba(8,47,73,0.28)]">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-2 text-cyan-200">
          <Sparkles className="size-5" />
        </div>
        <div>
          <p className="font-mono text-xs tracking-[0.24em] text-cyan-200 uppercase">
            Perplexity live research
          </p>
          <h2 className="mt-1 text-xl font-semibold">Наполнение по теме</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            По клику собираем русское web-grounded резюме для “{title}”. Это не сохраняется в
            projection и не считается опубликованным досье без редакторской проверки.
          </p>
        </div>
      </div>

      <Button
        className="mt-5 w-full border-cyan-300/20 bg-cyan-300/10 text-cyan-50 hover:bg-cyan-300/20"
        disabled={isLoading}
        onClick={loadResearch}
        type="button"
        variant="outline"
      >
        {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
        {isLoading ? "Собираю источники..." : "Собрать исследование"}
      </Button>

      {researchError ? (
        <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
          {researchError}
        </p>
      ) : null}

      {research ? (
        <div className="mt-5 space-y-5">
          <div className="rounded-2xl bg-white/[0.06] p-4 text-sm leading-7 whitespace-pre-wrap text-slate-100">
            {research.content}
          </div>
          <div>
            <p className="font-mono text-xs tracking-[0.22em] text-slate-400 uppercase">
              Источники
            </p>
            {research.searchResults.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {research.searchResults.map((source) => (
                  <li key={source.url} className="rounded-2xl bg-white/[0.05] p-3">
                    <a
                      className="flex items-start gap-2 text-sm font-medium text-cyan-100 hover:text-white"
                      href={source.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span>{source.title ?? source.url}</span>
                      <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
                    </a>
                    {source.snippet ? (
                      <p className="mt-2 text-xs leading-5 text-slate-400">{source.snippet}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                Perplexity вернул ответ без отдельного списка источников.
              </p>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Provider: {research.provider} · model: {research.model} ·{" "}
            {new Date(research.generatedAt).toLocaleString("ru-RU")}
          </p>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
            <p className="text-sm leading-6 text-slate-300">
              Редакторский шаг: можно сохранить этот ответ как черновик досье. Он останется `draft`
              и не попадёт в public projection без отдельной проверки.
            </p>
            <Button
              className="mt-3 w-full"
              disabled={isSavingDraft}
              onClick={saveDraft}
              type="button"
              variant="secondary"
            >
              {isSavingDraft ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {isSavingDraft ? "Сохраняю черновик..." : "Сохранить как draft"}
            </Button>
            {draftMessage ? (
              <p className="mt-3 rounded-xl bg-emerald-400/10 p-3 text-sm text-emerald-100">
                {draftMessage}
              </p>
            ) : null}
            {draftError ? (
              <p className="mt-3 rounded-xl bg-amber-300/10 p-3 text-sm text-amber-100">
                {draftError}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
