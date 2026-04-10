import { useApi } from "@backstage/core-plugin-api";
import { useAsync } from "react-use";
import { IncidentApiRef } from "../api/client";
import { DependencyList } from "react";

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

    let escalationPathStatus: 'ok' | 'no_field' | 'empty';
    if (!escalationAttr) escalationPathStatus = 'no_field';
    else if (!escalationPath) escalationPathStatus = 'empty';
    else escalationPathStatus = 'ok';

    let scheduleStatus: 'ok' | 'no_field' | 'empty';
    if (!scheduleAttr) scheduleStatus = 'no_field';
    else if (!schedule) scheduleStatus = 'empty';
    else scheduleStatus = 'ok';

    let currentlyOnCall: CatalogAttributeValue[] = [];
    if (schedule) {
      const scheduleEntry = await IncidentApi.request<{ catalog_entry: CatalogEntry }>({
        path: `/v3/catalog_entries/${schedule.literal}`,
      });
      currentlyOnCall = scheduleEntry.catalog_entry.attribute_values.currently_on_call?.array_value ?? [];
    }

    return { escalationPath, schedule, currentlyOnCall, escalationPathStatus, scheduleStatus };
  }, deps);
};

export const useAllEscalationPaths = (deps?: DependencyList) => {
  const IncidentApi = useApi(IncidentApiRef);
  return useAsync(async () => {
    const response = await IncidentApi.request<{
      escalation_paths: Array<{ id: string; name: string }>;
    }>({
      path: `/v2/escalation_paths`,
    });
    return response.escalation_paths;
  }, deps);
};

export const useAllSchedules = (deps?: DependencyList) => {
  const IncidentApi = useApi(IncidentApiRef);
  return useAsync(async () => {
    const response = await IncidentApi.request<{
      schedules: Array<{ id: string; name: string }>;
    }>({
      path: `/v2/schedules`,
    });
    return response.schedules;
  }, deps);
};
