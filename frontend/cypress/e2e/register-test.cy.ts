describe("Register system testing", () => {
  beforeEach(() => {
    cy.visit("http://localhost:5173/register");
  });
  it("test-input-name", () => {
    cy.getTestData("nameField").type("Ion2");
    cy.getTestData("surnameField").type("Vasile2");
    cy.getTestData("usernameField").type("ion_vasile2");
    cy.getTestData("emailField").type("Ion_vasile2@mail.com");
    cy.getTestData("phoneField").type("+40736564408");
    cy.getTestData("passwordField").type("Ion_vasile2@mail.com");
    cy.getTestData("submitButton").click();
  });
});
