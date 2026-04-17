import { renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useAllEscalationPaths, useAllSchedules, useOnCallData } from "./useOnCallRequest";

vi.mock("@backstage/core-plugin-api", () => ({
  useApi: vi.fn(),
  createApiRef: vi.fn(),
  configApiRef: {},
}));

import { useApi } from "@backstage/core-plugin-api";

describe("useAllEscalationPaths", () => {
  it("should return all escalation paths from the API", async () => {
    const mockResponse = {
      escalation_paths: [
        { id: "ep-1", name: "Primary EP" },
        { id: "ep-2", name: "Secondary EP" },
      ],
    };
    (useApi as ReturnType<typeof vi.fn>).mockReturnValue({
      request: vi.fn().mockResolvedValue(mockResponse),
    });

    const { result } = renderHook(() => useAllEscalationPaths([]));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.value).toEqual(mockResponse.escalation_paths);
    expect(result.current.error).toBeUndefined();
  });
});

describe("useAllSchedules", () => {
  it("should return all schedules from the API", async () => {
    const mockResponse = {
      schedules: [
        { id: "sched-1", name: "Primary Schedule" },
        { id: "sched-2", name: "Secondary Schedule" },
      ],
    };
    (useApi as ReturnType<typeof vi.fn>).mockReturnValue({
      request: vi.fn().mockResolvedValue(mockResponse),
    });

    const { result } = renderHook(() => useAllSchedules([]));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.value).toEqual(mockResponse.schedules);
    expect(result.current.error).toBeUndefined();
  });
});

describe("useOnCallData", () => {
  const setupApiMock = (
    attributes: object[],
    attributeValues: Record<string, unknown>,
  ) => {
    const mockRequest = vi.fn()
      .mockResolvedValueOnce({
        catalog_type: { schema: { attributes } },
      })
      .mockResolvedValueOnce({
        catalog_entries: [{ id: "entry-1" }],
      })
      .mockResolvedValueOnce({
        catalog_entry: { attribute_values: attributeValues },
      });

    (useApi as ReturnType<typeof vi.fn>).mockReturnValue({
      request: mockRequest,
      getString: vi.fn().mockReturnValue("catalog-type-123"),
    });

    return mockRequest;
  };

  beforeEach(() => vi.clearAllMocks());

  it("populates currentlyOnCall from the expanded entry when a path attribute ends in currently_on_call", async () => {
    const onCallPerson = { label: "Alice", literal: "user-1" };
    setupApiMock(
      [
        { id: "attr-ep", type: "EscalationPath" },
        { id: "attr-sched", type: "Schedule" },
        { id: "attr-oncall", type: "User", path: [{ attribute_id: "sched" }, { attribute_id: "currently_on_call" }] },
      ],
      {
        "attr-ep": { value: { label: "Primary EP", literal: "ep-1" } },
        "attr-sched": { value: { label: "Primary Schedule", literal: "sched-1" } },
        "attr-oncall": { array_value: [onCallPerson] },
      },
    );

    const { result } = renderHook(() => useOnCallData("default/core-server", []));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.value?.currentlyOnCall).toEqual([onCallPerson]);
    expect(result.current.error).toBeUndefined();
  });

  it("defaults currentlyOnCall to [] when no schema attribute path ends in currently_on_call", async () => {
    setupApiMock(
      [
        { id: "attr-ep", type: "EscalationPath" },
        { id: "attr-sched", type: "Schedule" },
      ],
      {
        "attr-ep": { value: { label: "Primary EP", literal: "ep-1" } },
        "attr-sched": { value: { label: "Primary Schedule", literal: "sched-1" } },
      },
    );

    const { result } = renderHook(() => useOnCallData("default/core-server", []));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.value?.currentlyOnCall).toEqual([]);
    expect(result.current.error).toBeUndefined();
  });

  it("defaults currentlyOnCall to [] when the currently_on_call attribute has no array_value", async () => {
    setupApiMock(
      [
        { id: "attr-ep", type: "EscalationPath" },
        { id: "attr-oncall", type: "User", path: [{ attribute_id: "currently_on_call" }] },
      ],
      {
        "attr-ep": { value: { label: "Primary EP", literal: "ep-1" } },
        "attr-oncall": { value: null },
      },
    );

    const { result } = renderHook(() => useOnCallData("default/core-server", []));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.value?.currentlyOnCall).toEqual([]);
    expect(result.current.error).toBeUndefined();
  });
});
