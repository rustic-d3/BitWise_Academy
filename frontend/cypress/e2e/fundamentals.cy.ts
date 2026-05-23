describe("template spec", () => {
  it("test_header", () => {
    cy.visit("http://localhost:5173/dashboard");
    cy.get("[test_atribute='test']").should("contain.text", "Bine ai venit!");
  });
});
