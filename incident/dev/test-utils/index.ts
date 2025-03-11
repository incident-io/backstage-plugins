import { Entity } from "@backstage/catalog-model";
import { definitions } from "../../src/api/types";
import { faker } from "@faker-js/faker";
import { http, HttpResponse, RequestHandler } from "msw";

export function fakeEntity(): Entity {
  return {
    apiVersion: "backstage.io/v1alpha1",
    kind: "Component",
    metadata: {
      name: "backstage",
      description: "backstage.io",
      annotations: {
        "backstage.io/kubernetes-id": "dice-roller",
      },
    },
    spec: {
      lifecycle: "production",
      type: "service",
      owner: "user:guest",
    },
  };
}

export function incidentIOHandler(mockApiOrigin: string): RequestHandler[] {
  return [
    http.get(`${mockApiOrigin}/v1/identity`, () => {
      return HttpResponse.json(fakeIdentity());
    }),

    http.get(`${mockApiOrigin}/v2/incidents`, () => {
      return HttpResponse.json(fakeIncidents());
    }),
  ];
}

export function fakeIncident(): definitions["IncidentV2ResponseBody"] {
  return {
    call_url: faker.internet.url(),
    created_at: faker.date.past().toISOString(),
    name: faker.company.buzzPhrase(),
    creator: {},
    custom_field_entries: [],
    id: faker.string.uuid(),
    incident_role_assignments: [],
    incident_status: {
      id: faker.string.uuid(),
      category: "active",
      created_at: faker.date.past().toISOString(),
      description: faker.lorem.paragraph(),
      name: faker.company.buzzPhrase(),
      rank: faker.number.int(),
      updated_at: faker.date.past().toISOString(),
    },
    mode: "standard",
    reference: faker.company.buzzVerb(),
    slack_channel_id: faker.string.uuid(),
    slack_channel_name: faker.word.noun(),
    slack_team_id: faker.string.uuid(),
    updated_at: faker.date.past().toISOString(),
    visibility: "public",
    external_id: "unknown",
    idempotency_key: "unknown",
    organisation_id: "unknown",
    last_activity_at: "unknown",
    active_participants: "unknown",
    passive_participants: "unknown",
    reported_at: "unknown",
  };
}

export function fakeIncidents(): definitions["IncidentsV2ListResponseBody"] {
  return {
    incidents: [fakeIncident(), fakeIncident()],
    pagination_meta: {
      page_size: 100,
      total_record_count: 100,
    },
  };
}

export function fakeIdentity(): definitions["UtilitiesV1IdentityResponseBody"] {
  return {
    identity: {
      dashboard_url: faker.internet.url(),
      name: faker.person.firstName(),
      roles: ["catalog_editor"],
    },
  };
}
