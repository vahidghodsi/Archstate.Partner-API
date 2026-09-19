export type PartnerEmail = {
  email: string;
  title?: string;
};

export type PartnerPhone = {
  country_code: string;
  phone: string;
  title?: string;
};

export type PartnerSocial = {
  platform: string;
  username?: string;
  url: string;
};

export type PartnerWebsite = {
  title?: string;
  url: string;
};

export type PartnerContacts = {
  emails: PartnerEmail[];
  phones: PartnerPhone[];
  social_media: PartnerSocial[];
  websites: PartnerWebsite[];
};

export type PartnerProjectSummary = {
  id: string;
  title: string;
  headline?: string;
  thumbnail_url?: string;
};

export type PartnerProfile = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  company?: string;
  description?: string;
  photo_url?: string;
  contacts?: PartnerContacts;
  projects: PartnerProjectSummary[];
};

export type PartnerDate = {
  id: string;
  title: string;
  type: string;
  date: string;
  is_primary?: boolean;
};

export type PartnerContributor = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  team_role?: string;
  team_section?: string;
};

export type PartnerDescription = {
  title?: string;
  text: string;
};

export type PartnerAsset = {
  id: string;
  title?: string;
  alt?: string;
  description?: string;
  url?: string;
  thumbnail_url?: string;
  file_format?: string;
};

export type PartnerSection = {
  id: string;
  title: string;
  template_type: string;
  descriptions?: PartnerDescription[];
  assets: PartnerAsset[];
};

export type PartnerGroup = {
  title: string;
  sections: PartnerSection[];
};

export type PartnerProject = {
  id: string;
  title: string;
  headline?: string;
  description?: string;
  thumbnail_url?: string;
  status?: string;
  dates?: PartnerDate[];
  contributors: PartnerContributor[];
  groups: PartnerGroup[];
};

export type SuccessEnvelope<T> = {
  data: T;
};

export type PartnerErrorBody = {
  code: string;
  message: string;
  status: number;
};

export type RequestRecord = {
  id: string;
  at: string;
  method: "GET" | "OPTIONS";
  path: string;
  url: string;
  requestHeaders: Record<string, string>;
  status?: number;
  ok?: boolean;
  ms?: number;
  bodyText?: string;
  body?: unknown;
  error?: string;
};
