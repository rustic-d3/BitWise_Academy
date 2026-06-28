describe("Fluxul Classroom - Evaluare cu Teste generate de AI", () => {
  const lessonId = 123;

  describe("Perspectiva Profesorului: Pornirea Testului", () => {
    beforeEach(() => {
      // ⚠️ Folosește un cont de PROFESOR real din baza ta de date locală
      cy.login("wanessa_grati", "Wanessa1@mail.com");

      // Mock pentru intrarea în clasă
      cy.intercept("GET", `**/api/lessons/${lessonId}/join/`, {
        statusCode: 200,
        body: {
          agora_data: { uid: 777, teacherUid: 777 },
          date_time: new Date().toISOString(),
        },
      }).as("joinLesson");

      cy.visit(`/classroom/${lessonId}`);
      cy.wait("@joinLesson");
    });

    it("1. Ar trebui să poată apăsa butonul de 'Începe Testul' și să declanșeze request-ul", () => {
      // Interceptăm request-ul de start test
      cy.intercept("POST", `**/api/lessons/${lessonId}/start-test/`, {
        statusCode: 200,
        body: { message: "Testul a început cu succes." },
      }).as("startTestRequest");

      // Verificăm că butonul există și dăm click
      cy.contains("button", "Începe Testul").should("exist").click();

      // Validăm că aplicația a trimis request-ul către backend
      cy.wait("@startTestRequest").its("response.statusCode").should("eq", 200);

      // Verificăm că UI-ul s-a schimbat și profesorul vede ecranul de așteptare
      cy.get(".teacher-waiting-screen").should("exist");
      cy.contains("Elevii susțin testul în acest moment.").should("exist");
    });
  });

  describe("Perspectiva Elevului: Completarea Testului", () => {
    const childId = 101;

    beforeEach(() => {
      // ⚠️ Folosește un cont de PĂRINTE / ELEV real din baza ta de date locală
      cy.login("parent1", "Parent1@mail.com");

      // Mock pentru intrarea în clasă
      cy.intercept("GET", `**/api/lessons/${lessonId}/join/`, {
        statusCode: 200,
        body: {
          agora_data: { uid: 999, teacherUid: 777 },
          date_time: new Date().toISOString(),
        },
      }).as("joinLesson");

      // MOCK CRITIC: Simulăm că profesorul a activat deja testul
      cy.intercept("GET", `**/api/lessons/${lessonId}/test-status/`, {
        statusCode: 200,
        body: { is_test_active: true },
      }).as("checkTestStatus");

      // MOCK pentru datele testului generat de AI (3 întrebări)
      cy.intercept("GET", `**/api/lessons/${lessonId}/test-questions/`, {
        statusCode: 200,
        body: {
          test_data: [
            { question: "Întrebarea 1", options: ["R1A", "R1B", "R1C", "R1D"] },
            { question: "Întrebarea 2", options: ["R2A", "R2B", "R2C", "R2D"] },
            { question: "Întrebarea 3", options: ["R3A", "R3B", "R3C", "R3D"] },
          ],
        },
      }).as("getTestQuestions");

      // Folosim onBeforeLoad pentru a injecta state-ul în React Router fără a declanșa eroarea TS
      cy.visit(`/classroom/${lessonId}`, {
        onBeforeLoad: (win) => {
          win.history.pushState(
            { usr: { childId: childId, childName: "Copil Test" } },
            "",
            `/classroom/${lessonId}`,
          );
        },
      });

      cy.wait("@joinLesson");
    });

    it("2. Ar trebui să completeze testul pe mai multe pagini și să îl trimită", () => {
      // 1. Așteptăm request-urile simulate
      cy.wait("@checkTestStatus");
      cy.wait("@getTestQuestions");

      // 2. Componenta TestComponent ar trebui să fie vizibilă
      cy.get(".test-wrapper").should("exist");

      // 3. Verificăm progresul inițial (Pagina 1/2)
      cy.contains(".progress-label", "1 / 2").should("exist");
      cy.contains("button", "Următoarea").should("be.disabled");

      // --- REZOLVAREA PAGINII 1 (Întrebările 1 și 2) ---

      cy.contains(".question-card", "Întrebarea 1")
        .find(".option-btn")
        .first()
        .click({ force: true });

      cy.contains(".question-card", "Întrebarea 2")
        .find(".option-btn")
        .first()
        .click({ force: true });

      // Verificăm contorul de răspunsuri din subsol
      cy.contains(".answered-count", "2 / 3 răspunse").should("exist");

      // Butonul ar trebui să devină activ
      cy.contains("button", "Următoarea")
        .should("not.be.disabled")
        .click({ force: true });

      // --- REZOLVAREA PAGINII 2 (Întrebarea 3) ---

      // Verificăm că s-a schimbat pagina (Pagina 2/2)
      cy.contains(".progress-label", "2 / 2").should("exist");
      cy.contains("button", "Trimite").should("be.disabled");

      // Selectăm o opțiune la Întrebarea 3
      cy.contains(".question-card", "Întrebarea 3")
        .find(".option-btn")
        .last()
        .click({ force: true });

      // --- TRIMITEREA TESTULUI ---

      // Interceptăm request-ul final de trimitere cu delay pentru a prinde starea de loading
      cy.intercept("POST", `**/api/lessons/${lessonId}/submit-test/`, {
        statusCode: 200,
        body: { correct_answers: 3, total_questions: 3, score: 100 },
        delay: 500,
      }).as("submitTest");

      // Apăsăm butonul Trimite
      cy.contains("button", "Trimite")
        .should("not.be.disabled")
        .click({ force: true });

      // Verificăm starea de loading
      cy.contains("button", "Se trimite...").should("exist");

      // Așteptăm request-ul și validăm datele trimise
      cy.wait("@submitTest").then((interception) => {
        expect(interception.request.body.child_id).to.eq(childId);
      });

      // --- VERIFICARE ECRAN DE REZULTAT FINAL ---
      cy.get(".test-result").should("exist");
      cy.contains(".result-title", "Excelent!").should("exist");
      cy.contains(".result-percent", "100% răspunsuri corecte").should("exist");
      cy.contains("button", "Întoarce-te la lecție")
        .should("exist")
        .click({ force: true });
    });
  });
});
