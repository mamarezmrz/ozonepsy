import { AdminLoadingState } from "@/components/admin/admin-ui";

export default function TherapistPanelLoading() {
  return <div className="admin-page-stack" aria-busy="true"><AdminLoadingState label="در حال بارگذاری پنل متخصص…" /></div>;
}
