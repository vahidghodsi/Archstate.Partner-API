"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  FlaskConical,
  RefreshCw,
  ShieldOff,
  WifiOff,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JsonBlock, RequestInspector } from "@/components/json-block";
import { ProfilePanel, ProfileSkeleton } from "@/components/profile-panel";
import { ProjectPanel, ProjectSkeleton } from "@/components/project-panel";
import { TestLab } from "@/components/test-lab";
import {
  CONSUMER_ORIGIN,
  PARTNER_API_BASE,
  PARTNER_API_KEY,
} from "@/lib/config";
import {
  errorCode,
  getProfile,
  getProject,
  isNetworkFailure,
} from "@/lib/partner-client";
import { SAMPLE_PROFILE, SAMPLE_PROJECT } from "@/lib/sample-data";
import type {
  PartnerProfile,
  PartnerProject,
  PartnerProjectSummary,
  RequestRecord,
} from "@/lib/types";

const maskedKey = `${PARTNER_API_KEY.slice(0, 8)}…${PARTNER_API_KEY.slice(-6)}`;

function subscribeToNothing() {
  return () => {};
}

function browserOrigin() {
  return window.location.origin;
}

export function PartnerApp() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [project, setProject] = useState<PartnerProject | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [records, setRecords] = useState<RequestRecord[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [projectLoading, setProjectLoading] = useState(false);
  const [usingSample, setUsingSample] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const origin = useSyncExternalStore(
    subscribeToNothing,
    browserOrigin,
    () => CONSUMER_ORIGIN,
  );

  const pushRecords = useCallback((next: RequestRecord[]) => {
    setRecords((current) => [...next, ...current].slice(0, 40));
  }, []);

  const loadProject = useCallback(
    async (projectId: string) => {
      setSelectedId(projectId);
      setProjectLoading(true);
      setProjectError(null);
      setUsingSample(false);
      const { record, data } = await getProject(projectId);
      pushRecords([record]);
      if (data) {
        setProject(data);
      } else {
        setProject(null);
        const code = errorCode(record);
        setProjectError(
          isNetworkFailure(record)
            ? record.error ?? "Network error"
            : `${record.status ?? "error"} ${code ?? ""} — ${
                (record.body as { message?: string } | undefined)?.message ??
                "Project request failed"
              }`.trim(),
        );
      }
      setProjectLoading(false);
    },
    [pushRecords],
  );

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);
    setUsingSample(false);
    setProject(null);
    setSelectedId(null);
    setProjectError(null);

    const { record, data } = await getProfile();
    pushRecords([record]);

    if (data) {
      setProfile(data);
      setProfileLoading(false);
      const first = data.projects[0];
      if (first) {
        await loadProject(first.id);
      }
      return;
    }

    if (isNetworkFailure(record)) {
      setProfileError(
        `Cannot reach ${PARTNER_API_BASE}. Run the partner API on port 8080 and keep this app on port 3000.`,
      );
    } else {
      const code = errorCode(record);
      setProfileError(
        `${record.status ?? "error"} ${code ?? ""} — ${
          (record.body as { message?: string } | undefined)?.message ??
          record.error ??
          "Profile request failed"
        }`.trim(),
      );
    }
    setProfile(null);
    setProfileLoading(false);
  }, [loadProject, pushRecords]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const { record, data } = await getProfile();
      if (cancelled) return;
      pushRecords([record]);

      if (data) {
        setProfile(data);
        setProfileLoading(false);
        const first = data.projects[0];
        if (first) {
          await loadProject(first.id);
        }
        return;
      }

      if (isNetworkFailure(record)) {
        setProfileError(
          `Cannot reach ${PARTNER_API_BASE}. Run the partner API on port 8080 and keep this app on port 3000.`,
        );
      } else {
        const code = errorCode(record);
        setProfileError(
          `${record.status ?? "error"} ${code ?? ""} — ${
            (record.body as { message?: string } | undefined)?.message ??
            record.error ??
            "Profile request failed"
          }`.trim(),
        );
      }
      setProfile(null);
      setProfileLoading(false);
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [loadProject, pushRecords]);

  function useSample() {
    setUsingSample(true);
    setProfileError(null);
    setProjectError(null);
    setProfile(SAMPLE_PROFILE);
    setProject(SAMPLE_PROJECT);
    setSelectedId(SAMPLE_PROJECT.id);
  }

  function onSelectProject(summary: PartnerProjectSummary) {
    if (usingSample) {
      setSelectedId(summary.id);
      setProject(SAMPLE_PROJECT);
      return;
    }
    void loadProject(summary.id);
  }

  const originWarning = origin !== CONSUMER_ORIGIN;

  const latest = records[0];

  const curlProfile = useMemo(
    () =>
      `curl -sS -H "Authorization: Bearer ${PARTNER_API_KEY}" -H "Origin: ${CONSUMER_ORIGIN}" ${PARTNER_API_BASE}/api/partner/v1/profile`,
    [],
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-medium tracking-[0.2em] text-amber-400/80 uppercase">
              Partner consumer
            </p>
            <h1 className="font-heading text-xl tracking-tight sm:text-2xl">
              Public profile API
            </h1>
            <p className="mt-1 max-w-xl text-xs leading-5 text-zinc-500">
              Browser GETs only. Key selects the profile. No Firebase Auth, no
              App Check, no /api/public/*.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {PARTNER_API_BASE}
            </Badge>
            <Badge variant="secondary" className="font-mono">
              Bearer {maskedKey}
            </Badge>
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadProfile()}
              disabled={profileLoading}
            >
              <RefreshCw data-icon="inline-start" />
              Reload profile
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {originWarning ? (
          <Alert>
            <ShieldOff />
            <AlertTitle>Origin is {origin}</AlertTitle>
            <AlertDescription>
              The partner CORS allowlist is hostname <code>localhost</code>.
              This preview host may return 403 PARTNER_ORIGIN_NOT_ALLOWED.
              Run <code>npm run dev</code> locally so the browser sends{" "}
              <code>{CONSUMER_ORIGIN}</code>.
            </AlertDescription>
          </Alert>
        ) : null}

        {profileError ? (
          <Alert variant="destructive">
            <WifiOff />
            <AlertTitle>Profile GET failed</AlertTitle>
            <AlertDescription>
              <p>{profileError}</p>
              <p className="mt-2 text-zinc-400">
                Expected local pairing: this UI on {CONSUMER_ORIGIN}, API on{" "}
                {PARTNER_API_BASE}.
              </p>
            </AlertDescription>
          </Alert>
        ) : null}

        {profileError && !usingSample ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={useSample}>
              Preview UI with sample payload
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadProfile()}
            >
              Retry live API
            </Button>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <section className="rounded-2xl bg-zinc-900/70 p-5 ring-1 ring-white/10">
            {profileLoading ? (
              <ProfileSkeleton />
            ) : profile ? (
              <ProfilePanel
                profile={profile}
                selectedProjectId={selectedId}
                onSelectProject={onSelectProject}
                sample={usingSample}
              />
            ) : (
              <div className="py-12 text-center text-sm text-zinc-500">
                No profile loaded yet.
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-zinc-900/70 p-5 ring-1 ring-white/10">
            {projectLoading ? (
              <ProjectSkeleton />
            ) : projectError && !project ? (
              <div className="py-8">
                <p className="text-sm text-red-300">{projectError}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  404 PROJECT_NOT_FOUND means the id is unknown, not on this
                  profile, not public, or deleted.
                </p>
              </div>
            ) : project ? (
              <ProjectPanel project={project} sample={usingSample} />
            ) : (
              <div className="py-12 text-center text-sm text-zinc-500">
                Select a project id from the profile response. There is no
                projects list endpoint.
              </div>
            )}
          </section>
        </div>

        <section className="rounded-2xl bg-zinc-900/70 p-5 ring-1 ring-white/10">
          <Tabs defaultValue="tests">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <TabsList>
                <TabsTrigger value="tests">
                  <FlaskConical data-icon="inline-start" />
                  Tests
                </TabsTrigger>
                <TabsTrigger value="log">Request log</TabsTrigger>
                <TabsTrigger value="json">Raw JSON</TabsTrigger>
                <TabsTrigger value="call">How to call</TabsTrigger>
              </TabsList>
              {usingSample ? (
                <Badge variant="outline">UI is showing sample data</Badge>
              ) : null}
            </div>
            <TabsContent value="tests">
              <TestLab projectId={selectedId} onRecords={pushRecords} />
            </TabsContent>
            <TabsContent value="log">
              {records.length === 0 ? (
                <p className="text-sm text-zinc-500">No requests yet.</p>
              ) : (
                <div className="space-y-6">
                  {records.map((record) => (
                    <RequestInspector key={record.id} record={record} />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="json">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
                    GET /api/partner/v1/profile
                  </p>
                  <JsonBlock value={profile ? { data: profile } : latest?.body} />
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
                    GET /api/partner/v1/project/{"{id}"}
                  </p>
                  <JsonBlock value={project ? { data: project } : null} />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="call">
              <div className="space-y-4 text-sm leading-6 text-zinc-400">
                <p>
                  Every GET sends <code className="text-zinc-200">Authorization: Bearer &lt;key&gt;</code>.
                  OPTIONS has no key. Allowed extra header: Content-Type.
                  Methods: GET, OPTIONS.
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    Profile: <code className="text-zinc-200">GET /api/partner/v1/profile</code> — no query, no profile id.
                  </li>
                  <li>
                    Project: <code className="text-zinc-200">GET /api/partner/v1/project/{"{projectId}"}</code> — id from{" "}
                    <code>data.projects[].id</code>.
                  </li>
                  <li>Success: HTTP 200 <code>{`{ "data": { ... } }`}</code></li>
                  <li>
                    Errors: <code>{`{ "code", "message", "status" }`}</code> — 401
                    INVALID_PARTNER_API_KEY, 403 PARTNER_ORIGIN_NOT_ALLOWED, 404
                    PROJECT_NOT_FOUND.
                  </li>
                </ul>
                <JsonBlock value={curlProfile} />
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
