describe("Fluxul Părintelui - Utilizare Asistent Glitch AI", () => {
  const childId = 101;
  const lessonId = 301;

  beforeEach(() => {
    cy.login("parent1", "Parent1@mail.com");

    // 1. Mock profil părinte
    cy.intercept("GET", "**/api/parent/profile", {
      statusCode: 200,
      body: {
        children: [{ id: childId, full_name: "Copil Test", credits: 5 }],
      },
    }).as("getParentProfile");

    // 2. Mock date statice copil
    cy.intercept("GET", `**/api/child/${childId}/`, {
      statusCode: 200,
      body: {
        classroom: {
          id: 201,
          titlu: "Clasa de Programare Python",
          classroom_type: "Grupă",
          teacher: { full_name: "Profesor Test" },
          students: [{ id: childId, full_name: "Copil Test" }],
        },
      },
    }).as("getChildStaticData");

    // 3. Mock lecții paginate pentru a randa componenta ClassSession
    cy.intercept("GET", `**/api/child/${childId}/lessons/?page=1`, {
      statusCode: 200,
      body: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: lessonId,
            date_time: new Date(Date.now() + 86400000).toISOString(), // Mâine
            classroom: {
              titlu: "Clasa de Programare Python",
              classroom_type: "Grupă",
              students: [{ id: childId, full_name: "Copil Test" }],
            },
            skipped_by: [],
            is_makeup: false,
          },
        ],
      },
    }).as("getChildLessons");

    // 4. Vizităm Dashboard-ul (AICI se află butonul)
    cy.visit("/dashboard");
    cy.wait(["@getParentProfile", "@getChildStaticData", "@getChildLessons"]);
  });

  it("Ar trebui să poată deschide Glitch AI, să trimită o întrebare și să primească un răspuns", () => {
    // 1. Adăugăm un delay de 1000ms (1 secundă) ca să vedem starea de loading
    cy.intercept("POST", "**/api/glitch/chat/", {
      statusCode: 200,
      body: { reply: "Salut! Răspunsul meu automat pentru test." },
      delay: 1000, // <--- ACEASTA ESTE LINIA MAGICĂ
    }).as("glitchResponse");

    // ... restul codului rămâne exact la fel ...
    cy.contains("button", "Vorbește cu Glitch!").click();
    cy.get(".glitch-widget").should("be.visible");
    cy.get('input[placeholder="Întreabă-mă ceva..."]').type(
      "Cum rezolv această problemă?",
    );
    cy.contains("button", "Trimite").click();

    // 6. Acum Cypress va avea timp să vadă textul, pentru că request-ul "durează" o secundă
    cy.contains(".message.bot", "Glitch scrie...").should("be.visible");

    // 7. Așteptăm request-ul falsificat
    cy.wait("@glitchResponse");

    // 8. Validăm
    cy.get(".glitch-messages")
      .should("contain", "Cum rezolv această problemă?")
      .and("contain", "Salut! Răspunsul meu automat pentru test.");
  });

  it("Ar trebui să poată închide fereastra Glitch AI", () => {
    // Deschidem
    cy.contains("button", "Vorbește cu Glitch!").click();
    cy.get(".glitch-widget").should("be.visible");

    // Click pe 'x'
    cy.get(".close-btn").click();

    // Verificăm închiderea
    cy.get(".glitch-widget").should("not.exist");
  });
});
