describe("Fluxul de Actualizare Profil (common_tests)", () => {
  beforeEach(() => {
    // 1. Logăm utilizatorul (folosim un cont de profesor pentru a vedea și câmpul 'description')
    cy.login("wanessa_grati", "Wanessa1@mail.com");

    // 2. Interceptăm apelul inițial care aduce datele profilului pentru profesor
    cy.intercept("GET", "**/api/teacher/profile", {
      statusCode: 200,
      body: {
        email: "Wanessa1@mail.com",
        phone_number: "+40700000000",
        description: "Profesor de informatică",
        profile_picture: null
      }
    }).as("getTeacherProfile");

    // 3. Vizităm pagina de setări ale profilului
    cy.visit("/profile-settings");
    cy.wait("@getTeacherProfile");
  });

  // ==========================================
  // SCENARIUL 1: Salvarea cu succes a datelor
  // ==========================================
  it("1. Ar trebui să permită modificarea datelor și să afișeze mesaj de succes", () => {
    // Interceptăm request-ul PATCH de salvare
    cy.intercept("PATCH", "**/api/teacher/profile-settings", {
      statusCode: 200,
    }).as("updateProfile");

    // Modificăm email-ul folosind selectorul tău data-cy
    cy.get('[data-cy="profile-email-field"]').clear().type("wanessa_nou@mail.com");

    // Modificăm numărul de telefon
    // Componenta ta adaugă automat '+40' dacă începe cu '07', așa că testăm această logică
    cy.get('input[name="phone_number"]').clear().type("0711223344");

    // Modificăm descrierea (Bio)
    cy.get('textarea[name="description"]').clear().type("Descriere actualizată");

    // Apăsăm butonul de salvare
    cy.get('[data-cy="save-button"]').click();

    // Așteptăm request-ul și verificăm dacă datele au fost trimise corect
    cy.wait("@updateProfile").then((interception) => {
      // Deoarece folosești FormData (multipart/form-data), nu putem verifica direct JSON-ul ușor
      // Ne asigurăm că metoda a fost chemată corect către endpoint-ul de profesor
      expect(interception.request.method).to.eq('PATCH');
      expect(interception.request.url).to.include('/api/teacher/profile-settings');
    });

    // Verificăm dacă mesajul de succes apare în UI
    cy.get('[data-cy="reset-message"]')
      .should("be.visible")
      .and("have.class", "profile-message--success")
      .and("contain", "Profilul a fost actualizat cu succes!");
  });

  // ==========================================
  // SCENARIUL 2: Validare format telefon
  // ==========================================
  it("2. Ar trebui să blocheze salvarea dacă numărul de telefon este invalid", () => {
    // Tastăm un număr incomplet (mai puțin de 9 cifre după +40)
    cy.get('input[name="phone_number"]').clear().type("071234");
    
    // Apăsăm pe butonul de salvare
    cy.get('[data-cy="save-button"]').click();

    // Verificăm dacă mesajul de eroare din UI este generat corect (din frontend, fără request la API)
    cy.get('[data-cy="reset-message"]')
      .should("be.visible")
      .and("have.class", "profile-message--error")
      .and("contain", "Numărul de telefon trebuie să fie în formatul corect: +407XXXXXXXX");
  });

  // ==========================================
  // SCENARIUL 3: Resetare parolă
  // ==========================================
  it("3. Ar trebui să poată cere link de resetare a parolei", () => {
    // Interceptăm request-ul POST și îi adăugăm un DELAY de 1 secundă
    // pentru a prinde vizual starea de "Se trimite..." a butonului
    cy.intercept("POST", "**/api/password-reset/", {
      statusCode: 200,
      body: { detail: "Email sent." },
      delay: 1000
    }).as("resetPassword");

    // Verificăm că email-ul este deja completat din datele inițiale
    cy.get('[data-cy="profile-email-field"]').should("have.value", "Wanessa1@mail.com");

    // Apăsăm butonul de trimitere link
    cy.get('[data-cy="reset-submit-button"]').click();

    // Pe durata request-ului (care acum durează cel puțin 1000ms), butonul ar trebui să afișeze "Se trimite..."
    cy.get('[data-cy="reset-submit-button"]')
      .should("contain", "Se trimite...")
      .and("be.disabled");

    // Așteptăm interceptarea
    cy.wait("@resetPassword").then((interception) => {
      // Verificăm dacă body-ul a conținut email-ul din form
      expect(interception.request.body.email).to.eq("Wanessa1@mail.com");
    });

    // Verificăm apariția mesajului de succes specific resetării
    cy.get('[data-cy="reset-message"]')
      .should("be.visible")
      .and("have.class", "profile-message--success")
      .and("contain", "Link-ul pentru resetarea parolei a fost trimis pe email!");
  });
});