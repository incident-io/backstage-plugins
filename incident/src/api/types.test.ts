import type { paths } from "./types";

describe("types", () => {
  it("should expose the incidents list path", () => {
    type HasIncidentsPath = "/v2/incidents" extends keyof paths ? true : false;
    const check: HasIncidentsPath = true;
    expect(check).toBe(true);
  });

  it("should expose the identity path", () => {
    type HasIdentityPath = "/v1/identity" extends keyof paths ? true : false;
    const check: HasIdentityPath = true;
    expect(check).toBe(true);
  });
});
