"use client";

import {
  Globe,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { PartnerProfile, PartnerProjectSummary } from "@/lib/types";

function displayName(profile: PartnerProfile) {
  return `${profile.first_name} ${profile.last_name}`.trim() || profile.username;
}

export function ProfilePanel({
  profile,
  selectedProjectId,
  onSelectProject,
  sample,
}: {
  profile: PartnerProfile;
  selectedProjectId: string | null;
  onSelectProject: (project: PartnerProjectSummary) => void;
  sample?: boolean;
}) {
  const contacts = profile.contacts;
  const hasContacts =
    contacts &&
    (contacts.emails.length ||
      contacts.phones.length ||
      contacts.social_media.length ||
      contacts.websites.length);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        {profile.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photo_url}
            alt={displayName(profile)}
            className="size-20 shrink-0 rounded-2xl object-cover ring-1 ring-white/10"
          />
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <UserRound className="size-8 text-zinc-500" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-2xl tracking-tight text-zinc-50">
              {displayName(profile)}
            </h2>
            {sample ? (
              <Badge variant="outline">Sample payload</Badge>
            ) : null}
          </div>
          <p className="mt-0.5 font-mono text-xs text-zinc-500">
            @{profile.username}
          </p>
          {(profile.job_title || profile.company) && (
            <p className="mt-2 text-sm text-zinc-300">
              {[profile.job_title, profile.company].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      {profile.description ? (
        <p className="text-sm leading-6 text-zinc-400">{profile.description}</p>
      ) : null}

      {contacts && hasContacts ? (
        <div className="space-y-2">
          <p className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
            Public contacts
          </p>
          <ul className="space-y-1.5 text-sm">
            {contacts.emails.map((item) => (
              <li key={item.email} className="flex items-center gap-2 text-zinc-300">
                <Mail className="size-3.5 text-zinc-500" />
                <a className="hover:underline" href={`mailto:${item.email}`}>
                  {item.email}
                </a>
                {item.title ? (
                  <span className="text-xs text-zinc-500">{item.title}</span>
                ) : null}
              </li>
            ))}
            {contacts.phones.map((item) => (
              <li
                key={`${item.country_code}-${item.phone}`}
                className="flex items-center gap-2 text-zinc-300"
              >
                <Phone className="size-3.5 text-zinc-500" />
                <span>
                  {item.country_code} {item.phone}
                </span>
                {item.title ? (
                  <span className="text-xs text-zinc-500">{item.title}</span>
                ) : null}
              </li>
            ))}
            {contacts.social_media.map((item) => (
                <li key={`${item.platform}-${item.url}`} className="flex items-center gap-2">
                  <Globe className="size-3.5 text-zinc-500" />
                  <a
                    className="text-zinc-300 hover:underline"
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.username || item.platform}
                  </a>
                  <span className="text-xs text-zinc-500">{item.platform}</span>
                </li>
            ))}
            {contacts.websites.map((item) => (
              <li key={item.url} className="flex items-center gap-2">
                <Globe className="size-3.5 text-zinc-500" />
                <a
                  className="text-zinc-300 hover:underline"
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.title || item.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No public contacts on this profile.</p>
      )}

      <Separator className="bg-white/10" />

      <div>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
            Public projects
          </h3>
          <span className="font-mono text-[11px] text-zinc-500">
            {profile.projects.length}{" "}
            {profile.projects.length === 1 ? "id" : "ids"}
          </span>
        </div>
        {profile.projects.length === 0 ? (
          <p className="rounded-xl bg-white/5 px-4 py-8 text-center text-sm text-zinc-500 ring-1 ring-white/10">
            This profile has no public, non-deleted projects. There is no
            projects-list endpoint — the key on GET /profile is the selector.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {profile.projects.map((project) => {
              const selected = project.id === selectedProjectId;
              return (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => onSelectProject(project)}
                    className={cn(
                      "w-full overflow-hidden rounded-xl text-left ring-1 transition",
                      selected
                        ? "ring-amber-400/70 bg-amber-400/10"
                        : "ring-white/10 bg-white/5 hover:bg-white/8 hover:ring-white/20",
                    )}
                  >
                    {project.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.thumbnail_url}
                        alt=""
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center bg-zinc-900 text-xs text-zinc-600">
                        No thumbnail
                      </div>
                    )}
                    <span className="block p-3">
                      <span className="block font-medium text-zinc-100">
                        {project.title}
                      </span>
                      {project.headline ? (
                        <span className="mt-1 block text-xs leading-5 text-zinc-400">
                          {project.headline}
                        </span>
                      ) : null}
                      <span className="mt-2 block truncate font-mono text-[10px] text-zinc-500">
                        {project.id}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <Card className="border-0 bg-transparent ring-0">
      <CardContent className="space-y-4 px-0">
        <div className="flex gap-4">
          <div className="size-20 animate-pulse rounded-2xl bg-white/10" />
          <div className="flex-1 space-y-2 pt-2">
            <div className="h-6 w-48 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
          </div>
        </div>
        <div className="h-16 animate-pulse rounded bg-white/5" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="aspect-video animate-pulse rounded-xl bg-white/5" />
          <div className="aspect-video animate-pulse rounded-xl bg-white/5" />
        </div>
      </CardContent>
    </Card>
  );
}
