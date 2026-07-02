describe("Fluxul Profesorului - Generare Test Automat din PDF", () => {
  beforeEach(() => {
    // 1. Logăm profesorul cu datele furnizate
    cy.login("wanessa_grati", "Wanessa1@mail.com");

    // 2. Vizităm pagina unde se află componenta ClassSession. 
    // Înlocuiește '/teacher-dashboard' cu ruta ta reală.
    cy.visit("/dashboard");

    // 3. Interceptăm apelul de rețea care trimite PDF-ul către backend (Django/AI)
    // Folosim wildcard (*) pentru lessonId ca să funcționeze indiferent de lecția randată
    cy.intercept("POST", "**/api/lessons/*/upload-test/", {
      statusCode: 201, // Răspunsul așteptat în funcția handleUpload
      delay: 1000,     // Adăugăm un delay pentru a putea testa starea de "Se generează..."
    }).as("uploadPdfTest");
  });

  // ==========================================
  // SCENARIUL 1: Deschiderea Modalului
  // ==========================================
  it("1. Ar trebui să deschidă modalul cu titlul corect la apăsarea butonului 'Creare Test'", () => {
    // Găsim butonul pe baza textului din interiorul componentei ClassSession
    cy.contains("button", "Creare Test").click();

    // Verificăm dacă modalul s-a deschis și are titlul specific pentru test
    cy.get(".modal-box").should("be.visible");
    cy.get(".modal-title").should("contain", "Încarcă Test");
    cy.contains("Apasă pentru a selecta un fișier PDF").should("be.visible");
  });

  // ==========================================
  // SCENARIUL 2: Validare Tip Fișier
  // ==========================================
  it("2. Ar trebui să afișeze o eroare dacă se încearcă încărcarea unui fișier non-PDF", () => {
    cy.contains("button", "Creare Test").click();

    // Creăm un fișier fals de tip text
    // Notă: input-ul tău are style={{ display: "none" }}, deci Cypress are nevoie de { force: true }
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('acesta nu este un pdf valabil'),
      fileName: 'fisier_gresit.txt',
      mimeType: 'text/plain',
    }, { force: true });

    // Verificăm dacă state-ul de error s-a setat corect pe ecran
    cy.get(".upload-error").should("be.visible").and("contain", "Doar fișiere PDF sunt acceptate.");
    
    // Butonul de "Trimite" ar trebui să fie disabled, deoarece `file` a fost setat la null
    cy.contains("button", "Trimite").should("be.disabled");
  });

  // ==========================================
  // SCENARIUL 3: Fluxul Complet de Succes
  // ==========================================
  it("3. Ar trebui să proceseze materialul didactic, să genereze testul și să afișeze mesajul de succes", () => {
    cy.contains("button", "Creare Test").click();

    // Simulăm un material didactic PDF valid
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('simulare continut pdf didactic'),
      fileName: 'curs_algoritmi.pdf',
      mimeType: 'application/pdf',
    }, { force: true });

    // Eroarea ar trebui să dispară și numele fișierului să apară pe ecran
    cy.get(".upload-error").should("not.exist");
    cy.get(".file-name").should("contain", "curs_algoritmi.pdf");

    // Apăsăm pe butonul de trimitere (care acum nu mai e disabled)
    cy.contains("button", "Trimite").should("not.be.disabled").click();

    // Verificăm state-ul de loading (uploading === true)
    cy.contains("button", "Se generează...").should("be.disabled");

    // Așteptăm ca request-ul interceptat să se finalizeze
    cy.wait("@uploadPdfTest").then((interception) => {
      // Ne asigurăm că am trimis fișierul cu header-ul corect pentru fișiere binare
      expect(interception.request.headers['content-type']).to.include('multipart/form-data');
    });

    // Verificăm dacă interfața a trecut în "isSuccess = true" (componenta returnează ".success-screen")
    cy.get(".success-screen").should("be.visible");
    cy.get(".modal-title").should("contain", "Test Generat cu Succes!");
    cy.contains("Fișierul PDF a fost procesat, iar întrebările sunt gata pentru elevi.").should("be.visible");

    // La final, putem testa și butonul de închidere
    cy.contains("button", "Revino în Dashboard").click();
    cy.get(".modal-overlay").should("not.exist");
  });
});