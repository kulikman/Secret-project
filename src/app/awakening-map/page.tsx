import type { Metadata } from "next";

import AwakeningMapPage from "../awakening/map/page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Карта пробуждения",
  description:
    "Интерактивная карта связей Тайного Бюро на основе опубликованной projection-модели.",
};

export default AwakeningMapPage;
