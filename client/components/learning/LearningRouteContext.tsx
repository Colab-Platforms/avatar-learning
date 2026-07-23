"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  createLearningRoutes,
  type LearningRouteScope,
  type LearningRoutes,
} from "@/lib/learningRoutes";

const LearningRouteContext = createContext<LearningRoutes | null>(null);

export function LearningRouteProvider({
  courseId,
  scope,
  children,
}: {
  courseId: string;
  scope: LearningRouteScope;
  children: ReactNode;
}) {
  const routes = useMemo(
    () => createLearningRoutes(courseId, scope),
    [courseId, scope],
  );

  return (
    <LearningRouteContext.Provider value={routes}>
      {children}
    </LearningRouteContext.Provider>
  );
}

export function useLearningRoutes(): LearningRoutes {
  const ctx = useContext(LearningRouteContext);
  if (!ctx) {
    throw new Error(
      "useLearningRoutes must be used within a LearningRouteProvider",
    );
  }
  return ctx;
}

/** Optional — returns null outside a provider (for shared leaf components). */
export function useLearningRoutesOptional(): LearningRoutes | null {
  return useContext(LearningRouteContext);
}
