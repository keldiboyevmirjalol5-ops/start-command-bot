import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard, type Dashboard } from "@/lib/api/student.functions";
import { useTelegram } from "./use-telegram";

export function useDashboardQuery() {
  const { initData } = useTelegram();
  const fn = useServerFn(getDashboard);
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fn({ data: { initData } }),
    enabled: !!initData,
    staleTime: 30_000,
    retry: 1,
  });
}

/** For pages under the tabs layout, which only renders once data is loaded. */
export function useDash(): Dashboard {
  const q = useDashboardQuery();
  if (q.data?.status !== "ok") throw new Error("Dashboard not loaded");
  return q.data;
}
