
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "~/utils/api";
import type {
  ChatMessage,
  ClarifyQuestion,
  PinIntent,
  AgentStage,
  Pin,
  AgentResponse,
  QuestionResponse,
  ResultsResponse,
  ConfirmResponse,
  SuccessResponse,
  InfoResponse,
} from "~/lib/agent/types";
import {
  MapPin,
  Layers,
  Grid2x2,
  ChevronRight,
  Loader2,
  Minus,
  Trash2,
  X,
  ChevronDown,
  Send,
  CheckCircle2,
} from "lucide-react";
import { Switch } from "~/components/shadcn/ui/switch";
import { Label } from "~/components/shadcn/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/shadcn/ui/radio-group";
import { Button } from "~/components/shadcn/ui/button";
import { Separator } from "~/components/shadcn/ui/separator";
import type { PinOptions, GroupingMode } from "~/lib/agent/types";
import { cn } from "~/lib/utils";
import Image from "next/image";

const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Stage labels ─────────────────────────────────────────────────────────────

const STAGE_LABEL: Record<AgentStage, string> = {
  idle: "",
  extracting_intent: "Understanding request…",
  clarifying: "",
  searching: "Searching for places…",
  confirming: "Ready to drop pins",
  dropping_pins: "Dropping pins…",
  done: "All done!",
  error: "Something went wrong",
};

const SUGGESTIONS = [
  "Drop 100 KFC pins in the US",
  "100 restaurants in Geneseo Area",
  "Music events worldwide",
  "Drop pins around hospitals in Tokyo",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function parseReply(raw: string): AgentResponse {
  const stripped = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      const parsed = JSON.parse(stripped.slice(start, end + 1)) as AgentResponse;
      if (parsed && typeof parsed.type === "string") return parsed;
    } catch {
      // fall through
    }
  }
  return {
    type: "info",
    message: raw.trim() || "Something went wrong. Please try again.",
  };
}

// ─── Poll helper ──────────────────────────────────────────────────────────────

type PollResult = {
  reply: string;
  stage: AgentStage;
  intent: PinIntent;
  pins?: Pin[];
  jobId?: string;
};

/**
 * Polls `agentJobResult` every 1.5 s until status is completed/failed.
 * Resolves with the typed result or rejects on failure / timeout (90 s).
 */
function usePollAgentJob() {
  const utils = api.useUtils();

  const poll = useCallback(
    (
      jobId: string,
      onStatusChange?: (status: string) => void
    ): Promise<PollResult> => {
      return new Promise((resolve, reject) => {
        const TIMEOUT_MS = 90_000;
        const INTERVAL_MS = 1_500;
        const startedAt = Date.now();

        const tick = async () => {
          if (Date.now() - startedAt > TIMEOUT_MS) {
            reject(new Error("Timed out waiting for agent job"));
            return;
          }

          try {
            const job = await utils.agent.pollJobResult.fetch({ jobId });
            onStatusChange?.(job.status);

            if (job.status === "completed" && job.result) {
              resolve(job.result as PollResult);
            } else if (job.status === "failed") {
              reject(new Error(job.error ?? "Agent job failed"));
            } else {
              setTimeout(() => void tick(), INTERVAL_MS);
            }
          } catch (err) {
            reject(err);
          }
        };

        void tick();
      });
    },
    [utils]
  );

  return poll;
}

// ─── Intent badge strip ───────────────────────────────────────────────────────

function IntentBadge({ intent }: { intent: PinIntent }) {
  const parts = [
    intent.count != null && `${intent.count} pins`,
    intent.query && `"${intent.query}"`,
    intent.area && `📍 ${intent.area}`,
  ].filter(Boolean) as string[];
  if (!parts.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {parts.map((p, i) => (
        <span
          key={i}
          className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                     bg-primary/10 text-primary border border-primary/20"
        >
          {p}
        </span>
      ))}
    </div>
  );
}

// ─── Typing dots ──────────────────────────────────────────────────────────────

