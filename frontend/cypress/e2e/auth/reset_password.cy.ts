describe("Fluxul de Cerere Resetare Parolă", () => {
  beforeEach(() => {
    cy.login("parent2", "Parent2@mail.com");

    // Deoarece token-ul este deja în localStorage, ProtectedRoute te va lăsa să treci!
    cy.visit("/profile-settings");
  });

  it("1. Ar trebui să afișeze eroare dacă email-ul nu este completat", () => {
    // Apăsăm pe buton fără să completăm nimic
    cy.get('[data-cy="profile-email-field"]').clear();
    cy.get('[data-cy="save-button"]').click();
    cy.get('[data-cy="reset-submit-button"]').click();

    // Verificăm mesajul de eroare generat de aplicația ta
    cy.get('[data-cy="reset-message"]')
      .should("be.visible")
      .and("contain", "Nu avem un email salvat pentru a trimite link-ul.");
  });

  it("2. Ar trebui să afișeze succes când backend-ul trimite email-ul (Mock)", () => {
    cy.intercept("POST", "**/api/password-reset/", { statusCode: 200 }).as(
      "resetRequest",
    );

    cy.get('[data-cy="profile-email-field"]')
      .clear()
      .type("utilizator@exemplu.com");
    cy.get('[data-cy="reset-submit-button"]').click();

    cy.wait("@resetRequest");

    cy.get('[data-cy="reset-message"]')
      .should("be.visible")
      .and(
        "contain",
        "Link-ul pentru resetarea parolei a fost trimis pe email!",
      );
  });

  it("3. Ar trebui să afișeze eroare dacă backend-ul pică", () => {
    // Simulăm o eroare de server (ex: email-ul nu există în baza de date)
    cy.intercept("POST", "**/api/password-reset/", { statusCode: 400 }).as(
      "resetError",
    );

    cy.get('[data-cy="profile-email-field"]')
      .clear()
      .type("email_inexistent@exemplu.com");
    cy.get('[data-cy="save-button"]').click();
    cy.get('[data-cy="reset-submit-button"]').click();

    cy.wait("@resetError");

    // Verificăm mesajul de eroare din catch-ul tău
    cy.get('[data-cy="reset-message"]')
      .should("be.visible")
      .and(
        "contain",
        "A apărut o eroare la trimiterea email-ului de resetare.",
      );
  });
});

describe("Fluxul de Setare a Noii Parole (Din link-ul de email)", () => {
  beforeEach(() => {
    cy.visit("/reset-password/fake-uid-123/fake-token-abc");
  });

  it("1. Ar trebui să reseteze parola cu succes și să ducă userul la login", () => {
    cy.intercept("POST", "**api/password-reset-confirm/**", {
      statusCode: 200,
    }).as("confirmReset");

    cy.get('[data-cy="new-password-input"]').type("ParolaNoua123!");
    cy.get('[data-cy="confirm-password-input"]').type("ParolaNoua123!");

    cy.get('[data-cy="submit-new-password-button"]').click();

    cy.wait("@confirmReset");

    // După succes, ar trebui să fim redirecționați spre login
    cy.url().should("include", "/login");
  });
});
