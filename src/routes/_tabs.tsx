import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useTelegram } from "@/hooks/use-telegram";
import { useDashboardQuery } from "@/hooks/use-dashboard";
import { BottomNav } from "@/components/app/BottomNav";
import { ErrorScreen, LoadingScreen, NotRegistered, OpenInTelegram } from "@/components/app/Screens";

export const Route = createFileRoute("/_tabs")({
  ssr: false,
  component: TabsLayout,
});

function TabsLayout() {
  const { ready, initData } = useTelegram();
  const q = useDashboardQuery();

  if (!ready) return <LoadingScreen />;
  if (!initData) return <OpenInTelegram />;
  if (q.isPending) return <LoadingScreen />;
  if (q.isError) return <ErrorScreen error={q.error} onRetry={() => q.refetch()} />;
  if (q.data.status === "unregistered") return <NotRegistered name={q.data.firstName} />;

  return (
    <div className="min-h-screen pb-28">
      <Outlet />
      <BottomNav />
    </div>
  );
}
