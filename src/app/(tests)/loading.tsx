"use client";

import React from "react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-sm" />

      {/* Glass card */}
      <div className="relative mx-4 rounded-2xl border border-white/30 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md shadow-2xl p-8 flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-orange-500/80 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-200">
          Chargement de votre entraînement…
        </p>
      </div>
    </div>
  );
}
