export const PARTNER_API_BASE =
  process.env.NEXT_PUBLIC_PARTNER_API_BASE ?? "http://localhost:8080";

export const PARTNER_API_KEY = process.env.NEXT_PUBLIC_PARTNER_API_KEY ?? "";

export const CONSUMER_ORIGIN = "http://localhost:3000";

export const PROFILE_PATH = "/api/partner/v1/profile";
export const projectPath = (projectId: string) =>
  `/api/partner/v1/project/${encodeURIComponent(projectId)}`;
