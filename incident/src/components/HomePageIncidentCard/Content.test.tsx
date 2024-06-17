import { TestApiProvider, renderInTestApp } from "@backstage/test-utils";
import React from "react";
import { IncidentApi, IncidentApiRef } from "../../api/client";
import { HomePageIncidentCardContent } from "./Content";

const mockIncidentApi: jest.Mocked<Partial<IncidentApi>> = {
  request: jest.fn().mockResolvedValue({
    incidents: [
      {
        id: "incident-id",
        name: "Incident",
        reference: "INC-1",
        incident_status: {
          id: "status-id",
          category: "active",
          name: "triage",
        },
        incident_role_assignments: [
          {
            assignee: {
              name: "John Smith",
            },
            role: {
              role_type: "lead",
            },
          },
        ],
        incident_timestamp_values: [
          {
            incident_timestamp: {
              id: "01FCNDV6P870EA6S7TK1DSYD5H",
              name: "reported",
              rank: 1,
            },
            value: {
              value: "2021-08-17T13:28:57.801578Z",
            },
          },
        ],
      },
    ],
  }),
};

describe("HomePageIncidentCardContent", () => {
  it("should render a list of live incidents", async () => {
    const { getByTestId } = await renderInTestApp(
      <TestApiProvider apis={[[IncidentApiRef, mockIncidentApi]]}>
        <HomePageIncidentCardContent />
      </TestApiProvider>,
    );

    expect(getByTestId("chip-status-id")).toBeInTheDocument();
  });
});
