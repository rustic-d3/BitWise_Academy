declare namespace Cypress {
  interface Chainable {
    getTestData(dataSelector: string): Chainable<JQuery<HTMLElement>>;
    loginAs(role: string): Chainable<JQuery<HTMLElement>>;
  }
}