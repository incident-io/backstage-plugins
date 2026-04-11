/// <reference types="@testing-library/jest-dom" />
import { TestApiProvider, renderInTestApp } from "@backstage/test-utils";
import { vi, type Mocked } from "vitest";
import { IncidentApi, IncidentApiRef } from "../../api/client";
import { HomePageAlertCardContent } from "./Content";

const mockAlert = {
  id: "alert-1",
  title: "High error rate",
  status: "firing",
  created_at: "2026-04-09T12:00:00Z",
  updated_at: "2026-04-09T12:00:00Z",
  deduplication_key: "abc123",
  alert_source_id: "src-1",
  attributes: [],
};

const makeIncidentApi = (
  alerts: typeof mockAlert[],
): Mocked<Partial<IncidentApi>> => ({
  request: vi.fn().mockImplementation(({ path }: { path: string }) => {
    if (path.startsWith("/v2/alerts")) {
      return Promise.resolve({ alerts });
    }
    if (path === "/v2/alert_sources") {
      return Promise.resolve({ alert_sources: [] });
    }
    return Promise.resolve({});
  }),
});

const renderContent = (alerts: typeof mockAlert[]) =>
  renderInTestApp(
    <TestApiProvider apis={[[IncidentApiRef, makeIncidentApi(alerts)]]}>
      <HomePageAlertCardContent />
    </TestApiProvider>,
  );

describe("HomePageAlertCardContent", () => {
  it("should render an alert chip when an alert is returned", async () => {
    const { findByTestId } = await renderContent([mockAlert]);
    expect(await findByTestId("chip-firing")).toBeInTheDocument();
  });

  it("should show empty state when API returns no alerts", async () => {
    const { findByText } = await renderContent([]);
    expect(await findByText(/No firing alerts\./i)).toBeInTheDocument();
  });

  it("should render Firing, Resolved, and All tabs", async () => {
    const { findByText } = await renderContent([]);
    expect(await findByText("Firing")).toBeInTheDocument();
    expect(await findByText("Resolved")).toBeInTheDocument();
    expect(await findByText("All")).toBeInTheDocument();
  });
});
