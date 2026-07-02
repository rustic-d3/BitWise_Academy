import { defineConfig } from "cypress";

export default defineConfig({
  projectId: '64we4r',
  allowCypressEnv: false,

  e2e: {
    baseUrl: "http://localhost:5173",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
