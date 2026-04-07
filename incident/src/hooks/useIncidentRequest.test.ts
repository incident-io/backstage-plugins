import { renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useIncidentList, useIdentity } from "./useIncidentRequest";

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
