/*
 * Copyright 2023 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Progress } from "@backstage/core-components";
import { useEntity } from "@backstage/plugin-catalog-react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Typography,
  Collapse,
} from "@material-ui/core";
import CachedIcon from "@material-ui/icons/Cached";
import OpenInBrowserIcon from "@material-ui/icons/OpenInBrowser";
import { Alert } from "@material-ui/lab";
import { useState } from "react";
import { useIdentity } from "../../hooks/useIncidentRequest";
import {
  useOnCallData,
  useSchedule,
  useEscalationPath,
  ScheduleRotation,
  EscalationPathNode,
  EscalationPathTarget,
} from "../../hooks/useOnCallRequest";

// ── Schedule helpers ──────────────────────────────────────────────────────────

const intervalTypeToUnit = (type: string): string => {
  const map: Record<string, string> = { hourly: "hour", daily: "day", weekly: "week", monthly: "month" };
  return map[type] ?? type;
};

const formatInterval = (rotation: ScheduleRotation): string => {
  const h = rotation.handovers[0];
  if (!h) return "";
  const unit = intervalTypeToUnit(h.interval_type ?? '');
  return `Rotate every ${h.interval} ${unit}${h.interval !== 1 ? "s" : ""}`;
};

const formatShiftEnd = (isoString: string): string =>
  new Date(isoString).toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

const RotationDisplay = ({ rotation, currentUserId, currentShiftEnd }: {
  rotation: ScheduleRotation;
  currentUserId: string | null;
  currentShiftEnd: string | null;
}) => (
  <Box mt={1}>
    <Typography variant="caption" color="textSecondary">
      {formatInterval(rotation)}
    </Typography>
    <Box display="flex" flexDirection="column" mt={0.5} style={{ gap: 4 }}>
      {(() => {
        let onCallBadgeShown = false;
        return rotation.users.map((user) => {
          const isCurrent = user.id === currentUserId;
          const showBadge = isCurrent && !onCallBadgeShown;
          if (showBadge) onCallBadgeShown = true;
          return (
            <Box key={user.id} display="flex" alignItems="center" style={{ gap: 8 }}>
              <Box width={10} height={10} borderRadius="50%" bgcolor={showBadge ? "primary.main" : "grey.400"} flexShrink={0} />
              <Box display="flex" alignItems="center" style={{ gap: 6 }}>
                <Typography variant="body2" style={{ fontWeight: showBadge ? 600 : 400 }}>
                  {user.name}
                </Typography>
                {showBadge && <Chip label="on call" size="small" color="primary" />}
                {showBadge && currentShiftEnd && (
                  <Typography variant="caption" color="textSecondary">
                    until {formatShiftEnd(currentShiftEnd)}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        });
      })()}
    </Box>
  </Box>
);

// ── Escalation path helpers ───────────────────────────────────────────────────

const formatCondition = (cond: EscalationPathNode['if_else'] extends undefined ? never : NonNullable<EscalationPathNode['if_else']>['conditions'][0]): string => {
  const subject = cond.subject.label.replace(/^Escalation → /i, "");
  const op = cond.operation.label;
  const values = cond.param_bindings.flatMap(b => b.array_value?.map(v => v.label) ?? []);
  return values.length > 0 ? `${subject} ${op} ${values.join(", ")}` : `${subject} ${op}`;
};

const targetLabel = (t: EscalationPathTarget, scheduleId: string | null, scheduleName: string | null, channelNames: Record<string, string>): string => {
  if (t.type === "schedule") return t.id === scheduleId && scheduleName ? scheduleName : "schedule";
  if (t.type === "slack_channel") return `${channelNames[t.id] ?? t.id}`;
  return "user";
};

const renderEscalationNodes = (
  nodes: EscalationPathNode[],
  scheduleId: string | null,
  scheduleName: string | null,
  channelNames: Record<string, string>,
  depth = 0,
): React.ReactNode[] =>
  nodes.map((node) => {
    const indent = depth * 16;

    if ((node.type === "level" && node.level) || (node.type === "notify_channel" && node.notify_channel)) {
      const data = node.level ?? node.notify_channel!;
      const minutes = Math.floor((data.time_to_ack_seconds ?? 0) / 60);
      const label = data.targets.map(t => targetLabel(t, scheduleId, scheduleName, channelNames)).join(", ");
      const prefix = node.type === "notify_channel" ? "Notify" : "Page";
      return (
        <Box key={node.id} ml={`${indent}px`} display="flex" alignItems="center" style={{ gap: 6 }} mt={0.5}>
          <Typography variant="body2">└ {prefix}: {label}</Typography>
          <Typography variant="caption" color="textSecondary">· {minutes} min to ack</Typography>
        </Box>
      );
    }

    if (node.type === "repeat" && node.repeat) {
      return (
        <Box key={node.id} ml={`${indent}px`} mt={0.5}>
          <Typography variant="body2" color="textSecondary">
            └ Retry {node.repeat.repeat_times}x from start
          </Typography>
        </Box>
      );
    }

    if (node.type === "if_else" && node.if_else) {
      const condLabel = node.if_else.conditions.map(formatCondition).join(", ");
      return (
        <Box key={node.id} ml={`${indent}px`} mt={0.5}>
          <Typography variant="body2"><strong>If {condLabel}:</strong></Typography>
          {node.if_else.then_path.length > 0
            ? renderEscalationNodes(node.if_else.then_path, scheduleId, scheduleName, channelNames, depth + 1)
            : <Box ml="16px"><Typography variant="body2" color="textSecondary">└ Do nothing</Typography></Box>
          }
          <Typography variant="body2" style={{ marginTop: 4 }}><strong>Otherwise:</strong></Typography>
          {node.if_else.else_path.length > 0
            ? renderEscalationNodes(node.if_else.else_path, scheduleId, scheduleName, channelNames, depth + 1)
            : <Box ml="16px"><Typography variant="body2" color="textSecondary">└ Do nothing</Typography></Box>
          }
        </Box>
      );
    }

    return null;
  });

// ── Card ──────────────────────────────────────────────────────────────────────

export const EntityOnCallCard = () => {
  const { entity } = useEntity();
  const [reload, setReload] = useState(false);
  const [showPath, setShowPath] = useState(false);

  const entityExternalId = `${entity.metadata.namespace}/${entity.metadata.name}`;

  const { value, loading, error } = useOnCallData(entityExternalId, [reload]);
  const { value: schedule, loading: scheduleLoading, error: scheduleError } = useSchedule(
    value?.schedule?.literal ?? null,
    [value?.schedule?.literal, reload],
  );
  const { value: escalationPathResult, loading: escalationLoading, error: escalationError } = useEscalationPath(
    value?.escalationPath?.literal ?? null,
    [value?.escalationPath?.literal, reload],
  );
  const escalationPath = escalationPathResult?.ep ?? null;
  const channelNames = escalationPathResult?.channelNames ?? {};

  const { value: identity } = useIdentity();
  const baseUrl = identity?.identity.dashboard_url ?? "app.incident.io";

  const anyLoading = loading || scheduleLoading || escalationLoading;
  const anyError = error || scheduleError || escalationError;

  return (
    <Card>
      <CardHeader
        title="On-call"
        action={
          <IconButton aria-label="Refresh" title="Refresh" onClick={() => setReload(!reload)}>
            <CachedIcon />
          </IconButton>
        }
      />
      <Divider />
      <CardContent>
        {anyLoading && <Progress />}
        {anyError && <Alert severity="error">{anyError.message}</Alert>}
        {!loading && !error && value && (
          <>
            {/* Escalation path */}
            <Box mb={2}>
              <Typography variant="subtitle1"><strong>Escalation path</strong></Typography>
              {value.escalationPathStatus === 'no_field' && (
                <Alert severity="error">No escalation path field on this catalog type — add one in incident.io.</Alert>
              )}
              {value.escalationPathStatus === 'empty' && (
                <Alert severity="warning">Escalation path field is empty for this component.</Alert>
              )}
              {value.escalationPathStatus === 'ok' && escalationPath && (
                <>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle1">{escalationPath.name}</Typography>
                    <Tooltip title="View in incident.io" placement="top">
                      <IconButton size="small" href={`${baseUrl}/on-call/escalation-paths/${escalationPath.id}`} target="_blank" rel="noopener noreferrer" color="primary">
                        <OpenInBrowserIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {escalationPath.current_responders && escalationPath.current_responders.length > 0 && (
                    <Box mb={1}>
                      <Typography variant="body2"><strong>Current responders:</strong></Typography>
                      {escalationPath.current_responders.map((r) => (
                        <Typography key={r.id} variant="body2">{r.name}</Typography>
                      ))}
                    </Box>
                  )}
                  <Box
                    display="inline-flex"
                    alignItems="center"
                    style={{ cursor: "pointer", gap: 4 }}
                    onClick={() => setShowPath(p => !p)}
                    mt={0.5}
                    mb={0.5}
                  >
                    <Typography variant="button" color="primary">
                      {showPath ? "Hide path ▲" : "Show path ▼"}
                    </Typography>
                  </Box>
                  <Collapse in={showPath}>
                    {renderEscalationNodes(
                      escalationPath.path,
                      value.schedule?.literal ?? null,
                      schedule?.name ?? null,
                      channelNames,
                    )}
                  </Collapse>
                </>
              )}
            </Box>

            <Divider />

            {/* Schedule */}
            <Box mt={2}>
              <Typography variant="subtitle1"><strong>Schedule</strong></Typography>
              {value.scheduleStatus === 'no_field' && (
                <Alert severity="error">No schedule field on this catalog type — add one in incident.io.</Alert>
              )}
              {value.scheduleStatus === 'empty' && (
                <Alert severity="warning">Schedule field is empty for this component.</Alert>
              )}
              {value.scheduleStatus === 'ok' && schedule && (
                <>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle1">{schedule.name}</Typography>
                  <Tooltip title="View in incident.io" placement="top">
                    <IconButton size="small" href={`${baseUrl}/on-call/schedules/${schedule.id}`} target="_blank" rel="noopener noreferrer" color="primary">
                      <OpenInBrowserIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                {schedule.config?.rotations.map((rotation) => (
                  <RotationDisplay
                    key={rotation.id}
                    rotation={rotation}
                    currentUserId={schedule.current_shifts?.[0]?.user?.id ?? null}
                    currentShiftEnd={schedule.current_shifts?.[0]?.end_at ?? null}
                  />
                ))}
              </>
              )}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};
