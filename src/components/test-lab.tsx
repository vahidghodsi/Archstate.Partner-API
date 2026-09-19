"use client";

import { useState } from "react";
import { Check, CircleDashed, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PARTNER_API_KEY, PROFILE_PATH, projectPath } from "@/lib/config";
import {
  errorCode,
  getProfile,
  getProject,
  isNetworkFailure,
  partnerRequest,
} from "@/lib/partner-client";
import { cn } from "@/lib/utils";
import type { RequestRecord } from "@/lib/types";
import { RequestInspector } from "@/components/json-block";

type CaseStatus = "idle" | "running" | "pass" | "fail";

type CaseResult = {
  status: CaseStatus;
  detail: string;
  records: RequestRecord[];
};

type TestCase = {
  id: string;
  title: string;
  expect: string;
  run: (ctx: { projectId: string | null }) => Promise<CaseResult>;
};

function pass(detail: string, records: RequestRecord[]): CaseResult {
  return { status: "pass", detail, records };
}

function fail(detail: string, records: RequestRecord[]): CaseResult {
  return { status: "fail", detail, records };
}

async function expectCode(
  record: RequestRecord,
  status: number,
  code: string,
): Promise<CaseResult> {
  if (isNetworkFailure(record)) {
    return fail(
      `No response from API (${record.error}). Start the partner server on :8080.`,
      [record],
    );
  }
  const actual = errorCode(record);
  if (record.status === status && actual === code) {
    return pass(`HTTP ${status} ${code}`, [record]);
  }
  return fail(
    `Expected HTTP ${status} ${code}, got HTTP ${record.status ?? "—"} ${actual ?? "no code"}`,
    [record],
  );
}

const CASES: TestCase[] = [
  {
    id: "sanity",
    title: "Sanity: profile → project → groups array",
    expect: "200 on both GETs; data.groups is an array (possibly empty).",
    async run() {
      const profile = await getProfile();
      if (!profile.data) {
        return fail("Profile GET did not return { data }.", [profile.record]);
      }
      const first = profile.data.projects[0];
      if (!first) {
        return fail(
          "Profile loaded but data.projects is empty — cannot continue the project GET.",
          [profile.record],
        );
      }
      const project = await getProject(first.id);
      if (!project.data) {
        return fail(`Project GET for ${first.id} did not return { data }.`, [
          profile.record,
          project.record,
        ]);
      }
      if (!Array.isArray(project.data.groups)) {
        return fail("data.groups is missing or not an array.", [
          profile.record,
          project.record,
        ]);
      }
      return pass(
        `Profile ${profile.data.username} → project ${first.id}; groups.length = ${project.data.groups.length}`,
        [profile.record, project.record],
      );
    },
  },
  {
    id: "missing-key",
    title: "401 when Authorization is omitted",
    expect: "INVALID_PARTNER_API_KEY",
    async run() {
      const { record } = await getProfile({ key: null });
      return expectCode(record, 401, "INVALID_PARTNER_API_KEY");
    },
  },
  {
    id: "wrong-key",
    title: "401 when the bearer key is wrong",
    expect: "INVALID_PARTNER_API_KEY",
    async run() {
      const { record } = await getProfile({
        key: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      });
      return expectCode(record, 401, "INVALID_PARTNER_API_KEY");
    },
  },
  {
    id: "unknown-project",
    title: "404 for an unknown project id",
    expect: "PROJECT_NOT_FOUND",
    async run() {
      const { record } = await getProject("not-a-real-project-id");
      return expectCode(record, 404, "PROJECT_NOT_FOUND");
    },
  },
  {
    id: "envelope",
    title: "Success envelope is { data } only",
    expect: "HTTP 200 body keys are exactly [data].",
    async run() {
      const { record, data } = await getProfile();
      if (!data) {
        return fail("Profile GET failed.", [record]);
      }
      const keys =
        record.body && typeof record.body === "object"
          ? Object.keys(record.body as object)
          : [];
      if (keys.length === 1 && keys[0] === "data") {
        return pass("Body keys: data", [record]);
      }
      return fail(`Body keys were [${keys.join(", ")}]`, [record]);
    },
  },
  {
    id: "options",
    title: "OPTIONS preflight without a key",
    expect: "CORS preflight succeeds (2xx). Browser also does this on GETs.",
    async run() {
      const record = await partnerRequest(PROFILE_PATH, {
        method: "OPTIONS",
        key: null,
      });
      if (isNetworkFailure(record)) {
        return fail(
          `No response from API (${record.error}).`,
          [record],
        );
      }
      if (record.status && record.status >= 200 && record.status < 400) {
        return pass(`HTTP ${record.status} on OPTIONS ${PROFILE_PATH}`, [record]);
      }
      return fail(`Unexpected OPTIONS status ${record.status ?? "—"}`, [record]);
    },
  },
  {
    id: "key-present",
    title: "Configured key is sent as Bearer, not a JWT",
    expect: "Authorization value is the 64-char profile key.",
    async run() {
      const { record, data } = await getProfile();
      const header = record.requestHeaders.Authorization ?? "";
      const expected = `Bearer ${PARTNER_API_KEY}`;
      if (header !== expected) {
        return fail("Authorization header did not match the configured key.", [
          record,
        ]);
      }
      if (PARTNER_API_KEY.includes(".")) {
        return fail("Key looks like a JWT. Partner keys are opaque hex.", [record]);
      }
      if (!data && record.status === 401) {
        return fail("Key was formatted correctly but the API rejected it.", [
          record,
        ]);
      }
      if (!data) {
        return fail("Profile GET failed after sending the configured key.", [
          record,
        ]);
      }
      return pass("Bearer key accepted; profile selected by key only.", [record]);
    },
  },
];

