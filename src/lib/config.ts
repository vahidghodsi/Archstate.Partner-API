export const PARTNER_API_BASE =
  process.env.NEXT_PUBLIC_PARTNER_API_BASE ?? "http://localhost:8080";

export const PARTNER_API_KEY =
  process.env.NEXT_PUBLIC_PARTNER_API_KEY ??
  "556d5b14d66cfc8b52672ceea0c58e0965c1751bcc6739169638ea2e1e558f60";

export const CONSUMER_ORIGIN = "http://localhost:3000";

export const PROFILE_PATH = "/api/partner/v1/profile";
export const projectPath = (projectId: string) =>
  `/api/partner/v1/project/${encodeURIComponent(projectId)}`;
