import { createDevApp } from "@backstage/dev-utils";
import { incidentPlugin } from "../src/plugin";

createDevApp().registerPlugin(incidentPlugin).render();
