"use client";

import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";
import { createNimbusApi } from "./api";

export function useNimbusApi() {
  const { getToken } = useAuth();
  return useMemo(() => createNimbusApi(getToken), [getToken]);
}
