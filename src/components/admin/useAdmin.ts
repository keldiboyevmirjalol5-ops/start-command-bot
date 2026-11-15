import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminAction, adminGetAll, type AdminAction, type AdminData } from "@/lib/api/admin.functions";
import { useTelegram } from "@/hooks/use-telegram";

export function useAdminQuery() {
  const { initData } = useTelegram();
  const fn = useServerFn(adminGetAll);
  return useQuery({ queryKey: ["admin"], queryFn: () => fn({ data: { initData } }), enabled: !!initData, retry: 1 });
}

export function useAdminData(): AdminData {
  const q = useAdminQuery();
  if (!q.data) throw new Error("Admin data not loaded");
  return q.data;
}

export function useAdminAction(successMsg = "Saqlandi") {
  const { initData } = useTelegram();
  const qc = useQueryClient();
  const fn = useServerFn(adminAction);
  return useMutation({
    mutationFn: (action: AdminAction) => fn({ data: { initData, action } }),
    onSuccess: (r) => {
      toast.success("sent" in r && typeof r.sent === "number" ? `Yuborildi: ${r.sent}/${r.total}` : successMsg);
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e) => toast.error(String((e as Error).message).slice(0, 160) || "Xatolik"),
  });
}

export function userName(u: { full_name: string | null; username: string | null; telegram_id: number }) {
  return u.full_name || (u.username ? `@${u.username}` : String(u.telegram_id));
}
