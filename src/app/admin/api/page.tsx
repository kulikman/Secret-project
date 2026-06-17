import type { Metadata } from "next";

import { adminSectionDetails } from "@/features/admin";
import { AdminSectionPage } from "../_components/admin-section-page";

export const metadata: Metadata = {
  title: "API | Админка",
};

export default function AdminApiPage(): React.ReactElement {
  return <AdminSectionPage {...adminSectionDetails.api} />;
}
