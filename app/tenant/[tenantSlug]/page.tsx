import PDATerminal from "@/components/PDATerminal";

export default async function TenantPDAPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4">
      <PDATerminal tenantSlug={tenantSlug} />
    </main>
  );
}
