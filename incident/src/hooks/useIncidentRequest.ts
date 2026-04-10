import { useApi } from "@backstage/core-plugin-api";
import { useAsync } from "react-use";
import { IncidentApiRef } from "../api/client";
import { components } from "../api/types";
import { DependencyList } from "react";

export const useIncidentList = (
  query: URLSearchParams,
  deps?: DependencyList,
) => {
  const IncidentApi = useApi(IncidentApiRef);

  const { value, loading, error } = useAsync(async () => {
    return await IncidentApi.request<
      components["schemas"]["IncidentsListResultV2"]
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
      components["schemas"]["AlertsListResultV2"]
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
      components["schemas"]["AlertSourcesListResultV2"]
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
        IncidentApi.request<components["schemas"]["AlertsListIncidentAlertsResultV2"]>({
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

export const useIdentity = () => {
  const IncidentApi = useApi(IncidentApiRef);

  const { value, loading, error } = useAsync(async () => {
    return await IncidentApi.request<
      components["schemas"]["UtilitiesIdentityResultV1"]
    >({
      path: `/v1/identity`,
    });
  });

  return { value, loading, error };
};

export type EscalationPathTarget = {
  type: 'schedule' | 'user' | 'slack_channel';
  id: string;
  urgency: string;
  schedule_mode?: string;
};

export type EscalationPathNode = {
  id: string;
  type: 'if_else' | 'level' | 'repeat' | 'notify_channel';
  if_else?: {
    conditions: Array<{
      subject: { label: string };
      operation: { label: string };
      param_bindings: Array<{ array_value?: Array<{ label: string }> }>;
    }>;
    then_path: EscalationPathNode[];
    else_path: EscalationPathNode[];
  };
  level?: {
    targets: EscalationPathTarget[];
    time_to_ack_seconds: number;
  };
  notify_channel?: {
    targets: EscalationPathTarget[];
    time_to_ack_seconds: number;
  };
  repeat?: {
    repeat_times: number;
  };
};

export type EscalationPathData = {
  id: string;
  name: string;
  path: EscalationPathNode[];
  current_responders: Array<{ id: string; name: string }>;
};

const collectSlackChannelIds = (nodes: EscalationPathNode[]): string[] => {
  const ids: string[] = [];
  for (const node of nodes) {
    const targets = node.level?.targets ?? node.notify_channel?.targets ?? [];
    for (const t of targets) {
      if (t.type === "slack_channel") ids.push(t.id);
    }
    if (node.if_else) {
      ids.push(...collectSlackChannelIds(node.if_else.then_path));
      ids.push(...collectSlackChannelIds(node.if_else.else_path));
    }
  }
  return [...new Set(ids)];
};

export const useEscalationPath = (escalationPathId: string | null, deps?: DependencyList) => {
  const IncidentApi = useApi(IncidentApiRef);

  return useAsync(async () => {
    if (!escalationPathId) return null;
    const response = await IncidentApi.request<{ escalation_path: EscalationPathData }>({
      path: `/v2/escalation_paths/${escalationPathId}`,
    });
    const ep = response.escalation_path;

    // Resolve slack channel IDs to names via the catalog
    const channelNames: Record<string, string> = {};
    const channelIds = collectSlackChannelIds(ep.path);
    if (channelIds.length > 0) {
      const typesResponse = await IncidentApi.request<{ catalog_types: Array<{ id: string; type_name: string }> }>({
        path: `/v3/catalog_types`,
      });
      const slackChannelType = typesResponse.catalog_types.find(t => t.type_name === "SlackChannel");
      if (slackChannelType) {
        const entriesResponse = await IncidentApi.request<{ catalog_entries: Array<{ name: string; aliases: string[] }> }>({
          path: `/v3/catalog_entries?catalog_type_id=${slackChannelType.id}&page_size=250`,
        });
        for (const entry of entriesResponse.catalog_entries) {
          for (const id of channelIds) {
            if (entry.aliases.includes(id)) {
              channelNames[id] = entry.name;
            }
          }
        }
      }
    }

    return { ep, channelNames };
  }, deps);
};

export type ScheduleShift = {
  rotation_id: string;
  user: { id: string; name: string };
  start_at: string;
  end_at: string;
};

export type ScheduleRotation = {
  id: string;
  name: string;
  users: Array<{ id: string; name: string }>;
  handovers: Array<{ interval_type: string; interval: number }>;
};

export type ScheduleData = {
  id: string;
  name: string;
  timezone: string;
  current_shifts: ScheduleShift[];
  config: { rotations: ScheduleRotation[] };
};

export const useSchedule = (scheduleId: string | null, deps?: DependencyList) => {
  const IncidentApi = useApi(IncidentApiRef);

  return useAsync(async () => {
    if (!scheduleId) return null;
    const response = await IncidentApi.request<{ schedule: ScheduleData }>({
      path: `/v2/schedules/${scheduleId}`,
    });
    return response.schedule;
  }, deps);
};

type CatalogAttributeValue = {
  label: string;
  literal: string;
};

type CatalogEntry = {
  external_id: string;
  attribute_values: Record<string, { value?: CatalogAttributeValue; array_value?: CatalogAttributeValue[] }>;
};

type CatalogType = {
  id: string;
  type_name: string;
  schema: {
    attributes: Array<{ id: string; name: string; type: string }>;
  };
};

export const useOnCallData = (entityExternalId: string, deps?: DependencyList) => {
  const IncidentApi = useApi(IncidentApiRef);

  return useAsync(async () => {
    const typesResponse = await IncidentApi.request<{ catalog_types: CatalogType[] }>({
      path: `/v3/catalog_types`,
    });

    const backstageType = typesResponse.catalog_types.find(
      t => t.type_name === 'Custom["BackstageComponent"]',
    );
    if (!backstageType) throw new Error('BackstageComponent catalog type not found in incident.io');

    const escalationAttr = backstageType.schema.attributes.find(a => a.type === 'EscalationPath');
    const scheduleAttr = backstageType.schema.attributes.find(a => a.type === 'Schedule');

    const entriesResponse = await IncidentApi.request<{ catalog_entries: CatalogEntry[] }>({
      path: `/v3/catalog_entries?catalog_type_id=${backstageType.id}&search=${encodeURIComponent(entityExternalId)}&page_size=25`,
    });

    const entry = entriesResponse.catalog_entries.find(e => e.external_id === entityExternalId);
    if (!entry) throw new Error(`No incident.io catalog entry found for ${entityExternalId}`);

    const escalationPath = escalationAttr ? entry.attribute_values[escalationAttr.id]?.value ?? null : null;
    const schedule = scheduleAttr ? entry.attribute_values[scheduleAttr.id]?.value ?? null : null;

    // currently_on_call is a path attribute — not resolved on the BackstageComponent entry.
    // Fetch the Schedule catalog entry directly to get it.
    let currentlyOnCall: CatalogAttributeValue[] = [];
    if (schedule) {
      const scheduleEntry = await IncidentApi.request<{ catalog_entry: CatalogEntry }>({
        path: `/v3/catalog_entries/${schedule.literal}`,
      });
      currentlyOnCall = scheduleEntry.catalog_entry.attribute_values['currently_on_call']?.array_value ?? [];
    }

    return { escalationPath, schedule, currentlyOnCall };
  }, deps);
};
