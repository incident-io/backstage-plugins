/// <reference types="react" />
import * as react from 'react';
import * as _backstage_core_plugin_api from '@backstage/core-plugin-api';

declare const incidentPlugin: _backstage_core_plugin_api.BackstagePlugin<{}, {}, {}>;
declare const EntityIncidentCard: ({ maxIncidents, }: {
    maxIncidents?: number | undefined;
}) => react.JSX.Element;

export { EntityIncidentCard, incidentPlugin };
