describe("Fluxul Profesorului - Încheiere Oră (Classroom)", () => {
  const lessonId = "123"; // ID-ul lecției de test

  beforeEach(() => {
    // 1. Logăm profesorul
    cy.login("wanessa_grati", "Wanessa1@mail.com");

    // 2. Interceptăm apelul de inițializare a clasei
    cy.intercept("GET", `**/api/lessons/${lessonId}/join/`, {
      statusCode: 200,
      body: {
        agora_data: {
          uid: 1,
          participants: {},
          whiteboard: null
        },
        date_time: "2026-07-02T18:00:00Z"
      }
    }).as("joinLesson");

    // 3. Vizităm pagina clasei
    cy.visit(`/classroom/${lessonId}`);
    cy.wait("@joinLesson");
  });

  it("Ar trebui să trimită rapoartele către părinți la confirmarea încheierii orei", () => {
    // 1. Interceptăm request-ul care trimite rapoartele
    cy.intercept("POST", `**/api/lessons/${lessonId}/end-and-report/`, {
      statusCode: 200,
      body: { message: "Ora a fost încheiată și rapoartele au fost trimise." }
    }).as("endAndReportRequest");

    // 2. Găsim și apăsăm butonul "Încheie lecția"
    cy.contains("button", "Încheie lecția").click();

    // 3. Verificăm dacă apare modalul
    cy.contains("Esti sigur ca vrei să închizi ora?").should("be.visible");

    // 4. Apăsăm butonul de confirmare din interiorul modalului
    // AICI TREBUIE SĂ MODIFICI: Înlocuiește "Da" cu textul exact care apare pe butonul tău!
    cy.contains("button", "Da").click(); 

    // 5. Așteptăm request-ul de backend pentru a verifica dacă s-a trimis
    cy.wait("@endAndReportRequest").then((interception) => {
      // Validăm că request-ul a fost trimis către endpoint-ul corect
      expect(interception.request.method).to.eq("POST");
      expect(interception.request.url).to.include(`/api/lessons/${lessonId}/end-and-report/`);
    });

    // 6. Optional: Verificăm că modalul a dispărut
    cy.contains("Esti sigur ca vrei să închizi ora?").should("not.exist");
  });
});