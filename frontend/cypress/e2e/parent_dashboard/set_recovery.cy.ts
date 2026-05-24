describe("Fluxul Părintelui - Setare Oră de Recuperare", () => {
  beforeEach(() => {
    // 1. Logăm părintele
    cy.login("parent2", "Parent2@mail.com");

    // 2. Simulăm răspunsul de la profile (părintele are 2 copii)
    cy.intercept("GET", "**/api/parent/profile", {
      statusCode: 200,
      body: {
        children: [
          { id: 101, full_name: "Andrei Popescu", credits: 2 },
          { id: 102, full_name: "Maria Ionescu", credits: 5 },
        ],
      },
    }).as("getParentProfile");

    // 3. Simulăm detaliile copilului (profesorul alocat lui Andrei)
    // Când componenta setează Andrei ca activ, se face acest call
    cy.intercept("GET", "**/api/child/101/", {
      statusCode: 200,
      body: {
        classroom: {
          teacher: {
            id: 1,
            first_name: "Mihai ",
            last_name: "Dumitrescu",
            availabilities: [
              { day: "Mon", start_time: "14:00:00", end_time: "17:00:00" },
            ],
            booked_slots: [], // Niciun slot ocupat
          },
        },
      },
    }).as("getChildTeacher");

    cy.visit("/set-recovery");
    cy.wait("@getParentProfile");
    cy.wait("@getChildTeacher");
  });

  // ==========================================
  // SCENARIUL 1: Afișare UI
  // ==========================================
  it("1. Ar trebui să randeze copiii ca butoane și primul copil să fie activ", () => {
    // Verificăm dacă sunt 2 butoane pentru copii
    cy.get(".buttons-section button").should("have.length", 2);

    // Primul buton (Andrei) ar trebui să fie activ automat (logica din useEffect-ul tău)
    cy.get(".buttons-section button")
      .first()
      .should("contain", "Andrei Popescu")
      .and("have.class", "btn--users--active");

    // InfoCard-ul ar trebui să arate numele profesorului lui Andrei
    cy.contains("Mihai Dumitrescu").should("be.visible");
  });

  // ==========================================
  // SCENARIUL 2: Logica de Calendar (Ore / Zile)
  // ==========================================
  it("2. Ar trebui să genereze orele corect pe baza disponibilității (Sloturi de 1 oră)", () => {
    // În mock-ul de mai sus, prof. Mihai e disponibil Luni între 14:00 și 17:00.
    // Asta înseamnă că ar trebui să avem 3 sloturi: 14:00, 15:00, 16:00.

    // Trecem la luna viitoare ca să fim siguri că nu ne încurcă funcția ta "isDayDisabled" (care ascunde zilele trecute)
    cy.get(".nav-arrows button").last().click();

    // Dăm click pe o zi de Luni care NU este dezactivată
    // (Selector: găsim coloana cu index-ul corespunzător zilei de Luni, sau mai simplu, luăm o celulă validă)
    // NOTĂ: Deoarece nu știm exact ce dată va pica lunea viitoare, luăm prima zi de luni (index-ul corect depinde de DOM, dar "disabled" ne ajută)
    cy.get(".day-cell:not(.disabled)").first().click();

    // Verificăm dacă orele s-au generat corect conform funcției getAvailableTimeSlots()
    cy.get(".time-item").should("have.length", 3);
    cy.get(".time-item").eq(0).should("contain", "14:00");
    cy.get(".time-item").eq(1).should("contain", "15:00");
    cy.get(".time-item").eq(2).should("contain", "16:00");
  });

  // ==========================================
  // SCENARIUL 3: Salvare cu succes
  // ==========================================
  it("3. Ar trebui să permită salvarea și să afișeze mesajul de succes", () => {
    // Interceptăm request-ul POST final
    cy.intercept("POST", "**/api/lessons/create-recovery", {
      statusCode: 201,
      body: {},
      delay: 500, // Nu contează body-ul atâta timp cât statusul e 201
    }).as("saveRecovery");

    // Trecem la luna viitoare
    cy.get(".nav-arrows button").last().click();

    // Selectăm prima zi validă
    cy.get(".day-cell:not(.disabled)").first().click();

    // Selectăm ora 15:00
    cy.get(".time-item").contains("15:00").click();

    // Butonul de "Confirmă" trebuie să devină activ
    cy.get(".btn-save").should("not.be.disabled").click();

    // Verificăm overlay-ul tău de "Se programează..." (opțional)
    cy.contains("Se programează...").should("be.visible");

    // Așteptăm răspunsul
    cy.wait("@saveRecovery").then((interception) => {
      const body = interception.request.body;
      expect(body.child_id).to.eq(101); // Id-ul lui Andrei
      expect(body.time).to.eq("15:00");
      // Date-ul va fi ceva de genul '2026-06-XX', depinde pe ce zi de luni a picat click-ul
      expect(body.date).to.match(/^\d{4}-\d{2}-\d{2}$/);
    });

    // Verificăm banner-ul de succes
    cy.get(".message-success").should(
      "contain",
      "Lecția de recuperare a fost programată cu succes!",
    );
  });
});
