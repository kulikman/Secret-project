import type { Metadata } from "next";

import { adminSectionDetails } from "@/features/admin";
import { AdminSectionPage } from "../_components/admin-section-page";

export const metadata: Metadata = {
  title: "Знания | Админка",
};

export default function AdminKnowledgePage(): React.ReactElement {
  return <AdminSectionPage {...adminSectionDetails.knowledge} />;
}
