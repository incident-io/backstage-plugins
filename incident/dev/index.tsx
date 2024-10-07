import { createDevApp } from "@backstage/dev-utils";
import React from "react";
import { EntityIncidentCard, incidentPlugin, HomePageIncidentCard, EntityIncidentWarningPanel } from "../src";
import { fakeEntity, incidentIOHandler } from "./test-utils";
import {
  EntityProvider,
  catalogApiRef,
  CatalogApi,
} from "@backstage/plugin-catalog-react";
import { CatalogEntityPage } from "@backstage/plugin-catalog";
import { setupWorker } from "msw/browser";
import {Content, Header, Page} from "@backstage/core-components";
import {Grid} from "@material-ui/core";

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
    title: "EntityIncidentCard",
    element: <CatalogEntityPage />,
    children: (
      <EntityProvider entity={mockEntity}>
        <EntityIncidentCard />
      </EntityProvider>
    ),
  })
  .addPage({
    path: "/incidents",
    title: "HomePageIncidentCardContent",
    element: (
      <Page themeId="home">
        <Content>
          <HomePageIncidentCard />
        </Content>
      </Page>
    ),
  })
  .addPage({
    path: "/catalog-2/:namespace/:kind/:name",
    title: "EntityIncidentWarningPanel",
    element: <CatalogEntityPage />,
    children: (
        <>
            <Header title="Entity Page"/>
            <Content>
                <Grid container>
                    <Grid item xs={12}>
                        <EntityProvider entity={mockEntity}>
                            <EntityIncidentWarningPanel/>
                        </EntityProvider>
                    </Grid>
                </Grid>
            </Content>
        </>
    ),
  })
  .render();
