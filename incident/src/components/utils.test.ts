import { Entity } from "@backstage/catalog-model";
import { EXTERNAL_ID_ANNOTATION, getEntityExternalID } from "./utils";

const entity = (annotations?: Record<string, string>): Entity => ({
  apiVersion: "backstage.io/v1alpha1",
  kind: "Component",
  metadata: { namespace: "default", name: "payments", annotations },
});

describe("getEntityExternalID", () => {
  it("defaults to namespace/name", () => {
    expect(getEntityExternalID(entity())).toBe("default/payments");
  });

  it("uses the external ID annotation when set", () => {
    expect(
      getEntityExternalID(entity({ [EXTERNAL_ID_ANNOTATION]: "svc-payments" })),
    ).toBe("svc-payments");
  });
});
