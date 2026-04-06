import React from "react";
import {
  ApiBlueprint,
  createFrontendPlugin,
} from "@backstage/frontend-plugin-api";
import {
  discoveryApiRef,
  fetchApiRef,
} from "@backstage/core-plugin-api";
import { EntityCardBlueprint } from "@backstage/plugin-catalog-react/alpha";
import { HomePageWidgetBlueprint } from "@backstage/plugin-home-react/alpha";
import { IncidentApi, IncidentApiRef } from "./api/client";

const incidentApi = ApiBlueprint.make({
  params: defineParams =>
    defineParams({
      api: IncidentApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>{ 
        return new IncidentApi({ 
          discoveryApi: discoveryApi, 
          fetchApi: fetchApi 
        });
      },
    }),
});

const entityIncidentCard = EntityCardBlueprint.make({
  name: "EntityIncidentCard",
  params: {
    loader: async () => 
      import("./components/EntityIncidentCard").then(m=><m.EntityIncidentCard />),
  },
});

const homePageIncidentCard = HomePageWidgetBlueprint.make({
  name: "HomePageIncidentCard",
  params: {
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
  },
});

export default createFrontendPlugin({
  pluginId: "incident",
  extensions: [incidentApi, entityIncidentCard, homePageIncidentCard],
});
