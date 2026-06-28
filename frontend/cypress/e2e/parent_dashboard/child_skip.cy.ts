describe("Fluxul Părintelui - Dashboard și Skip Lecție", () => {
  const childId = 101;
  const lessonId = 301;

  beforeEach(() => {
    cy.login("parent1", "Parent1@mail.com");

    // 1. Interceptăm profilul părintelui (îi dăm un copil fals pentru test)
    cy.intercept("GET", "**/api/parent/profile", {
      statusCode: 200,
      body: {
        children: [
          {
            id: childId,
            full_name: "Copil Test",
            credits: 5,
          },
        ],
      },
    }).as("getParentProfile");

    // 2. Interceptăm datele statice ale copilului (clasa și profesorul)
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

    // 3. Interceptăm lista paginată de lecții (îi dăm o lecție pe care să dea skip)
    cy.intercept("GET", `**/api/child/${childId}/lessons/?page=1`, {
      statusCode: 200,
      body: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: lessonId,
            date_time: new Date(Date.now() + 86400000).toISOString(), // Setează lecția pentru mâine
            classroom: {
              titlu: "Clasa de Programare Python",
              classroom_type: "Grupă",
              students: [{ id: childId, full_name: "Copil Test" }],
            },
            skipped_by: [], // Copilul încă nu a dat skip
            is_makeup: false,
          },
        ],
      },
    }).as("getChildLessons");

    // 4. Navigăm către dashboard
    cy.visit("/dashboard");

    // 5. Așteptăm să se încarce toate request-urile mock-uite
    cy.wait(["@getParentProfile", "@getChildStaticData", "@getChildLessons"]);
  });

  it("Ar trebui să poată da skip la o lecție și aceasta să dispară din listă", () => {
    // 1. Interceptăm request-ul de skip ca să returneze succes
    cy.intercept("POST", `**/api/lessons/${lessonId}/skip/`, {
      statusCode: 200,
      body: { message: "Lecția a fost sărită cu succes." },
    }).as("skipLessonRequest");

    // 2. Ne asigurăm că lecția este afișată inițial pe ecran
    cy.get(".session-container").should("be.visible");
    cy.contains(".title-text", "Clasa de Programare Python").should(
      "be.visible",
    );

    // 3. Căutăm butonul de "Skip" și dăm click pe el
    cy.contains("button", "Skip").click();

    // 4. Verificăm că a apărut ConfirmModal
    cy.contains("Esti sigur ca vrei sa treci peste aceasta lectie?").should(
      "be.visible",
    );

    // 5. Apăsăm butonul de confirmare din interiorul modalului
    cy.get(".modal-box").contains("button", "Da").click();

    // 6. Verificăm că request-ul către backend s-a făcut corect și a trimis ID-ul copilului
    cy.wait("@skipLessonRequest").then((interception) => {
      expect(interception.request.body.child_id).to.eq(childId);
    });

    // 7. Verificăm că lecția a dispărut complet de pe ecran
    cy.get(".session-container").should("not.exist");

    // 8. Ne asigurăm că apare mesajul de listă goală (deoarece am șters singura lecție din listă)
    cy.contains("Nu există nicio lecție programată pe această pagină.").should(
      "be.visible",
    );
  });
});
