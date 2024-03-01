import { useApi } from "@backstage/core-plugin-api";
import { useAsync } from "react-use";
import { IncidentApiRef } from "../api/client";
import { definitions } from "../api/types";
import { DependencyList } from "react";

export const useIncidentList = (
  query: URLSearchParams,
  deps?: DependencyList,
) => {
  const IncidentApi = useApi(IncidentApiRef);

  const { value, loading, error } = useAsync(async () => {
    return await IncidentApi.request<
      definitions["IncidentsV2ListResponseBody"]
    >({
      path: `/v2/incidents?${query.toString()}`,
    });
  }, deps);

  return { loading, error, value };
};

export const useIdentity = () => {
  const IncidentApi = useApi(IncidentApiRef);

  const { value, loading, error } = useAsync(async () => {
    return await IncidentApi.request<
      definitions["UtilitiesV1IdentityResponseBody"]
    >({
      path: `/v1/identity`,
    });
  });

  return { value, loading, error };
};
