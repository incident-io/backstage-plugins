import { renderHook, waitFor, act } from "@testing-library/react";
import { vi } from "vitest";
import {
  useIncidentList,
  useIdentity,
  useAlertList,
  useIncidentAlertList,
  useAlertSourceList,
  useAlertAttributeList,
} from "./useIncidentRequest";

// Mock @backstage/core-plugin-api so useApi returns our fake client
vi.mock("@backstage/core-plugin-api", () => ({
  useApi: vi.fn(),
  createApiRef: vi.fn(),
}));

import { useApi } from "@backstage/core-plugin-api";

describe("useIncidentList", () => {
  it("should return incidents from the API", async () => {
    const mockResponse = { incidents: [{ id: "INC-1", name: "Test incident" }] };
    (useApi as ReturnType<typeof vi.fn>).mockReturnValue({
      request: vi.fn().mockResolvedValue(mockResponse),
    });

    const { result } = renderHook(() =>
      useIncidentList(new URLSearchParams({ status: "active" }), []),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.value).toEqual(mockResponse);
    expect(result.current.error).toBeUndefined();
  });
});

describe("useAlertList", () => {
  const mockAlert = {
    id: "01KNS58MGQGMHDT8C2X8094MAF",
    title: "High error rate",
    description: "CPU exceeded 75% for 5 minutes",
    status: "firing",
    created_at: "2026-04-09T12:00:00Z",
    updated_at: "2026-04-09T12:00:00Z",
    deduplication_key: "abc123",
    alert_source_id: "src-1",
    source_url: "https://datadog.com/alerts/123",
    attributes: [],
  };
  const mockResponse = { alerts: [mockAlert], pagination_meta: { page_size: 25 } };

  it("should return alerts from the API", async () => {
    (useApi as ReturnType<typeof vi.fn>).mockReturnValue({
      request: vi.fn().mockResolvedValue(mockResponse),
    });

    const { result } = renderHook(() => useAlertList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.value).toEqual(mockResponse);
    expect(result.current.error).toBeUndefined();
  });

  it("passes the status filter as a query param", async () => {
    const mockRequest = vi.fn().mockResolvedValue(mockResponse);
    (useApi as ReturnType<typeof vi.fn>).mockReturnValue({ request: mockRequest });

    const { result } = renderHook(() => useAlertList("firing"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringContaining("status%5Bone_of%5D=firing") }),
    );
  });

  it("does not pass a status param when status is undefined", async () => {
    const mockRequest = vi.fn().mockResolvedValue(mockResponse);
    (useApi as ReturnType<typeof vi.fn>).mockReturnValue({ request: mockRequest });

    const { result } = renderHook(() => useAlertList(undefined));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.not.stringContaining("status") }),
    );
  });

  it("re-fetches when deps change", async () => {
    const mockRequest = vi.fn().mockResolvedValue(mockResponse);
    (useApi as ReturnType<typeof vi.fn>).mockReturnValue({ request: mockRequest });

    let reload = false;
    const { result, rerender } = renderHook(() => useAlertList("firing", [reload]));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockRequest).toHaveBeenCalledTimes(1);

    act(() => { reload = true; });
    rerender();

    await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(2));
  });
});

describe("useIncidentAlertList", () => {
  it("returns empty immediately when no incident IDs are given", async () => {
    (useApi as ReturnType<typeof vi.fn>).mockReturnValue({
      request: vi.fn(),
    });

    const { result } = renderHook(() => useIncidentAlertList([]));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.value?.incident_alerts).toEqual([]);
    expect(result.current.error).toBeUndefined();
  });

  it("makes one request per incident ID and flattens results", async () => {
    const mockRequest = vi.fn()
      .mockResolvedValueOnce({ incident_alerts: [{ id: "ia-1", alert: { id: "a-1" }, incident: { id: "inc-1" } }], pagination_meta: { page_size: 25 } })
      .mockResolvedValueOnce({ incident_alerts: [{ id: "ia-2", alert: { id: "a-2" }, incident: { id: "inc-2" } }], pagination_meta: { page_size: 25 } });

    (useApi as ReturnType<typeof vi.fn>).mockReturnValue({ request: mockRequest });

    const { result } = renderHook(() => useIncidentAlertList(["inc-1", "inc-2"]));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockRequest).toHaveBeenCalledTimes(2);
    expect(result.current.value?.incident_alerts).toHaveLength(2);
    expect(result.current.value?.incident_alerts.map(ia => ia.id)).toEqual(["ia-1", "ia-2"]);
  });

  it("re-fetches when deps change even if incident IDs are unchanged", async () => {
    const mockRequest = vi.fn().mockResolvedValue({
      incident_alerts: [{ id: "ia-1", alert: { id: "a-1" }, incident: { id: "inc-1" } }],
      pagination_meta: { page_size: 25 },
    });
    (useApi as ReturnType<typeof vi.fn>).mockReturnValue({ request: mockRequest });

    let reload = false;
    const { result, rerender } = renderHook(() => useIncidentAlertList(["inc-1"], [reload]));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockRequest).toHaveBeenCalledTimes(1);

    act(() => { reload = true; });
    rerender();

    await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(2));
  });
});

describe("useAlertSourceList", () => {
  it("should return alert sources from the API", async () => {
    const mockResponse = {
      alert_sources: [{ id: "src-1", name: "Datadog", source_type: "datadog" }],
    };
    (useApi as ReturnType<typeof vi.fn>).mockReturnValue({
      request: vi.fn().mockResolvedValue(mockResponse),
    });

    const { result } = renderHook(() => useAlertSourceList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.value).toEqual(mockResponse);
    expect(result.current.error).toBeUndefined();
  });
});

describe("useAlertAttributeList", () => {
  it("should return alert attributes from the API", async () => {
    const mockResponse = {
      alert_attributes: [
        { id: "attr-1", name: "Priority", type: "string", array: false, required: false },
      ],
    };
    (useApi as ReturnType<typeof vi.fn>).mockReturnValue({
      request: vi.fn().mockResolvedValue(mockResponse),
    });

    const { result } = renderHook(() => useAlertAttributeList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.value).toEqual(mockResponse);
    expect(result.current.error).toBeUndefined();
  });
});

describe("useIdentity", () => {
  it("should return identity from the API", async () => {
    const mockIdentity = { current_user: { id: "user-1", name: "Alice" } };
    (useApi as ReturnType<typeof vi.fn>).mockReturnValue({
      request: vi.fn().mockResolvedValue(mockIdentity),
    });

    const { result } = renderHook(() => useIdentity());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.value).toEqual(mockIdentity);
    expect(result.current.error).toBeUndefined();
  });
});
