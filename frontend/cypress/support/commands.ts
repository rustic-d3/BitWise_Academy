/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

Cypress.Commands.add("getTestData", (dataSelector) => {
  return cy.get(`[data-test=${dataSelector}]`);
});
Cypress.Commands.add("loginAs", (role) => {
  cy.request("POST", "http://localhost:8000/api/token/", {
    username: role === "teacher" ? "wanessa_grati" : "parent1",
    password: role === "teacher" ? "Wanessa1@mail.com" : "Parent2@mail.com",
  }).then((resp) => {
    window.localStorage.setItem("access", resp.body.access);
    window.localStorage.setItem("refresh", resp.body.refresh);
  });
});

Cypress.Commands.add("login", (username, password) => {
  // Facem cererea POST direct către backend, ocolind interfața grafică
  cy.request({
    method: "POST",
    url: "http://localhost:8000/api/token/",
    body: {
      username: username,
      password: password,
    },
    failOnStatusCode: false,
  }).then((response) => {
    window.localStorage.setItem("access", response.body.access);
    window.localStorage.setItem("refresh", response.body.refresh);
  });
});
