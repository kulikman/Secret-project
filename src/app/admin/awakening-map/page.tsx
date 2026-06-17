import type { Metadata } from "next";

import { adminSectionDetails } from "@/features/admin";
import { AdminSectionPage } from "../_components/admin-section-page";

export const metadata: Metadata = {
  title: "Карта пробуждения | Админка",
};

export default function AdminAwakeningMapPage(): React.ReactElement {
  return <AdminSectionPage {...adminSectionDetails.awakeningMap} />;
}
