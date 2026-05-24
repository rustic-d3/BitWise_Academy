describe("Fluxul Profesorului - Formularul de Disponibilitate", () => {
  beforeEach(() => {
    cy.login("wanessa_grati", "Wanessa1@mail.com");

    // Simulăm un profil fără orar setat inițial
    cy.intercept("GET", "**/api/teacher/profile", {
      statusCode: 200,
      body: {
        id: 1,
        availabilities: [],
      },
    }).as("getEmptyProfile");

    cy.visit("/set-schedule");
    cy.wait("@getEmptyProfile");
  });

  it("1. Ar trebui să randeze toate cele 7 zile ale săptămânii inițial", () => {
    cy.get(".schedule-row").should("have.length", 7);

    // Verificăm că prima zi e Luni și ultima e Duminică
    cy.get(".day-square").first().should("contain", "Luni");
    cy.get(".day-square").last().should("contain", "Duminică");
  });

  it("2. Ar trebui să blocheze salvarea dacă ora de start e după ora de end", () => {
    // Selectăm primul input de timp (startTime de Luni) și punem 15:00
    cy.get(".time-input").eq(0).type("15:00");

    // Selectăm al doilea input de timp (endTime de Luni) și punem 12:00 (Gresit)
    cy.get(".time-input").eq(1).type("12:00");

    cy.get(".btn--primary").contains("Salvează").click();

    // Trebuie să apară eroarea setată de noi mai sus
    cy.contains(
      "Eroare la ziua de Luni: Ora de început trebuie să fie înaintea orei de sfârșit!",
    ).should("be.visible");
  });

  it("3. Ar trebui să poată adăuga și șterge rânduri suplimentare pentru o zi", () => {
    // Apăsăm butonul de + (Add) de pe primul rând (Luni)
    cy.get('button[aria-label="Add"]').first().click();

    // Acum ar trebui să avem 8 rânduri în total
    cy.get(".schedule-row").should("have.length", 8);

    // Ar trebui să avem două div-uri cu "Luni"
    cy.get(".day-square").filter(':contains("Luni")').should("have.length", 2);

    // Acum testăm ștergerea rândului abia adăugat (butonul cu minus/remove de pe al doilea rând)
    cy.get('button[aria-label="Remove"]').eq(1).click();

    // Ar trebui să revenim la 7 rânduri
    cy.get(".schedule-row").should("have.length", 7);
  });

  it("4. Ar trebui să salveze doar intervalele completate corect", () => {
    cy.intercept("POST", "**/api/teacher/schedule/", {
      statusCode: 200,
      body: { message: "Succes!" },
    }).as("saveSchedule");

    // Completăm Luni: 09:00 - 13:00
    cy.get(".time-input").eq(0).type("09:00");
    cy.get(".time-input").eq(1).type("13:00");

    // Lăsăm Marți gol (index 2 și 3)

    // Completăm Miercuri: 14:00 - 16:00 (index 4 și 5)
    cy.get(".time-input").eq(4).type("14:00");
    cy.get(".time-input").eq(5).type("16:00");

    cy.get(".btn--primary").contains("Salvează").click();

    // Verificăm ce se trimite efectiv către backend
    cy.wait("@saveSchedule").then((interception) => {
      const sentSchedule = interception.request.body.schedule;

      // Ar trebui să trimită doar 2 intervale (Luni și Miercuri)
      expect(sentSchedule.length).to.eq(2);

      // Verificăm datele trimise
      expect(sentSchedule[0].day).to.eq("Luni");
      expect(sentSchedule[0].startTime).to.eq("09:00");
      expect(sentSchedule[1].day).to.eq("Miercuri");
      expect(sentSchedule[1].endTime).to.eq("16:00");
    });

    // Verificăm mesajul de succes
    cy.contains("Succes!").should("be.visible"); // Sau "Programul a fost salvat cu succes!"
  });
});