function TypingDots({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}

// ─── QuestionBlock ────────────────────────────────────────────────────────────

function QuestionBlock({
  data,
  onAnswer,
  answered = false,
  answeredValues,
}: {
  data: QuestionResponse;
  onAnswer: (answers: Record<string, string>) => void;
  answered?: boolean;
  answeredValues?: Record<string, string>;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [showCustom, setShowCustom] = useState<Record<string, boolean>>({});
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);

  const fields = data.fields;
  const currentField = fields[currentFieldIndex];

  if (answered && answeredValues) {
    return (
      <div className="mt-2 flex flex-col gap-1.5">
        {fields.map((f) => (
          <div
            key={f.id}
            className="flex items-center gap-2 px-3 py-2 rounded-xl
                                   bg-muted/40 border border-border/50 opacity-70"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-[12px] text-muted-foreground">{f.label}:</span>
            <span className="text-[12px] font-semibold text-foreground truncate">
              {answeredValues[f.id] ?? "—"}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const handleChoice = (fieldId: string, value: string) => {
    const updated = { ...answers, [fieldId]: value };
    setAnswers(updated);
    const nextIndex = currentFieldIndex + 1;
    if (nextIndex < fields.length) {
      setCurrentFieldIndex(nextIndex);
    } else {
      onAnswer(updated);
    }
  };

  const handleCustomSubmit = (fieldId: string) => {
    const val = customValues[fieldId]?.trim();
    if (!val) return;
    handleChoice(fieldId, val);
  };

  const handleKeyDown = (e: React.KeyboardEvent, fieldId: string) => {
    if (e.key === "Enter") handleCustomSubmit(fieldId);
  };

  if (!currentField) return null;

  const isMultipleChoice = currentField.inputType === "multiple_choice";
  const isShowingCustom = showCustom[currentField.id];

  return (
    <div className="mt-2 space-y-3">
      {fields.length > 1 && (
        <div className="flex items-center gap-1.5">
          {fields.map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i < currentFieldIndex
                ? "bg-primary"
                : i === currentFieldIndex
                  ? "bg-foreground"
                  : "bg-muted"
                }`}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-1">
            {currentFieldIndex + 1}/{fields.length}
          </span>
        </div>
      )}

      <p className="text-[13px] font-semibold text-foreground">{currentField.label}</p>

      {isMultipleChoice && currentField.options && !isShowingCustom && (
        <div className="flex flex-col gap-1.5">
          {currentField.options.map((opt, idx) => (
            <button
              key={opt}
              onClick={() => handleChoice(currentField.id, opt)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left
                         bg-muted border border-border text-foreground text-[13px]
                         hover:bg-primary/10 hover:border-primary/40 transition-all duration-150
                         active:scale-[0.98]"
            >
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground flex-shrink-0">
                {idx + 1}
              </span>
              <span className="font-medium">{opt}</span>
            </button>
          ))}
          <button
            onClick={() => setShowCustom((p) => ({ ...p, [currentField.id]: true }))}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left
                       bg-transparent border border-dashed border-border
                       text-muted-foreground text-[13px] hover:text-foreground hover:border-primary/50
                       transition-all duration-150"
          >
            <span className="w-6 h-6 rounded-full border border-border flex items-center justify-center flex-shrink-0">
              <svg
                viewBox="0 0 12 12"
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M6 1v10M1 6h10" />
              </svg>
            </span>
            <span>Something else…</span>
          </button>
        </div>
      )}

      {(isShowingCustom ?? !isMultipleChoice) && (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            type={currentField.inputType === "number" ? "number" : "text"}
            value={customValues[currentField.id] ?? ""}
            onChange={(e) =>
              setCustomValues((p) => ({ ...p, [currentField.id]: e.target.value }))
            }
            onKeyDown={(e) => handleKeyDown(e, currentField.id)}
            placeholder={currentField.placeholder ?? "Type your answer…"}
            className="flex-1 bg-muted rounded-xl px-3 py-2.5
                       text-foreground text-sm placeholder-muted-foreground
                       border border-border focus:border-primary
                       focus:outline-none transition-colors"
          />
          <button
            onClick={() => handleCustomSubmit(currentField.id)}
            disabled={!customValues[currentField.id]?.trim()}
            className="px-3 py-2.5 rounded-xl bg-primary hover:bg-primary/90
                       disabled:opacity-40 text-primary-foreground text-sm font-bold
                       transition-colors flex-shrink-0"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Job progress bar ─────────────────────────────────────────────────────────

function JobProgressBar({
  jobId,
  onComplete,
}: {
  jobId: string;
  onComplete: (count: number) => void;
}) {
  const [done, setDone] = useState(false);

  const { data } = api.agent.jobStatus.useQuery(
    { jobId },
    {
      enabled: !done,
      refetchInterval: (data) => {
        if (!data) return 1500;
        const s = (data as { status?: string })?.status;
        if (s === "completed" || s === "failed") return false;
        return 1500;
      },
    }
  );

  useEffect(() => {
    if (!data) return;
    if (data.status === "completed" || data.status === "failed") {
      setDone(true);
      onComplete(data.completed ?? 0);
    }
  }, [data, onComplete]);

  const status = data?.status ?? "pending";
  const total = data?.total ?? 0;
  const completed = data?.completed ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const isError = status === "failed";
  const isComplete = status === "completed";

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">
          {isComplete ? "Pins dropped!" : isError ? "Some pins failed" : "Dropping pins…"}
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">
          {completed}/{total}
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isError ? "bg-red-500" : "bg-emerald-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {isError && data?.error && (
        <p className="text-[11px] text-red-400">{data.error}</p>
      )}

      {(isComplete || isError) && data?.log && data.log.length > 0 && (
        <details className="mt-1">
          <summary className="text-[11px] text-muted-foreground cursor-pointer select-none">
            View log ({data.log.filter((l) => l.status === "error").length} errors)
          </summary>
          <div className="mt-1.5 space-y-0.5 max-h-32 overflow-y-auto">
            {data.log.map((entry, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px]">
                <span
                  className={
                    entry.status === "ok" ? "text-emerald-500" : "text-red-400"
                  }
                >
                  {entry.status === "ok" ? "✓" : "✗"}
                </span>
                <span className="text-foreground truncate">{entry.title}</span>
                {entry.error && (
                  <span className="text-red-400 truncate">— {entry.error}</span>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}


// ─── ResultsConfirmPanel ──────────────────────────────────────────────────────

function ResultsConfirmPanel({
  message,
  pinCount,
  onConfirm,
  isLoading = false,
  detectedPinNumber = 1,
}: {
  message: string;
  pinCount: number;
  onConfirm: (options: PinOptions) => void;
  isLoading?: boolean;
  detectedPinNumber?: number;
}) {
  const [autoCollect, setAutoCollect] = useState(false);
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("per-location");
  const [pinNumber, setPinNumber] = useState(detectedPinNumber ?? 1);
  const [currentStep, setCurrentStep] = useState(0);
  console.log("detectedPinNumber prop:", detectedPinNumber);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === 1;
  // Sync when parent intent updates after mount
  useEffect(() => {
    setPinNumber(detectedPinNumber ?? 1);
  }, [detectedPinNumber]);

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    } else {
      onConfirm({ autoCollect, groupingMode, pinNumber });
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-3 max-w-sm">

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">Configuration</p>
        <span className="text-[10px] text-muted-foreground font-medium">
          {currentStep + 1}/2
        </span>
      </div>

      {/* ── Step 1: QR Code grouping ── */}
      {isFirstStep && (
        <section className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Location QR Code</p>
          <RadioGroup
            value={groupingMode}
            onValueChange={(v) => setGroupingMode(v as GroupingMode)}
            className="flex flex-col gap-1.5"
            aria-label="Location grouping mode"
          >
            <Label
              htmlFor="group-per-location"
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition-all",
                groupingMode === "per-location"
                  ? "border-primary/50 bg-primary/10"
                  : "border-border bg-muted/30 hover:bg-muted/50"
              )}
            >
              <RadioGroupItem
                id="group-per-location"
                value="per-location"
                className="mt-0.5 shrink-0 border-border text-primary"
              />
              <div className="flex flex-col gap-0.5 flex-1">
                <span
                  className={cn(
                    "text-xs font-medium",
                    groupingMode === "per-location"
                      ? "text-primary"
                      : "text-foreground"
                  )}
                >
                  {pinCount} QR codes
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  Each pin has its own code
                </span>
              </div>
            </Label>

            <Label
              htmlFor="group-single"
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition-all",
                groupingMode === "single-group"
                  ? "border-primary/50 bg-primary/10"
                  : "border-border bg-muted/30 hover:bg-muted/50"
              )}
            >
              <RadioGroupItem
                id="group-single"
                value="single-group"
                className="mt-0.5 shrink-0 border-border text-primary"
              />
              <div className="flex flex-col gap-0.5 flex-1">
                <span
                  className={cn(
                    "text-xs font-medium",
                    groupingMode === "single-group"
                      ? "text-primary"
                      : "text-foreground"
                  )}
                >
                  1 QR code
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  All pins grouped together
                </span>
              </div>
            </Label>
          </RadioGroup>
        </section>
      )}

      {/* ── Step 2: Auto-collect + Pin Number ── */}
      {!isFirstStep && (
        <section className="flex flex-col gap-2">

          {/* Auto-collect toggle */}
          <p className="text-xs font-medium text-muted-foreground">Auto Mode</p>
          <div
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors",
              autoCollect
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-muted/30"
            )}
          >
            <div className="flex flex-col gap-1 flex-1">
              <Label
                htmlFor="auto-collect-switch"
                className="cursor-pointer text-xs font-medium text-foreground"
              >
                {autoCollect ? "Enabled" : "Disabled"}
              </Label>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {autoCollect ? "Automatic on proximity" : "Manual tap to collect"}
              </p>
            </div>
            <Switch
              id="auto-collect-switch"
              checked={autoCollect}
              onCheckedChange={setAutoCollect}
              aria-label="Toggle auto collect"
            />
          </div>

          {/* Pin Number stepper */}
          <p className="text-xs font-medium text-muted-foreground mt-1">Pins per Location</p>
          <div
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors",
              pinNumber > 1
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-muted/30"
            )}
          >
            <div className="flex flex-col gap-1 flex-1">
              <Label className="text-xs font-medium text-foreground">
                Pin Number
              </Label>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {pinNumber === 1
                  ? "One pin per location"
                  : `${pinNumber} pins at each location`}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPinNumber((n) => Math.max(1, n - 1))}
                disabled={pinNumber <= 1}
                className={cn(
                  "w-7 h-7 rounded-lg border flex items-center justify-center",
                  "text-sm font-bold transition-all active:scale-95 flex-shrink-0",
                  pinNumber <= 1
                    ? "border-border bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
                    : "border-border bg-muted hover:bg-muted/80 text-foreground"
                )}
                aria-label="Decrease pin number"
              >
                −
              </button>

              <input
                type="number"
                min={1}
                max={200}
                value={pinNumber}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setPinNumber(1); // reset to 1 on clear
                    return;
                  }
                  const parsed = parseInt(raw, 10);
                  if (!isNaN(parsed)) {
                    setPinNumber(Math.min(200, Math.max(1, parsed)));
                  }
                }}
                onBlur={(e) => {
                  // Clamp and sanitise on blur in case user typed partial value
                  const parsed = parseInt(e.target.value, 10);
                  setPinNumber(isNaN(parsed) ? 1 : Math.min(200, Math.max(1, parsed)));
                }}
                onKeyDown={(e) => {
                  // Block decimal point, minus, plus, e (scientific notation)
                  if ([".", "-", "+", "e", "E"].includes(e.key)) e.preventDefault();
                }}
                className={cn(
                  "w-12 h-7 rounded-lg border text-center text-sm font-semibold",
                  "bg-muted text-foreground tabular-nums",
                  "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30",
                  "transition-colors [appearance:textfield]",
                  // Hide browser native number spinners
                  "[&::-webkit-outer-spin-button]:appearance-none",
                  "[&::-webkit-inner-spin-button]:appearance-none",
                  pinNumber > 1 ? "border-primary/40" : "border-border"
                )}
                aria-label="Pin number"
              />

              <button
                type="button"
                onClick={() => setPinNumber((n) => Math.min(200, n + 1))}

                className={cn(
                  "w-7 h-7 rounded-lg border flex items-center justify-center",
                  "text-sm font-bold transition-all active:scale-95 flex-shrink-0",

                  "border-border bg-muted hover:bg-muted/80 text-foreground"
                )}
                aria-label="Increase pin number"
              >
                +
              </button>
            </div>
          </div>

          {/* Summary pill — only show when pinNumber > 1 */}
          {pinNumber > 1 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 w-fit">
              <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="text-[11px] font-semibold text-primary">
                {pinCount * pinNumber} total pins
                <span className="font-normal text-primary/70 ml-1">
                  ({pinCount} locations × {pinNumber})
                </span>
              </span>
            </div>
          )}
        </section>
      )
      }

      {/* ── Navigation ── */}
      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={isFirstStep || isLoading}
          className={cn(
            "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
            "border border-border",
            isFirstStep || isLoading
              ? "opacity-40 cursor-not-allowed bg-muted/30 text-muted-foreground"
              : "bg-muted hover:bg-muted/80 text-foreground active:scale-95"
          )}
        >
          ← Previous
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={isLoading}
          className={cn(
            "flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1",
            "bg-primary text-primary-foreground",
            "hover:opacity-90 active:scale-95",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
            isLoading && "opacity-60 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          ) : (
            <>
              {isLastStep ? "Confirm" : "Next"}
              <ChevronRight className="h-3 w-3" aria-hidden />
            </>
          )}
        </button>
      </div>
    </div >
  );
}
// ─── ResultsBlock ─────────────────────────────────────────────────────────────

function ResultsBlock({
  data,
  pins,
  onConfirm,
  onDismiss,
  isLoading,
  confirmed,
  jobId,
  onJobComplete,
  detectedPinNumber,
}: {
  data: ResultsResponse;
  pins: Pin[];
  onConfirm: (options: PinOptions) => void;
  onDismiss: () => void;
  isLoading: boolean;
  confirmed: boolean;
  jobId?: string;
  onJobComplete: (count: number) => void;
  detectedPinNumber?: number;
}) {
  const displayPins = pins.length > 0 ? pins : [];
  const count = displayPins.length || data.pinCount;


  return (
    <div className="space-y-2">
      <div>
        <p className="text-[11px] text-muted-foreground">
          {data.message}
        </p>
      </div>

      {displayPins.length > 0 && (
        <div className="space-y-1.5 overflow-y-auto pr-0.5" style={{ maxHeight: "300px" }}>
          {displayPins.map((pin) => (
            <PinCard key={pin.id} pin={pin} />
          ))}
        </div>
      )}

      {jobId ? (
        <JobProgressBar jobId={jobId} onComplete={onJobComplete} />
      ) : confirmed ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-xs text-emerald-400 font-semibold">
            Queued {count} pins for drop
          </span>
        </div>
      ) : (
        <>
          <ResultsConfirmPanel
            message={data.message}
            pinCount={count}
            onConfirm={onConfirm}
            isLoading={isLoading}
            detectedPinNumber={detectedPinNumber} // ← new pro
          />
          <button
            onClick={onDismiss}
            className="w-full py-2 rounded-xl bg-muted border border-border
                             text-muted-foreground text-sm hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
}

// ─── ConfirmBlock ─────────────────────────────────────────────────────────────

function ConfirmBlock({
  data,
  pins,
  onConfirm,
  onDismiss,
  isDropping,
}: {
  data: ConfirmResponse;
  pins: Pin[];
  onConfirm: (pins: Pin[]) => void;
  onDismiss: () => void;
  isDropping: boolean;
}) {
  return (
    <div className=" space-y-3">
      <div className="rounded-xl bg-muted/30 border border-border divide-y divide-border">
        {[
          { label: "What", value: data.summary.what },
          { label: "Where", value: data.summary.where },
          { label: "Count", value: `${data.summary.count} pins` },
          { label: "Type", value: data.summary.type, badge: true },
        ].map(({ label, value, badge }) => (
          <div key={label} className="flex items-center justify-between px-3 py-2.5">
            <span className="text-muted-foreground text-xs">{label}</span>
            {badge ? (
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-bold",
                  value === "EVENT"
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-primary/15 text-primary"
                )}
              >
                {value}
              </span>
            ) : (
              <span className="text-foreground text-xs font-semibold">{value}</span>
            )}
          </div>
        ))}
      </div>

      {pins.length > 0 && (
        <div className="space-y-1 overflow-y-auto pr-0.5" style={{ maxHeight: "220px" }}>
          {pins.map((pin) => (
            <PinCard key={pin.id} pin={pin} compact />
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onConfirm(pins)}
          disabled={isDropping}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                     bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60
                     text-white text-sm font-bold transition-colors
                     shadow-lg shadow-emerald-500/20"
        >
          {isDropping ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Dropping…
            </>
          ) : (
            <>
              <span>📍</span> Confirm & Drop Pins
            </>
          )}
        </button>
        <button
          onClick={onDismiss}
          disabled={isDropping}
          className="px-4 py-3 rounded-xl bg-muted border border-border
                     text-muted-foreground text-sm hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── SuccessBlock ─────────────────────────────────────────────────────────────

function SuccessBlock({ data }: { data: SuccessResponse }) {
  return (
    <div
      className="mt-2 flex items-center gap-3 px-4 py-3 rounded-xl
                    bg-emerald-500/10 border border-emerald-500/25"
    >
      <span className="text-2xl flex-shrink-0">🎉</span>
      <div>
        <p className="text-emerald-400 text-sm font-bold">{data.message}</p>
        <p className="text-emerald-500/70 text-xs mt-0.5">
          {data.count} pin{data.count !== 1 ? "s" : ""} saved to your map
        </p>
      </div>
    </div>
  );
}

// ─── InfoBlock ────────────────────────────────────────────────────────────────

function InfoBlock({ data }: { data: InfoResponse }) {
  return (
    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
      {data.message}
    </p>
  );
}

<<<<<<< HEAD
export default function AgentChat({ creatorId }: AgentChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState("")
  const [agentState, setAgentState] = useState<AgentState>(INITIAL_STATE)
  const [pollingJobId, setPollingJobId] = useState<string | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const endRef = useRef<HTMLDivElement>(null)

  const chatMutation = api.agent.chat.useMutation();

  const { data: agentJobResult } = api.agent.agentJobResult.useQuery(
    { jobId: pollingJobId! },
    {
      enabled: !!pollingJobId,
      refetchInterval: (data) => {
        if (data?.status === "completed" || data?.status === "failed") return false;
        return 1500; // poll every 1.5s
      },
      refetchIntervalInBackground: true,
    }
  );

  useEffect(() => {
    if (!agentJobResult) return;

    if (agentJobResult.status === "completed" && agentJobResult.result) {
      const { message, state: newState, uiData, jobId } = agentJobResult.result;
      setPollingJobId(null);
      setIsWaiting(false);

      const newMessage: Message = {
        role: "assistant",
        content: message,
        uiData: uiData ? {
          type: uiData.type as Message["uiData"] extends { type: infer T } ? T : never,
          data: uiData.data,
        } : undefined,
      };
      setMessages((prev) => [...prev, newMessage]);
      setAgentState(newState);
    }

    if (agentJobResult.status === "failed") {
      setPollingJobId(null);
      setIsWaiting(false);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      }]);
    }
  }, [agentJobResult]);
=======
// ─── PinCard ──────────────────────────────────────────────────────────────────

function PinCard({ pin, compact = false }: { pin: Pin; compact?: boolean }) {
  const handleMapRedirect = () => {
    window.open(
      `https://www.google.com/maps?q=${pin.latitude},${pin.longitude}`,
      "_blank",
      "noreferrer"
    );
  };

  return (
    <div
      onClick={handleMapRedirect}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-border",
        "bg-muted/50 cursor-pointer hover:bg-muted hover:border-border/80",
        "transition-colors",
        compact ? "px-3 py-2" : "px-3 py-2.5"
      )}
    >
      {pin.image && !compact && (
        <img
          src={pin.image}
          alt={pin.title}
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-muted"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className={cn(
              "text-[9px] px-1.5 py-0.5 rounded font-bold flex-shrink-0",
              pin.type === "EVENT"
                ? "bg-amber-500/20 text-amber-400"
                : "bg-primary/20 text-primary"
            )}
          >
            {pin.type ?? "LANDMARK"}
          </span>
          <p className="text-foreground text-xs font-medium truncate">{pin.title}</p>
        </div>

        {pin.address && !compact && (
          <p className="text-muted-foreground text-[11px] truncate">{pin.address}</p>
        )}
        {pin.description && !compact && (
          <p className="text-muted-foreground text-[11px] mt-0.5 line-clamp-2 leading-relaxed">
            {pin.description}
          </p>
        )}
        {pin.type === "EVENT" && pin.startDate && (
          <p className="text-amber-500/60 text-[11px] mt-0.5">
            {formatDate(pin.startDate)}
            {pin.endDate ? ` → ${formatDate(pin.endDate)}` : ""}
          </p>
        )}
        {!compact && (
          <div className="flex items-center gap-1 mt-1">
            <svg
              viewBox="0 0 16 16"
              className="w-3 h-3 text-muted-foreground flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 1.5C5.79 1.5 4 3.29 4 5.5c0 3.25 4 9 4 9s4-5.75 4-9c0-2.21-1.79-4-4-4z" />
              <circle cx="8" cy="5.5" r="1.25" />
            </svg>
            <span className="text-muted-foreground text-[10px] font-mono">
              {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
            </span>
          </div>
        )}
        {pin.url && !compact && (
          <a
            href={pin.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 mt-1 group w-fit max-w-full"
          >
            <svg
              viewBox="0 0 16 16"
              className="w-3 h-3 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3M9 2h5m0 0v5m0-5L7 10" />
            </svg>
            <span className="text-muted-foreground group-hover:text-primary text-[10px] truncate transition-colors">
              {pin.url.replace(/^https?:\/\//, "")}
            </span>
          </a>
        )}
      </div>
    </div>
  );
}

// ─── AgentResponseBlock ───────────────────────────────────────────────────────

function AgentResponseBlock({
  response,
  pins,
  intent,
  onAnswer,
  onConfirmWithOptions,
  onConfirmPins,
  onDismiss,
  isDropping,
  isLoading,
  questionAnswered,
  questionAnsweredValues,
  resultsConfirmed,
  resultsJobId,
  onJobComplete,
}: {
  response: AgentResponse;
  pins: Pin[];
  intent: PinIntent;
  onAnswer: (answers: Record<string, string>) => void;
  onConfirmWithOptions: (options: PinOptions) => void;
  onConfirmPins: (pins: Pin[]) => void;
  onDismiss: () => void;
  isDropping: boolean;
  isLoading: boolean;
  questionAnswered?: boolean;
  questionAnsweredValues?: Record<string, string>;
  resultsConfirmed?: boolean;
  resultsJobId?: string;
  onJobComplete: (count: number) => void;
}) {
  switch (response.type) {
    case "question":
      return (
        <div>
          <p className="text-[13px] leading-relaxed text-foreground mb-1">
            {response.message}
          </p>
          <QuestionBlock
            data={response}
            onAnswer={onAnswer}
            answered={questionAnswered}
            answeredValues={questionAnsweredValues}
          />
          {!questionAnswered && <IntentBadge intent={intent} />}
        </div>
      );

    case "results":
      return (
        <div>
          <ResultsBlock
            data={response}
            pins={pins}
            onConfirm={onConfirmWithOptions}
            onDismiss={onDismiss}
            isLoading={isLoading}
            confirmed={resultsConfirmed ?? false}
            jobId={resultsJobId}
            onJobComplete={onJobComplete}
            detectedPinNumber={intent.pinNumber ?? 1} // ← pass through

          />
        </div>
      );

    case "confirm":
      return (
        <div>
          <p className="text-[13px] leading-relaxed text-foreground mb-1">
            {response.message}
          </p>
          <ConfirmBlock
            data={response}
            pins={pins}
            onConfirm={onConfirmPins}
            onDismiss={onDismiss}
            isDropping={isDropping}
          />
        </div>
      );

    case "success":
      return <SuccessBlock data={response} />;

    case "info":
    default:
      return (
        <div>
          <InfoBlock data={response} />
          <IntentBadge intent={intent} />
        </div>
      );
  }
}

// ─── LocalChatMessage ─────────────────────────────────────────────────────────

interface LocalChatMessage {
  id: string;
  role: "user" | "assistant";
  content:
  | { kind: "text"; text: string }
  | { kind: "loading"; label?: string }
  | {
    kind: "response";
    data: AgentResponse;
    pins: Pin[];
    questionAnswered?: boolean;
    questionAnsweredValues?: Record<string, string>;
    resultsConfirmed?: boolean;
    resultsJobId?: string;
  };
  createdAt: Date;
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  intent,
  onAnswer,
  onConfirmWithOptions,
  onConfirmPins,
  onDismiss,
  isDropping,
  isLoading,
  onJobComplete,
}: {
  msg: LocalChatMessage;
  intent: PinIntent;
  onAnswer: (msgId: string, answers: Record<string, string>) => void;
  onConfirmWithOptions: (options: PinOptions) => void;
  onConfirmPins: (pins: Pin[]) => void;
  onDismiss: () => void;
  isDropping: boolean;
  isLoading: boolean;
  onJobComplete: (count: number) => void;
}) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2.5`}>
      {!isUser && (
        <div
          className="w-8 h-8 rounded-full bg-primary-foreground border-2
                     flex items-center justify-center text-primary-foreground text-[10px] font-bold
                     flex-shrink-0 mt-1 shadow-lg shadow-primary/20"
        >
          <Image
            src="/favicon.ico"
            alt="Agent Avatar"
            width={32}
            height={32}
            className="rounded-full"
          />
        </div>
      )}

      <div
        className={cn(
          "max-w-[60%] rounded-2xl px-4 py-3 text-sm h-full",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground border border-border rounded-bl-sm w-[60%]"
        )}
      >
        {msg.content.kind === "loading" && <TypingDots label={msg.content.label} />}

        {msg.content.kind === "text" && (
          <p className="whitespace-pre-wrap leading-relaxed">{msg.content.text}</p>
        )}

        {msg.content.kind === "response" && (
          <AgentResponseBlock
            response={msg.content.data}
            pins={msg.content.pins}
            intent={intent}
            onAnswer={(answers) => onAnswer(msg.id, answers)}
            onConfirmWithOptions={onConfirmWithOptions}
            onConfirmPins={onConfirmPins}
            onDismiss={onDismiss}
            isDropping={isDropping}
            isLoading={isLoading}
            questionAnswered={msg.content.questionAnswered}
            questionAnsweredValues={msg.content.questionAnsweredValues}
            resultsConfirmed={msg.content.resultsConfirmed}
            resultsJobId={msg.content.resultsJobId}
            onJobComplete={onJobComplete}
          />
        )}
      </div>

      {isUser && (
        <div
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center
                     text-muted-foreground text-xs font-bold flex-shrink-0 mt-1"
        >
          U
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PinAgentChat({ creatorId }: { creatorId: string }) {
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [intent, setIntent] = useState<PinIntent>({
    count: null,
    query: null,
    area: null,
    areaType: "unknown",
    confirmed: false,
    countSpecified: false,
    isNiche: false,
    pinNumber: undefined,
  });
  const [stage, setStage] = useState<AgentStage>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [currentPins, setCurrentPins] = useState<Pin[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatCreate = api.agent.create.useMutation();
  const pollJob = usePollAgentJob();
>>>>>>> 5657b4d4 (refactor: update agent types and pin creation logic)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Build plain-text history for tRPC ────────────────────────────────────

  const buildHistory = useCallback(
    (extraUserText?: string) => {
      const history = messages
        .map((m) => {
          if (m.content.kind === "text") {
            return { role: m.role as "user" | "assistant", text: m.content.text };
          }
          if (m.content.kind === "response") {
            const d = m.content.data;
            const text =
              d.type === "info" ||
                d.type === "question" ||
                d.type === "success" ||
                d.type === "results" ||
                d.type === "confirm"
                ? d.message
                : "";
            return { role: "assistant" as const, text };
          }
          return null;
        })
        .filter(Boolean) as { role: "user" | "assistant"; text: string }[];

      if (extraUserText) history.push({ role: "user", text: extraUserText });
      return history;
    },
    [messages]
  );

  // ── Core send ─────────────────────────────────────────────────────────────

<<<<<<< HEAD
  const send = useCallback(
    async (userMsg: string, stateOverride?: Partial<AgentState>) => {
      setIsOpen(true);
      if (!userMsg.trim() || isWaiting) return;

      const currentState = stateOverride ? { ...agentState, ...stateOverride } : agentState;
      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
      setInput("");
      setIsWaiting(true);

      try {
        const { jobId } = await chatMutation.mutateAsync({
          message: userMsg,
          history,
          state: currentState,
          creatorId,
        });
        setPollingJobId(jobId); // start polling
      } catch {
        setIsWaiting(false);
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        }]);
      }
    },
    [agentState, chatMutation, messages, creatorId, isWaiting],
=======
  const sendMessage = useCallback(
    async (userText: string, intentOverride?: Partial<PinIntent>) => {
      if (!userText.trim() || isLoading) return;

      const mergedIntent = { ...intent, ...intentOverride };
      const loadingId = uid();

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "user",
          content: { kind: "text", text: userText },
          createdAt: new Date(),
        },
        {
          id: loadingId,
          role: "assistant",
          content: { kind: "loading", label: STAGE_LABEL["extracting_intent"] },
          createdAt: new Date(),
        },
      ]);
      setIsLoading(true);
      setInput("");

      try {
        // Step 1: enqueue and get jobId immediately
        const { jobId } = await chatCreate.mutateAsync({
          messages: buildHistory(userText),
          intent: mergedIntent,
          creatorId,
        });

        // Step 2: poll until completed — update loading label on status changes
        const result = await pollJob(jobId, (status) => {
          const label =
            status === "processing"
              ? STAGE_LABEL["searching"]
              : STAGE_LABEL["extracting_intent"];
          setMessages((prev) =>
            prev.map((m) =>
              m.id === loadingId
                ? { ...m, content: { kind: "loading" as const, label } }
                : m
            )
          );
        });

        // Step 3: render result
        const serverPins = result.pins ?? [];
        if (serverPins.length > 0) setCurrentPins(serverPins);

        const agentResponse = parseReply(result.reply);

        setMessages((prev) => [
          ...prev.filter((m) => m.id !== loadingId),
          {
            id: uid(),
            role: "assistant",
            content: {
              kind: "response",
              data: agentResponse,
              pins: serverPins.length > 0 ? serverPins : currentPins,
            },
            createdAt: new Date(),
          },
        ]);

        setStage(result.stage);
        setIntent(result.intent);
      } catch (err) {
        console.error("[sendMessage] Error:", err);
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== loadingId),
          {
            id: uid(),
            role: "assistant",
            content: {
              kind: "response",
              data: {
                type: "info",
                message: "Sorry, something went wrong. Please try again.",
              },
              pins: [],
            },
            createdAt: new Date(),
          },
        ]);
        setStage("error");
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [isLoading, intent, currentPins, buildHistory, chatCreate, pollJob]
>>>>>>> 5657b4d4 (refactor: update agent types and pin creation logic)
  );

  // ── Handle question answers ───────────────────────────────────────────────

  const handleAnswer = useCallback(
    (msgId: string, answers: Record<string, string>) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msgId || m.content.kind !== "response") return m;
          return {
            ...m,
            content: {
              ...m.content,
              questionAnswered: true,
              questionAnsweredValues: answers,
            },
          };
        })
      );

      const intentPatch: Partial<PinIntent> = {
        // ── Preserve ALL existing intent values explicitly ──
        count: intent.count,
        countSpecified: intent.countSpecified,
        area: intent.area,
        pinNumber: intent.pinNumber,
        areaType: intent.areaType,
      };

      for (const [k, v] of Object.entries(answers)) {
        const key = k.toLowerCase().trim();
        if (key === "count" || key === "how_many" || key === "how many") {
          intentPatch.count = parseInt(v, 10) || null;
          intentPatch.countSpecified = true;
        } else if (key === "query" || key === "what" || key === "search") {
          intentPatch.query = v;
        } else if (
          key === "area" ||
          key === "where" ||
          key === "location" ||
          key === "city"
        ) {
          intentPatch.area = v;
        }
      }

      // Send a natural message that includes ALL known context
      // so extractIntent can see the full picture
      const parts: string[] = [];
      if (intentPatch.query) parts.push(`find ${intentPatch.query}`);
      if (intentPatch.area) parts.push(`in ${intentPatch.area}`);
      if (intentPatch.count && intentPatch.countSpecified) parts.push(`(${intentPatch.count} locations)`);

      const naturalMessage = parts.length > 0
        ? parts.join(" ")
        : Object.entries(answers).map(([k, v]) => `${v}`).join(", ");

      void sendMessage(naturalMessage, intentPatch);
    },
    [sendMessage, intent], // ← add intent to deps
  );
  // ── Handle results confirmation ───────────────────────────────────────────

  const handleConfirmWithOptions = useCallback(
    async (options: PinOptions) => {
      setIsDropping(true);
      setIsLoading(true);
      console.log("Confirming with options:", options);
      const pinsToUse = currentPins;

      try {
        // Step 1: enqueue confirm job
        const { jobId } = await chatCreate.mutateAsync({
          messages: buildHistory("Yes, confirm and drop the pins."),
          intent: { ...intent, confirmed: true },
          pinOptions: options,
          pins: currentPins,  // ← add this line
        });

        // Step 2: poll until the agent finishes (it will enqueue the QStash pin-drop job)
        const result = await pollJob(jobId);

        const locationGroupJobId = result.jobId;

        // Step 3: mark the results message as confirmed + attach pin-drop jobId
        setMessages((prev) => {
          const copy = [...prev];
          for (let i = copy.length - 1; i >= 0; i--) {
            const m = copy[i]!;
            if (
              m.content.kind === "response" &&
              m.content.data.type === "results"
            ) {
              copy[i] = {
                ...m,
                content: {
                  ...m.content,
                  resultsConfirmed: true,
                  resultsJobId: locationGroupJobId,
                },
              };
              break;
            }
          }
          return copy;
        });

        // If no background job was returned, show immediate success
        if (!locationGroupJobId) {
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: "assistant",
              content: {
                kind: "response",
                data: {
                  type: "success",
                  message: `Successfully dropped ${pinsToUse.length} pins!`,
                  count: pinsToUse.length,
                } satisfies SuccessResponse,
                pins: [],
              },
              createdAt: new Date(),
            },
          ]);
        }

        setStage("dropping_pins");
        setIntent((p) => ({ ...p, confirmed: true }));
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: {
              kind: "response",
              data: {
                type: "info",
                message: "Failed to drop pins. Please try again.",
              },
              pins: [],
            },
            createdAt: new Date(),
          },
        ]);
      } finally {
        setIsDropping(false);
        setIsLoading(false);
      }
    },
    [intent, currentPins, buildHistory, chatCreate, pollJob]
  );

  // ── Called when background pin-drop job finishes ──────────────────────────

  const handleJobComplete = useCallback((count: number) => {
    setStage("done");
    setCurrentPins([]);
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: "assistant",
        content: {
          kind: "response",
          data: {
            type: "success",
            message: `Successfully dropped ${count} pin${count !== 1 ? "s" : ""}!`,
            count,
          } satisfies SuccessResponse,
          pins: [],
        },
        createdAt: new Date(),
      },
    ]);
  }, []);

  // ── Legacy confirm-stage pin drop ─────────────────────────────────────────

  const handleConfirmPins = useCallback(
    async (pins: Pin[]) => {
      setIsDropping(true);
      setIsLoading(true);
      const pinsToUse = pins.length > 0 ? pins : currentPins;
      try {
        const { jobId } = await chatCreate.mutateAsync({
          messages: buildHistory("Yes, confirm and drop the pins."),
          intent: { ...intent, confirmed: true },
        });

        await pollJob(jobId);

        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: {
              kind: "response",
              data: {
                type: "success",
                message: `Successfully dropped ${pinsToUse.length} pins!`,
                count: pinsToUse.length,
              } satisfies SuccessResponse,
              pins: [],
            },
            createdAt: new Date(),
          },
        ]);
        setStage("done");
        setIntent((p) => ({ ...p, confirmed: true }));
        setCurrentPins([]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: {
              kind: "response",
              data: {
                type: "info",
                message: "Failed to drop pins. Please try again.",
              },
              pins: [],
            },
            createdAt: new Date(),
          },
        ]);
      } finally {
        setIsDropping(false);
        setIsLoading(false);
      }
    },
    [intent, currentPins, buildHistory, chatCreate, pollJob]
  );

  // ── Dismiss ─────────────────────────────────────────��─────────────────────

  const handleDismiss = useCallback(() => {
    void sendMessage("Cancel that, let me start over.");
  }, [sendMessage]);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setMessages([]);
    setIntent({
      count: null,
      query: null,
      area: null,
      areaType: "unknown",
      confirmed: false,
      countSpecified: false,
      isNiche: false,
      pinNumber: undefined,
    });
    setStage("idle");
    setInput("");
    setCurrentPins([]);
    inputRef.current?.focus();
  };

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  const isEmpty = messages.length === 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {isMinimized && (
        <button
          onClick={() => {
            setIsMinimized(false);
            setIsOpen(true);
          }}
          className="fixed bottom-12 left-1/2 z-40 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
        >
          Wadzzo Assistant
        </button>
      )}

      {!isMinimized && (
        <div className="fixed bottom-6 left-1/2 z-40 w-full max-w-2xl -translate-x-1/2 px-4">
          <style>{`
            @keyframes neon-glow {
              0%, 100% { box-shadow: 0 0 5px rgba(34,197,94,.3), 0 0 10px rgba(34,197,94,.2); }
              50%       { box-shadow: 0 0 15px rgba(34,197,94,.6), 0 0 25px rgba(34,197,94,.4); }
            }
            .neon-bar {
              animation: neon-glow 3s ease-in-out infinite;
              border: 2px solid rgba(34,197,94,.5);
            }
          `}</style>

          <div className="neon-bar flex items-center gap-2 rounded-full bg-white p-1 shadow-lg backdrop-blur-sm">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
<<<<<<< HEAD
              disabled={isWaiting}
              className="flex-1 rounded-full bg-white px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={() => void send(input)}
              disabled={!input.trim() || isWaiting}
              className="flex flex-shrink-0 items-center justify-center rounded-full bg-primary px-4 py-3 text-primary-foreground transition-all hover:scale-105 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {isWaiting ? (
=======
              disabled={isLoading || isDropping}
              className="flex-1 rounded-full bg-white px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={() => void sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="flex flex-shrink-0 items-center justify-center rounded-full bg-primary px-4 py-3 text-primary-foreground transition-all hover:scale-105 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? (
>>>>>>> 5657b4d4 (refactor: update agent types and pin creation logic)
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => setIsOpen((p) => !p)}
              className="flex flex-shrink-0 items-center justify-center rounded-full bg-primary/80 px-4 py-3 text-primary-foreground transition-all hover:scale-105 active:scale-95"
            >
              <ChevronDown
                className={`h-5 w-5 transition-transform duration-300 ${isOpen ? "" : "rotate-180"
                  }`}
              />
            </button>
          </div>
        </div>
      )}

      {!isMinimized && isOpen && (
        <div className="fixed inset-x-0 bottom-24 z-40 mx-auto max-w-2xl rounded-2xl border border-border bg-background shadow-2xl animate-in slide-in-from-bottom-5 duration-300 flex flex-col"
          style={{
            height: 'calc(100vh - 15vh)',
            maxHeight: '85vh',
          }}
        >
          {/* Header - Fixed */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-primary text-primary-foreground rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-foreground flex items-center justify-center shadow-lg flex-shrink-0">
                <Image
                  src="/favicon.ico"
                  alt="Wadzzo Icon"
                  width={16}
                  height={16}
                  className="w-6 h-6"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xs font-bold tracking-tight">Wadzzo Agent</h1>
                <p className="text-[11px] text-white/70">
                  {stage !== "idle" && stage !== "error"
                    ? STAGE_LABEL[stage]
                    : "AI Assistant"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                title="Clear chat"
                className="rounded-full p-2 transition-colors hover:bg-white/20"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setIsMinimized(true);
                  setIsOpen(false);
                }}
                title="Minimize"
                className="rounded-full p-2 transition-colors hover:bg-white/20"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="rounded-full p-2 transition-colors hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

<<<<<<< HEAD
          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((msg, i) => (
              <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                {msg.role === "user" ? (
                  /* User bubble */
                  <div className="flex justify-end">
                    <div className="max-w-[78%] rounded-3xl rounded-tr-lg bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  /* Assistant bubble */
                  <div className="flex justify-start">
                    <div className="max-w-[88%] rounded-3xl rounded-tl-lg bg-muted px-4 py-3 shadow-sm">
                      {msg.content && msg.uiData?.type !== "redeem_mode_select" && (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                          {msg.content}
                        </p>
                      )}
                      {msg.uiData && renderUiData(msg.uiData, i)}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isWaiting && (
              <div className="flex justify-start animate-in fade-in">
                <div className="rounded-3xl rounded-tl-lg bg-muted px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">Thinking…</span>
                  </div>
=======
          {/* Messages - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="text-center space-y-2">
                  <div className="text-5xl">🗺️</div>
                  <h2 className="text-sm font-bold text-foreground">Drop pins</h2>
                  <p className="text-muted-foreground text-xs leading-relaxed max-w-xs">
                    Tell me what to pin and where
                  </p>
                </div>
                <div className="w-full max-w-sm space-y-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => void sendMessage(s)}
                      className="w-full px-3 py-2.5 rounded-lg text-xs text-left text-foreground bg-muted border border-border hover:border-primary/40 hover:bg-muted/80 transition-all duration-150"
                    >
                      {s}
                    </button>
                  ))}
>>>>>>> 5657b4d4 (refactor: update agent types and pin creation logic)
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  intent={intent}
                  onAnswer={handleAnswer}
                  onConfirmWithOptions={handleConfirmWithOptions}
                  onConfirmPins={handleConfirmPins}
                  onDismiss={handleDismiss}
                  isDropping={isDropping}
                  isLoading={isLoading}
                  onJobComplete={handleJobComplete}
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      )}
    </>
  );
}
