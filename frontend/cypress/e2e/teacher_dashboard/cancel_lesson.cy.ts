describe("Fluxul Profesorului - Anulare Lecție (teacher_dashboard)", () => {
  beforeEach(() => {
    // 1. Logăm profesorul
    cy.login("wanessa_grati", "Wanessa1@mail.com");

    // 2. Interceptăm apelul GET care aduce lecțiile pentru starea inițială
    cy.intercept({ method: "GET", pathname: "/api/teacher/get_lessons/" }, {
      statusCode: 200,
      body: {
        results: [
          {
            id: 1,
            date_time: "2026-07-10T10:00:00Z", // Lecția 1 (Va fi anulată)
            is_makeup: false,
            classroom: {
              titlu: "Clasa de Robotică - Grupa A",
              classroom_type: "Standard",
              students: [{ id: 101, full_name: "Elev Test 1" }]
            }
          },
          {
            id: 2,
            date_time: "2026-07-17T10:00:00Z", // Lecția 2
            is_makeup: false,
            classroom: {
              titlu: "Clasa de Robotică - Grupa A",
              classroom_type: "Standard",
              students: [{ id: 101, full_name: "Elev Test 1" }]
            }
          }
        ]
      }
    }).as("getInitialLessons");

    // 3. Vizităm dashboard-ul
    cy.visit("/dashboard");
    
    // 4. Așteptăm să se încarce lista inițială de lecții
    cy.wait("@getInitialLessons");
  });

  it("1. Ar trebui să anuleze o lecție cu succes și să o elimine din listă", () => {
    // Verificăm starea inițială din UI (Avem 2 lecții randate)
    cy.get('.session-container').should('have.length', 2);
    cy.get('.session-container').first().should('contain', '10 iul.');

    // 5. Interceptăm request-ul de DELETE
    cy.intercept("DELETE", "**/api/lessons/*/cancel-lesson*", {
      statusCode: 200,
      delay: 500
    }).as("cancelLessonRequest");

    // 6. Găsim butonul de anulare din prima lecție și dăm click
    cy.get('.session-container').first().find('button').contains('Anulare Lecție').click();

    // 7. Așteptăm finalizarea request-ului de ștergere
    cy.wait("@cancelLessonRequest");

    // 8. Verificăm noul rezultat vizual (Efectul de UI)
    // Deoarece React a șters local lecția anulată, trebuie să rămână doar 1 element
    cy.get('.session-container').should('have.length', 1);
    
    // Ne asigurăm că lecția care a rămas este cea din 17 iulie
    cy.get('.session-container').first().should('contain', '17 iul.');
  });
});