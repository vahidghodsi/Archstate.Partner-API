import {
  PARTNER_API_BASE,
  PARTNER_API_KEY,
  PROFILE_PATH,
  projectPath,
} from "@/lib/config";
import type {
  PartnerErrorBody,
  PartnerProfile,
  PartnerProject,
  RequestRecord,
  SuccessEnvelope,
} from "@/lib/types";

export class PartnerApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly body: unknown;

  constructor(message: string, status: number, code?: string, body?: unknown) {
    super(message);
    this.name = "PartnerApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

export type FetchOptions = {
  key?: string | null;
  method?: "GET" | "OPTIONS";
};

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function partnerRequest(
  path: string,
  options: FetchOptions = {},
): Promise<RequestRecord> {
  const method = options.method ?? "GET";
  const url = `${PARTNER_API_BASE}${path}`;
  const requestHeaders: Record<string, string> = {};

  if (options.key !== null && method === "GET") {
    requestHeaders.Authorization = `Bearer ${options.key ?? PARTNER_API_KEY}`;
  }

  const record: RequestRecord = {
    id: newId(),
    at: new Date().toISOString(),
    method,
    path,
    url,
    requestHeaders,
  };

  const started = performance.now();

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      cache: "no-store",
      mode: "cors",
    });

    record.ms = Math.round(performance.now() - started);
    record.status = response.status;
    record.ok = response.ok;

    const text = await response.text();
    record.bodyText = text;

    if (text) {
      try {
        record.body = JSON.parse(text) as unknown;
      } catch {
        record.body = text;
      }
    }
  } catch (error) {
    record.ms = Math.round(performance.now() - started);
    record.ok = false;
    record.error =
      error instanceof Error
        ? error.message
        : "Network request failed. Is the partner API running on localhost:8080?";
  }

  return record;
}

function assertSuccessData<T>(record: RequestRecord): T {
  if (record.error) {
    throw new PartnerApiError(record.error, 0);
  }

  if (!record.ok || record.status !== 200) {
    const body = record.body as PartnerErrorBody | undefined;
    throw new PartnerApiError(
      body?.message ?? `Request failed with HTTP ${record.status ?? "unknown"}`,
      record.status ?? 0,
      body?.code,
      record.body,
    );
  }

  const envelope = record.body as SuccessEnvelope<T> | undefined;
  if (!envelope || typeof envelope !== "object" || !("data" in envelope)) {
    throw new PartnerApiError(
      "Success response was missing the { data } envelope",
      record.status ?? 200,
    );
  }

  return envelope.data;
}

export async function getProfile(options: FetchOptions = {}): Promise<{
  record: RequestRecord;
  data?: PartnerProfile;
}> {
  const record = await partnerRequest(PROFILE_PATH, options);
  if (!record.ok) return { record };
  try {
    return { record, data: assertSuccessData<PartnerProfile>(record) };
  } catch {
    return { record };
  }
}

export async function getProject(
  projectId: string,
  options: FetchOptions = {},
): Promise<{
  record: RequestRecord;
  data?: PartnerProject;
}> {
  const record = await partnerRequest(projectPath(projectId), options);
  if (!record.ok) return { record };
  try {
    return { record, data: assertSuccessData<PartnerProject>(record) };
  } catch {
    return { record };
  }
}

export function isNetworkFailure(record: RequestRecord) {
  return Boolean(record.error) && record.status === undefined;
}

export function errorCode(record: RequestRecord) {
  if (!record.body || typeof record.body !== "object") return undefined;
  const body = record.body as { code?: unknown };
  return typeof body.code === "string" ? body.code : undefined;
}