function StatusIcon({ status }: { status: CaseStatus }) {
  if (status === "running") {
    return <LoaderCircle className="size-4 animate-spin text-amber-300" />;
  }
  if (status === "pass") {
    return <Check className="size-4 text-emerald-400" />;
  }
  if (status === "fail") {
    return <X className="size-4 text-red-400" />;
  }
  return <CircleDashed className="size-4 text-zinc-600" />;
}

export function TestLab({
  projectId,
  onRecords,
}: {
  projectId: string | null;
  onRecords: (records: RequestRecord[]) => void;
}) {
  const [results, setResults] = useState<Record<string, CaseResult>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function runOne(testCase: TestCase) {
    setResults((current) => ({
      ...current,
      [testCase.id]: { status: "running", detail: "Calling API…", records: [] },
    }));
    const result = await testCase.run({ projectId });
    setResults((current) => ({ ...current, [testCase.id]: result }));
    onRecords(result.records);
    setOpenId(testCase.id);
    return result;
  }

  async function runAll() {
    setRunning(true);
    for (const testCase of CASES) {
      await runOne(testCase);
    }
    setRunning(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-100">Extra cases</h3>
          <p className="mt-1 max-w-xl text-xs leading-5 text-zinc-500">
            Each case is a real browser GET or OPTIONS to localhost:8080. Origin
            is sent automatically as this page&apos;s origin. Do not call
            /api/public/* or member /api/project*.
          </p>
        </div>
        <Button type="button" onClick={() => void runAll()} disabled={running}>
          {running ? "Running…" : "Run all"}
        </Button>
      </div>
      <ul className="divide-y divide-white/10 overflow-hidden rounded-xl ring-1 ring-white/10">
        {CASES.map((testCase) => {
          const result = results[testCase.id];
          const status = result?.status ?? "idle";
          const open = openId === testCase.id;
          return (
            <li key={testCase.id} className="bg-white/[0.03]">
              <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <StatusIcon status={status} />
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-100">{testCase.title}</p>
                    <p className="text-xs text-zinc-500">{testCase.expect}</p>
                    {result ? (
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          status === "fail"
                            ? "text-red-300"
                            : status === "pass"
                              ? "text-emerald-300"
                              : "text-zinc-400",
                        )}
                      >
                        {result.detail}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-2 sm:shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void runOne(testCase)}
                    disabled={running || status === "running"}
                  >
                    Run
                  </Button>
                  {result?.records.length ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setOpenId(open ? null : testCase.id)}
                    >
                      {open ? "Hide" : "Inspect"}
                    </Button>
                  ) : null}
                </div>
              </div>
              {open && result?.records.length ? (
                <div className="space-y-4 border-t border-white/10 px-3 py-3">
                  {result.records.map((record) => (
                    <RequestInspector key={record.id} record={record} />
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {projectId ? (
        <p className="font-mono text-[11px] text-zinc-600">
          Selected project for UI: {projectPath(projectId)}
        </p>
      ) : null}
    </div>
  );
}
