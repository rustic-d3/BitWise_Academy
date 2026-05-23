describe("Fluxul de Înregistrare (Register)", () => {
  beforeEach(() => {
    cy.visit("/register");
  });

  it("1. Ar trebui să blocheze trimiterea și să afișeze erori pentru câmpurile goale", () => {
    // Click direct, fără să completăm nimic
    cy.get('[data-cy="submitButton"]').click();

    // Căutăm exact în span-urile tale de eroare
    cy.get('[data-cy="firstName-error"]').should(
      "contain",
      "Prenumele este obligatoriu.",
    );
    cy.get('[data-cy="lastName-error"]').should(
      "contain",
      "Numele este obligatoriu.",
    );
    cy.get('[data-cy="username-error"]').should(
      "contain",
      "Numele de utilizator este obligatoriu.",
    );
    cy.get('[data-cy="email-error"]').should(
      "contain",
      "Email-ul este obligatoriu.",
    );
    cy.get('[data-cy="phone-error"]').should(
      "contain",
      "Numărul de telefon este obligatoriu.",
    );
    cy.get('[data-cy="password-error"]').should(
      "contain",
      "Parola este obligatorie.",
    );
  });

  it("2. Ar trebui să valideze lungimea numelui de utilizator (sub 3 caractere)", () => {
    // Completăm tot formularul PERFECT...
    cy.get('[data-cy="nameField"]').type("Popescu");
    cy.get('[data-cy="surnameField"]').type("Ion");
    cy.get('[data-cy="emailField"]').type("ion.popescu@exemplu.com");
    cy.get('[data-cy="phoneField"]').type("0722123456");
    cy.get('[data-cy="passwordField"]').type("ParolaMea123!");

    // ...cu excepția username-ului, pe care îl facem prea scurt
    cy.get('[data-cy="usernameField"]').type("ab");

    cy.get('[data-cy="submitButton"]').click();

    // Verificăm strict eroarea de username
    cy.get('[data-cy="username-error"]')
      .should("be.visible")
      .and(
        "contain",
        "Numele de utilizator trebuie să aibă minim 3 caractere.",
      );
  });

  it("3. Ar trebui să valideze formatul de email și număr de telefon", () => {
    cy.get('[data-cy="nameField"]').type("Popescu");
    cy.get('[data-cy="surnameField"]').type("Ion");
    cy.get('[data-cy="usernameField"]').type("ionpopescu");
    cy.get('[data-cy="passwordField"]').type("ParolaMea123!");

    // Introducem email și telefon invalide
    cy.get('[data-cy="emailField"]').type("email_fara_aron_si_domeniu");
    cy.get('[data-cy="phoneField"]').type("123");

    cy.get('[data-cy="submitButton"]').click();

    cy.get('[data-cy="email-error"]')
      .should("be.visible")
      .and("contain", "Formatul email-ului este invalid.");

    cy.get('[data-cy="phone-error"]')
      .should("be.visible")
      .and("contain", "Număr de telefon invalid.");
  });

  it("4. Ar trebui să valideze complexitatea parolei", () => {
    // Completăm restul câmpurilor valid
    cy.get('[data-cy="nameField"]').type("Popescu");
    cy.get('[data-cy="surnameField"]').type("Ion");
    cy.get('[data-cy="usernameField"]').type("ionpopescu");
    cy.get('[data-cy="emailField"]').type("ion@exemplu.com");
    cy.get('[data-cy="phoneField"]').type("0722123456");

    // Testăm prima regulă: lungimea
    cy.get('[data-cy="passwordField"]').type("parola");
    cy.get('[data-cy="submitButton"]').click();
    cy.get('[data-cy="password-error"]').should(
      "contain",
      "Parola trebuie să aibă minim 8 caractere.",
    );

    // Testăm regula: literă mare (corectăm lungimea, ignorăm litera mare)
    cy.get('[data-cy="passwordField"]').clear().type("parolamica123!");
    cy.get('[data-cy="submitButton"]').click();
    cy.get('[data-cy="password-error"]').should(
      "contain",
      "Parola trebuie să conțină cel puțin o literă mare.",
    );

    // Testăm regula: cifră
    cy.get('[data-cy="passwordField"]').clear().type("ParolaFaraCifre!");
    cy.get('[data-cy="submitButton"]').click();
    cy.get('[data-cy="password-error"]').should(
      "contain",
      "Parola trebuie să conțină cel puțin o cifră.",
    );
  });

  it("5. Ar trebui să înregistreze utilizatorul cu succes și să facă redirect spre login", () => {
    // Interceptăm request-ul ca să nu umplem baza de date reală cu useri de test
    // Dacă ai o altă rută pentru înregistrare (ex: /api/register/), modific-o mai jos:
    cy.intercept("POST", "**/api/**", { statusCode: 201 }).as(
      "registerSuccess",
    );

    // Completăm totul corect
    cy.get('[data-cy="nameField"]').type("Popescu");
    cy.get('[data-cy="surnameField"]').type("Ion");
    cy.get('[data-cy="usernameField"]').type("ionpopescu");
    cy.get('[data-cy="emailField"]').type("ion.popescu@exemplu.com");
    cy.get('[data-cy="phoneField"]').type("0722123456");
    cy.get('[data-cy="passwordField"]').type("ParolaMea123!");

    cy.get('[data-cy="submitButton"]').click();

    // Așteptăm confirmarea request-ului
    cy.wait("@registerSuccess");

    // Verificăm redirecționarea
    cy.url().should("include", "/login");
  });
});
