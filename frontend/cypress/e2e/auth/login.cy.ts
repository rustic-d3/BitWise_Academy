describe("Fluxul de Autentificare (Login)", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("Ar trebui să afișeze mesaj de eroare când credențialele sunt greșite", () => {
    cy.intercept("POST", "**/token*", {
      statusCode: 401,
      body: { detail: "Nu am putut găsi un cont cu aceste credențiale." },
    }).as("loginFailed");

    cy.get('[data-cy="usernameField"]').type("utilizatorGresit");
    cy.get('[data-cy="passwordField"]').type("parolaGresita");
    cy.get('[data-cy="submitButton"]').click();

    //Așteptăm ca cererea interceptată să aibă loc
    cy.wait("@loginFailed");

    //Verificăm dacă mesajul de eroare este vizibil și conține textul corect
    cy.get('[data-cy="login-error-message"]')
      .should("be.visible")
      .and("contain", "Nu am putut găsi un cont");
  });

  it("Ar trebui să autentifice utilizatorul și să îl redirecționeze către dashboard", () => {
    //Interceptăm cererea și simulăm un răspuns de succes (200 OK)
    //cu un token JWT fals, la fel cum ar returna Django.
    cy.intercept("POST", "**/token*", {
      statusCode: 200,
      body: {
        access:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6InRlYWNoZXIiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNTE2MjM5MDIyfQ.hk04XkJHJosaSaEtrpdBDPvyOJs3HM22qg-EldB7_dA",
        refresh:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6InRlYWNoZXIiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNTE2MjM5MDIyfQ.hk04XkJHJosaSaEtrpdBDPvyOJs3HM22qg-EldB7_dA",
      },
    }).as("loginSuccess");

    // Simulăm acțiunile utilizatorului
    cy.get('[data-cy="usernameField"]').type("profesorulMeu");
    cy.get('[data-cy="passwordField"]').type("parolaBuna123");
    cy.get('[data-cy="submitButton"]').click();

    //  Așteptăm ca cererea să aibă loc
    cy.wait("@loginSuccess");

    //  Verificăm dacă aplicația a salvat token-ul în localStorage
    cy.window().its("localStorage").invoke("getItem", "access").should("exist");

    //  Verificăm dacă React Router ne-a dus pe pagina corectă
    cy.url().should("include", "/dashboard");
  });

  // Un test rapid pentru validările locale din React, fără a atinge backend-ul
  it("Ar trebui să valideze câmpurile goale direct din frontend", () => {
    cy.get('[data-cy="submitButton"]').click();

    // Ne așteptăm ca funcția ta `validateForm` să oprească trimiterea formularului
    // și să nu facă cererea de login.
    cy.get('[data-cy="username-error"]').should("exist");
    cy.get('[data-cy="password-error"]').should("exist");
  });
});
