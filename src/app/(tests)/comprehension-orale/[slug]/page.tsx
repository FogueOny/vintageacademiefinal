"use client";

import { useParams, useSearchParams } from "next/navigation";
import { TestInterfaceUnified } from "@/components/tests/test-interface-unified";

export default function ComprehensionOraleTestPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const testSeriesId = params.slug as string;
  const attemptId = searchParams.get('attempt') || undefined;

  return (
    <TestInterfaceUnified 
      testSeriesId={testSeriesId} 
      attemptId={attemptId} 
    />
  );
}
