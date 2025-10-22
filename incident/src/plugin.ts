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
import {
  createApiFactory,
  createComponentExtension,
  createPlugin,
  discoveryApiRef,
  fetchApiRef,
} from "@backstage/core-plugin-api";
import {
  CardExtensionProps,
  createCardExtension,
} from "@backstage/plugin-home-react";

import { IncidentApi, IncidentApiRef } from "./api/client";

export const incidentPlugin = createPlugin({
  id: "incident",
  apis: [
    createApiFactory({
      api: IncidentApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) => {
        return new IncidentApi({
          discoveryApi: discoveryApi,
          fetchApi: fetchApi,
        });
      },
    }),
  ],
});

export const EntityIncidentCard = incidentPlugin.provide(
  createComponentExtension({
    name: "EntityIncidentCard",
    component: {
      lazy: () =>
        import("./components/EntityIncidentCard").then(
          (m) => m.EntityIncidentCard,
        ),
    },
  }),
);

export const HomePageIncidentCard: (
  props: CardExtensionProps<unknown>,
) => React.JSX.Element = incidentPlugin.provide(
  createCardExtension({
    name: "HomePageIncidentCard",
    title: "Ongoing Incidents",
    components: () => import("./components/HomePageIncidentCard"),
    settings: {
      schema: {
        type: "object",
        properties: {
          filterType: {
            type: "string",
            title: "Filter Type",
            description: "Whether to filter on status category or status",
            oneOf: [
              { enum: ["status_category"], title: "Status Category" },
              { enum: ["status"], title: "Status" },
            ],
            default: "status_category",
          },
          filter: {
            type: "string",
            title: "Filter",
            description:
              "The filter to use. This is a string that will be passed to the API.",
            default: "active",
          },
        },
      },
    },
  }),
);
