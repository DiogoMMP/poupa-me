import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    // Dev server base URL used by cy.visit('/path') in specs
    baseUrl: 'http://localhost:4200',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
