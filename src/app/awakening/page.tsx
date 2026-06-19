import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";

export default function AwakeningPage(): never {
  redirect(ROUTES.awakeningMap);
}
