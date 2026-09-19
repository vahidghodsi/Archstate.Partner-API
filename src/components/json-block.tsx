"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RequestRecord } from "@/lib/types";

export function JsonBlock({
  value,
  className,
}: {
  value: unknown;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const text =
    typeof value === "string" ? value : JSON.stringify(value, null, 2);

  async function copy() {
    await navigator.clipboard.writeText(text || "");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        size="xs"
        variant="outline"
        className="absolute top-2 right-2 z-10"
        onClick={() => void copy()}
      >
        {copied ? "Copied" : "Copy"}
      </Button>
      <pre className="max-h-[28rem] overflow-auto rounded-lg bg-black/40 p-3 pr-16 font-mono text-[11px] leading-5 text-zinc-200 ring-1 ring-white/10">
        {text || "—"}
      </pre>
    </div>
  );
}

export function RequestInspector({ record }: { record: RequestRecord }) {
  const statusLabel =
    record.status !== undefined
      ? `${record.status}${record.ok ? " OK" : ""}`
      : record.error
        ? "network error"
        : "pending";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[11px]">
          {record.method}
        </span>
        <span className="font-mono text-zinc-400 break-all">{record.url}</span>
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 font-medium",
            record.ok
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-red-500/15 text-red-300",
          )}
        >
          {statusLabel}
        </span>
        {record.ms !== undefined ? (
          <span className="text-zinc-500">{record.ms} ms</span>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-1 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
            Request headers
          </p>
          <JsonBlock
            value={
              Object.keys(record.requestHeaders).length
                ? record.requestHeaders
                : { note: "No Authorization (preflight / missing-key test)" }
            }
          />
        </div>
        <div>
          <p className="mb-1 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
            Response
          </p>
          <JsonBlock value={record.body ?? record.error ?? record.bodyText} />
        </div>
      </div>
    </div>
  );
}
