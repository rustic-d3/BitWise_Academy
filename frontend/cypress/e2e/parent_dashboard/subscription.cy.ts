describe("Fluxul de Abonamente și Adăugare Copil", () => {
  beforeEach(() => {
    // Ne logăm automat la începutul fiecărui test
    cy.login("parent2", "Parent2@mail.com");
  });

  // ==========================================
  // SCENARIUL 1: Protecția rutei
  // ==========================================
  it("1. Ar trebui să blocheze accesul direct (fără state) și să redirecționeze", () => {
    // Încercăm să accesăm direct URL-ul, ca un utilizator care dă copy-paste la link
    cy.visit("/subscription-form?cardId=1");

    // Ar trebui să fim aruncați înapoi pe dashboard
    cy.url().should("include", "/dashboard");
  });

  // ==========================================
  // SCENARIUL 2: Părinte FĂRĂ copii adăugați
  // ==========================================
  describe("Părinte fără copii", () => {
    beforeEach(() => {
      cy.intercept("GET", "**/api/parent/profile", {
        statusCode: 200,
        body: { children: [] },
      }).as("getEmptyProfile");

      cy.visit("/subscriptions");

      cy.get(".pricing-card--black").first().click();

      cy.wait("@getEmptyProfile");
    });

    it('2. Ar trebui să forțeze formularul de "Copil Nou" dacă lista e goală', () => {
      // Verificăm dacă titlul corect este afișat
      cy.contains("Înregistrează-ți copilul pentru a putea începe!").should(
        "be.visible",
      );

      // Select-ul ar trebui să NU existe
      cy.get("#childSelect").should("not.exist");
    });

    it("3. Ar trebui să creeze un copil nou cu succes", () => {
      // Interceptăm request-ul de creare copil
      cy.intercept("POST", "**/api/children/add/", { statusCode: 201 }).as(
        "addChild",
      );

      // Completăm formularul
      cy.get('input[name="childName"]').type("Andrei");
      cy.get('input[name="childSurname"]').type("Popescu");
      cy.get('input[name="childAge"]').type("10");

      cy.get('button[type="submit"]').click();

      // Verificăm că s-a trimis request-ul
      cy.wait("@addChild").then((interception) => {
        // Verificăm că frontend-ul a calculat corect creditele (cardId 1 = 4 credite)
        expect(interception.request.body.credits).to.eq(4);
        expect(interception.request.body.full_name).to.eq("Andrei Popescu");
      });

      // Trebuie să ne trimită pe dashboard după succes
      cy.url().should("include", "/dashboard");
    });
  });

  // ==========================================
  // SCENARIUL 3: Părinte CARE ARE deja copii
  // ==========================================
  describe("Părinte cu copii existenți", () => {
    beforeEach(() => {
      // Simulăm că backend-ul returnează un copil existent
      cy.intercept("GET", "**/api/parent/profile", {
        statusCode: 200,
        body: {
          children: [{ id: 99, full_name: "Maria Ionescu", credits: 2 }],
        },
      }).as("getProfileWithChildren");

      cy.visit("/subscriptions");
      cy.get(".pricing-card--black").click();
      cy.wait("@getProfileWithChildren");
    });

    it("4. Ar trebui să afișeze dropdown-ul și să poată adăuga credite", () => {
      cy.contains(
        "Alege copilul căruia dorești să îi atribui creditele:",
      ).should("be.visible");

      cy.get("#childSelect").should(
        "contain",
        "Maria Ionescu (Credite actuale: 2)",
      );

      cy.intercept("PATCH", "**/api/child/99/update/", { statusCode: 200 }).as(
        "updateCredits",
      );

      cy.get('button[type="submit"]').click();

      cy.wait("@updateCredits").then((interception) => {
        expect(interception.request.body.credits).to.eq(6);
      });

      cy.url().should("include", "/dashboard");
    });

    it('5. Ar trebui să poată comuta între "Selectează copil" și "Adaugă copil nou"', () => {
      cy.contains("+ Adaugă un copil nou").click();

      cy.get('input[name="childName"]').should("be.visible");

      cy.contains("← Înapoi la lista de copii").click();

      cy.get("#childSelect").should("be.visible");
    });
  });
});
