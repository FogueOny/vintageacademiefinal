"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function RepondrePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/expression-ecrite-tcf/repondre/choisir-tache");
  }, [router]);
  return null;
}
