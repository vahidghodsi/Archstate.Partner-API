"use client";

import { ExternalLink, Images, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import type { PartnerAsset, PartnerProject } from "@/lib/types";

function AssetCard({ asset }: { asset: PartnerAsset }) {
  const src = asset.thumbnail_url || asset.url;
  const href = asset.url || asset.thumbnail_url;

  const body = (
    <>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={asset.alt || asset.title || "Asset"}
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center bg-zinc-900 text-xs text-zinc-600">
          No url
        </div>
      )}
      <span className="block p-2">
        <span className="block truncate text-xs font-medium text-zinc-200">
          {asset.title || asset.id}
        </span>
        {asset.description ? (
          <span className="mt-1 line-clamp-3 text-[11px] leading-4 text-zinc-400">
            {asset.description}
          </span>
        ) : null}
        <span className="mt-0.5 flex items-center gap-1 text-[10px] text-zinc-500">
          {asset.file_format ? <span>{asset.file_format}</span> : null}
          {href ? <ExternalLink className="size-3" /> : null}
        </span>
      </span>
    </>
  );

  if (!href) {
    return (
      <div className="overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10">
        {body}
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10 transition hover:ring-white/25"
    >
      {body}
    </a>
  );
}

export function ProjectPanel({
  project,
  sample,
}: {
  project: PartnerProject;
  sample?: boolean;
}) {
  const groups = project.groups ?? [];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {project.status ? (
            <Badge variant="secondary">{project.status}</Badge>
          ) : null}
          {sample ? <Badge variant="outline">Sample payload</Badge> : null}
        </div>
        <h2 className="font-heading mt-2 text-2xl tracking-tight text-zinc-50">
          {project.title}
        </h2>
        {project.headline ? (
          <p className="mt-1 text-sm text-zinc-400">{project.headline}</p>
        ) : null}
        <p className="mt-2 font-mono text-[11px] text-zinc-500">{project.id}</p>
      </div>

      {project.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.thumbnail_url}
          alt=""
          className="aspect-video w-full rounded-xl object-cover ring-1 ring-white/10"
        />
      ) : null}

      {project.description ? (
        <p className="text-sm leading-6 text-zinc-400">{project.description}</p>
      ) : null}

      {project.dates && project.dates.length > 0 ? (
        <div>
          <p className="mb-2 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
            Dates
          </p>
          <ul className="space-y-1.5">
            {project.dates.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-baseline gap-2 text-sm"
              >
                <span className="text-zinc-200">{item.title}</span>
                <span className="font-mono text-xs text-zinc-400">
                  {item.date}
                </span>
                <span className="text-xs text-zinc-500">{item.type}</span>
                {item.is_primary ? (
                  <Badge variant="outline">Primary</Badge>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
          <Users className="size-3" />
          Contributors
        </p>
        {project.contributors.length === 0 ? (
          <p className="text-sm text-zinc-500">No contributors on this payload.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {project.contributors.map((person) => (
              <li
                key={person.id}
                className="flex items-center gap-3 rounded-lg bg-white/5 p-2 ring-1 ring-white/10"
              >
                {person.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={person.photo_url}
                    alt=""
                    className="size-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="size-9 rounded-full bg-zinc-800" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-100">
                    {person.first_name} {person.last_name}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {[person.team_role, person.team_section]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Separator className="bg-white/10" />

      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
            <Images className="size-3" />
            Groups
          </p>
          <span className="font-mono text-[11px] text-zinc-500">
            Array length {groups.length}
          </span>
        </div>
        {groups.length === 0 ? (
          <p className="rounded-xl bg-white/5 px-4 py-8 text-center text-sm text-zinc-500 ring-1 ring-white/10">
            `data.groups` is an empty array. That still passes the sanity check.
          </p>
        ) : (
          <Accordion
            className="rounded-xl bg-white/5 px-3 ring-1 ring-white/10"
            type="multiple"
            defaultValue={groups.map((_, index) => String(index))}
          >
            {groups.map((group, index) => (
              <AccordionItem key={`${group.title}-${index}`} value={String(index)}>
                <AccordionTrigger>{group.title || `Group ${index + 1}`}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pb-3">
                    {group.sections.map((section) => (
                      <section key={section.id} className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-medium text-zinc-100">
                            {section.title}
                          </h4>
                          <Badge variant="outline">{section.template_type}</Badge>
                        </div>
                        {section.descriptions?.map((block, blockIndex) => (
                          <div key={`${section.id}-d-${blockIndex}`}>
                            {block.title ? (
                              <p className="text-xs font-medium text-zinc-400">
                                {block.title}
                              </p>
                            ) : null}
                            <p className="text-sm leading-6 text-zinc-400">
                              {block.text}
                            </p>
                          </div>
                        ))}
                        {section.assets.length === 0 ? (
                          <p className="text-xs text-zinc-500">No assets in this section.</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                            {section.assets.map((asset) => (
                              <AssetCard key={asset.id} asset={asset} />
                            ))}
                          </div>
                        )}
                      </section>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}

export function ProjectSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-56 animate-pulse rounded bg-white/10" />
      <div className="aspect-video animate-pulse rounded-xl bg-white/5" />
      <div className="h-20 animate-pulse rounded bg-white/5" />
    </div>
  );
}
