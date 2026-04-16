import { useApi, configApiRef } from "@backstage/core-plugin-api";
import { useAsync } from "react-use";
import { IncidentApiRef } from "../api/client";
import { components } from "../api/types";
import { DependencyList } from "react";

export type EscalationPathNode = components["schemas"]["EscalationPathNodeV2"];
export type EscalationPathTarget = components["schemas"]["EscalationPathTargetV2"];
export type EscalationPathData = components["schemas"]["EscalationPathV2"];
export type ScheduleRotation = components["schemas"]["ScheduleRotationV2"];
export type ScheduleData = components["schemas"]["ScheduleV2"];

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
    const response = await IncidentApi.request<components["schemas"]["EscalationsShowPathResultV2"]>({
      path: `/v2/escalation_paths/${escalationPathId}`,
    });
    const ep = response.escalation_path;

    const channelNames: Record<string, string> = {};
    const channelIds = collectSlackChannelIds(ep.path);
    if (channelIds.length > 0) {
      const typesResponse = await IncidentApi.request<components["schemas"]["CatalogListTypesResultV3"]>({
        path: `/v3/catalog_types`,
      });
      const slackChannelType = typesResponse.catalog_types.find(t => t.type_name === "SlackChannel");
      if (slackChannelType) {
        const entriesResponse = await IncidentApi.request<components["schemas"]["CatalogListEntriesResultV3"]>({
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
    const response = await IncidentApi.request<components["schemas"]["SchedulesShowResultV2"]>({
      path: `/v2/schedules/${scheduleId}`,
    });
    return response.schedule;
  }, deps);
};


export const useOnCallData = (entityExternalId: string, deps?: DependencyList) => {
  const IncidentApi = useApi(IncidentApiRef);
  const config = useApi(configApiRef);

  return useAsync(async () => {
    const catalogTypeId = config.getString("incident.onCall.catalogTypeId");

    const typeResponse = await IncidentApi.request<components["schemas"]["CatalogShowTypeResultV3"]>({
      path: `/v3/catalog_types/${catalogTypeId}`,
    });

    const { schema } = typeResponse.catalog_type;
    const escalationAttr = schema.attributes.find(a => a.type === 'EscalationPath');
    const scheduleAttr = schema.attributes.find(a => a.type === 'Schedule');
    const currentlyOnCallAttr = schema.attributes.find(
      a => a.path?.[a.path.length - 1]?.attribute_id === 'currently_on_call'
    );

    const entriesResponse = await IncidentApi.request<components["schemas"]["CatalogListEntriesResultV3"]>({
      path: `/v3/catalog_entries?catalog_type_id=${catalogTypeId}&identifier=${encodeURIComponent(entityExternalId)}&page_size=1`,
    });

    const entry = entriesResponse.catalog_entries[0];
    if (!entry) throw new Error(`No incident.io catalog entry found for ${entityExternalId}`);

    const showResponse = await IncidentApi.request<components["schemas"]["CatalogShowEntryResultV3"]>({
      path: `/v3/catalog_entries/${entry.id}?expand=true`,
    });
    const fullEntry = showResponse.catalog_entry;

    const escalationPath = escalationAttr ? fullEntry.attribute_values[escalationAttr.id]?.value ?? null : null;
    const schedule = scheduleAttr ? fullEntry.attribute_values[scheduleAttr.id]?.value ?? null : null;
    const currentlyOnCall = currentlyOnCallAttr
      ? fullEntry.attribute_values[currentlyOnCallAttr.id]?.array_value ?? []
      : [];

    let escalationPathStatus: 'ok' | 'no_field' | 'empty';
    if (!escalationAttr) escalationPathStatus = 'no_field';
    else if (!escalationPath) escalationPathStatus = 'empty';
    else escalationPathStatus = 'ok';

    let scheduleStatus: 'ok' | 'no_field' | 'empty';
    if (!scheduleAttr) scheduleStatus = 'no_field';
    else if (!schedule) scheduleStatus = 'empty';
    else scheduleStatus = 'ok';

    return { escalationPath, schedule, currentlyOnCall, escalationPathStatus, scheduleStatus };
  }, deps);
};

export const useAllEscalationPaths = (deps?: DependencyList) => {
  const IncidentApi = useApi(IncidentApiRef);
  return useAsync(async () => {
    const response = await IncidentApi.request<components["schemas"]["EscalationsListPathsResultV2"]>({
      path: `/v2/escalation_paths`,
    });
    return response.escalation_paths;
  }, deps);
};

export const useAllSchedules = (deps?: DependencyList) => {
  const IncidentApi = useApi(IncidentApiRef);
  return useAsync(async () => {
    const response = await IncidentApi.request<components["schemas"]["SchedulesListResultV2"]>({
      path: `/v2/schedules`,
    });
    return response.schedules;
  }, deps);
};
