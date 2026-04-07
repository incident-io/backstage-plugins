import type { paths, operations } from "./types";

describe("types", () => {
  it("should expose the incidents list path", () => {
    // Verify the generated type has the expected path key at compile time.
    // If the type changes shape this will fail to compile.
    type IncidentListOp =
      paths["/v2/incidents"]["get"] extends operations[infer _K] ? true : true;
    const check: IncidentListOp = true;
    expect(check).toBe(true);
  });

  it("should expose the identity path", () => {
    type IdentityOp =
      paths["/v1/identity"]["get"] extends operations[infer _K] ? true : true;
    const check: IdentityOp = true;
    expect(check).toBe(true);
  });
});
