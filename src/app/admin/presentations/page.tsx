import type { Metadata } from "next";

import { adminSectionDetails } from "@/features/admin";
import { AdminSectionPage } from "../_components/admin-section-page";

export const metadata: Metadata = {
  title: "PDF-презентации | Админка",
};

export default function AdminPresentationsPage(): React.ReactElement {
  return <AdminSectionPage {...adminSectionDetails.presentations} />;
}
