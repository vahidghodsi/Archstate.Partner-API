import type { PartnerProfile, PartnerProject } from "@/lib/types";

/** Offline preview only. Never sent to the partner API. */
export const SAMPLE_PROFILE: PartnerProfile = {
  id: "sample-profile",
  username: "lena.okoye",
  first_name: "Lena",
  last_name: "Okoye",
  job_title: "Director of Photography",
  company: "Northline Pictures",
  description:
    "Sample payload used when localhost:8080 is unreachable. Live responses replace this the moment the partner API answers.",
  contacts: {
    emails: [{ email: "lena@northline.example", title: "Work" }],
    phones: [{ country_code: "+1", phone: "5550100", title: "Studio" }],
    social_media: [
      {
        platform: "instagram",
        username: "lena.okoye",
        url: "https://instagram.com/lena.okoye",
      },
    ],
    websites: [{ title: "Reel", url: "https://northline.example" }],
  },
  projects: [
    {
      id: "sample-project-harbor",
      title: "Harbor Light",
      headline: "A night-exterior short about a ferry dispatcher",
    },
  ],
};

export const SAMPLE_PROJECT: PartnerProject = {
  id: "sample-project-harbor",
  title: "Harbor Light",
  headline: "A night-exterior short about a ferry dispatcher",
  description:
    "Sample project body. groups is an array, matching the partner API sanity check.",
  status: "public",
  dates: [
    {
      id: "sample-date-1",
      title: "Principal photography",
      type: "production",
      date: "2025-11-04",
      is_primary: true,
    },
  ],
  contributors: [
    {
      id: "sample-contrib-1",
      first_name: "Lena",
      last_name: "Okoye",
      team_role: "DP",
      team_section: "Camera",
    },
  ],
  groups: [
    {
      title: "Stills",
      sections: [
        {
          id: "sample-section-1",
          title: "Night unit",
          template_type: "gallery",
          descriptions: [
            {
              text: "Assets keep the Storage download URLs from the API. This consumer does not proxy them.",
            },
          ],
          assets: [],
        },
      ],
    },
  ],
};
