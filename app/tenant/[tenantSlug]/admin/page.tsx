import TenantAdminDashboardClient from "./TenantAdminDashboardClient";

export default async function TenantAdminPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  return <TenantAdminDashboardClient tenantSlug={tenantSlug} />;
}
