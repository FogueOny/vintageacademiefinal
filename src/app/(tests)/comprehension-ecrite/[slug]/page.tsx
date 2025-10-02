"use client";

import { use } from "react";
import { TestInterfaceUnified } from "@/components/tests/test-interface-unified";

interface TestPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function ComprehensionEcriteTestPage({ params, searchParams }: TestPageProps) {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  const testSeriesId = resolvedParams.slug;
  const attemptId = typeof resolvedSearchParams.attempt === 'string' ? resolvedSearchParams.attempt : undefined;

  return (
    <TestInterfaceUnified 
      testSeriesId={testSeriesId} 
      attemptId={attemptId} 
    />
  );
}
