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

export const useAlertList = (status?: "firing" | "resolved", deps?: DependencyList) => {
  const IncidentApi = useApi(IncidentApiRef);

  const { value, loading, error } = useAsync(async () => {
    const query = new URLSearchParams({ page_size: "25" });
    if (status) query.set("status[one_of]", status);
    return await IncidentApi.request<
      definitions["AlertsV2ListResponseBody"]
    >({
      path: `/v2/alerts?${query.toString()}`,
    });
  }, [status, ...(deps ?? [])]);

  return { loading, error, value };
};

export const useAlertSourceList = () => {
  const IncidentApi = useApi(IncidentApiRef);

  const { value, loading, error } = useAsync(async () => {
    return await IncidentApi.request<
      definitions["AlertSourcesV2ListResponseBody"]
    >({
      path: `/v2/alert_sources`,
    });
  });

  return { loading, error, value };
};

export const useIncidentAlertList = (incidentIds: string[], deps?: DependencyList) => {
  const IncidentApi = useApi(IncidentApiRef);

  const { value, loading, error } = useAsync(async () => {
    if (incidentIds.length === 0) {
      return { incident_alerts: [], pagination_meta: { page_size: 25 } };
    }
    const results = await Promise.all(
      incidentIds.map(id =>
        IncidentApi.request<definitions["IncidentAlertsV2ListResponseBody"]>({
          path: `/v2/incident_alerts?incident_id=${id}&page_size=25`,
        }),
      ),
    );
    return {
      incident_alerts: results.flatMap(r => r.incident_alerts),
      pagination_meta: { page_size: 25 },
    };
  }, [incidentIds.join(","), ...(deps ?? [])]);

  return { loading, error, value };
};

export const useAlertAttributeList = () => {
  const IncidentApi = useApi(IncidentApiRef);

  const { value, loading, error } = useAsync(async () => {
    return await IncidentApi.request<
      definitions["AlertAttributesV2ListResponseBody"]
    >({
      path: `/v2/alert_attributes`,
    });
  });

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
