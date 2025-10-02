"use client";

import { useParams } from "next/navigation";
import { TestSeriesList } from "@/components/tests/test-series-list";

export default function ModuleTestPage() {
  const { moduleSlug } = useParams();

  // moduleSlug peut être string ou string[] ou undefined
  const slug = Array.isArray(moduleSlug)
    ? moduleSlug[0] ?? ""
    : moduleSlug ?? "";

  return (
    <TestSeriesList
      moduleSlug={slug}
      moduleTitle={`Tests pour le module : ${slug.replace(/-/g, " ")}`}
    />
  );
}