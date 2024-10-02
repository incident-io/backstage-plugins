import { createDevApp } from "@backstage/dev-utils";
import React from "react";
import { EntityIncidentCard, incidentPlugin } from "../src";
import { fakeEntity, incidentIOHandler } from "./test-utils";
import {
  EntityProvider,
  catalogApiRef,
  CatalogApi,
} from "@backstage/plugin-catalog-react";
import { CatalogEntityPage } from "@backstage/plugin-catalog";
import { setupWorker } from "msw/browser";
import { Content, Page } from "@backstage/core-components";
import { HomePageIncidentCardContent } from "../src/components/HomePageIncidentCard/Content";

const mockEntity = fakeEntity();
const mockApiOrigin = "http://localhost:7007/api/proxy/incident/api";

const worker = setupWorker(...incidentIOHandler(mockApiOrigin));

await worker.start();

createDevApp()
  .registerPlugin(incidentPlugin)
  // Mock Catalog API
  .registerApi({
    api: catalogApiRef,
    deps: {},
    factory: () =>
      ({
        getEntities: async () => {
          await new Promise((r) => setTimeout(r, 1000));

          return {
            items: [mockEntity],
          };
        },
        getEntityByRef: async () => {
          return mockEntity;
        },
      }) as Partial<CatalogApi> as any,
  })
  .addPage({
    path: "/catalog/:namespace/:kind/:name",
    title: "Catalog Page",
    element: <CatalogEntityPage />,
    children: (
      <EntityProvider entity={mockEntity}>
        <EntityIncidentCard />
      </EntityProvider>
    ),
  })
  .addPage({
    path: "/incidents",
    title: "Incidents",
    element: (
      <Page themeId="home">
        <Content>
          <HomePageIncidentCardContent />
        </Content>
      </Page>
    ),
  })
  .render();
