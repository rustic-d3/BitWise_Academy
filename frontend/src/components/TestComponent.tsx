import { useState, useEffect } from "react";
import api from "../api";
import "../styles/test.scss";

interface Question {
  id: number;
  question: string;
  options: string[];
}

interface Test {
  questions: Question[];
}

interface Props {
  lessonId?: string | number;
  userRole: string;
  childId?: number;
  onSubmit?: (score: number, total: number) => void;
  closeTest?: () => void;
}

const QUESTIONS_PER_PAGE = 2;

export default function TestComponent({
  lessonId,
  userRole,
  childId,
  onSubmit,
  closeTest,
}: Props) {
  const [testData, setTestData] = useState<Test | null>(null);
  const [loadingTest, setLoadingTest] = useState(true);

  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(
    null,
  );
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  //  Ce va vedea profesorul lecției.
  if (userRole === "teacher") {
    return (
      <div className="test-wrapper teacher-waiting-screen">
        <div className="test-header">
          <h2 className="test-title">Test în desfășurare</h2>
        </div>
        <div
          className="teacher-waiting-screen-info"
          style={{ textAlign: "center", padding: "40px", color: "white" }}
        >
          <h1 style={{ fontSize: "40px", margin: "20px 0" }}></h1>
          <h3>Elevii susțin testul în acest moment.</h3>
          <p>Așteptăm ca ei să termine și să trimită răspunsurile.</p>
          <button
            className="btn--primary"
            onClick={closeTest}
            style={{ marginTop: "30px" }}
          >
            Întoarce-te la tabla interactivă!
          </button>
        </div>
      </div>
      // Mai tarziu sa adaug, ca profesorul sa vada cine a dat submit la test
    );
  }

  useEffect(() => {
    if (userRole === "teacher" || !lessonId) return;

    const fetchTest = async () => {
      try {
        const response = await api.get(
          `/api/lessons/${lessonId}/test-questions/`,
        );

        // Backend-ul returnează array-ul de obiecte generat de AI
        const rawQuestions = response.data.test_data;

        // Se mapeaza ca să aibă un `id` necesar pentru logica de UI
        const formattedQuestions: Question[] = rawQuestions.map(
          (q: any, index: number) => ({
            id: index,
            question: q.question,
            options: q.options,
          }),
        );

        setTestData({ questions: formattedQuestions });
      } catch (err) {
        console.error("Eroare la încărcarea testului:", err);
      } finally {
        setLoadingTest(false);
      }
    };

    fetchTest();
  }, [lessonId, userRole]);

  // STĂRI DE ÎNCĂRCARE

  if (loadingTest) {
    return (
      <div style={{ color: "white", padding: "20px" }}>
        Se descarcă subiectele...
      </div>
    );
  }

  if (!testData || testData.questions.length === 0) {
    return (
      <div style={{ color: "white", padding: "20px" }}>
        Eroare: Testul nu a putut fi încărcat.
      </div>
    );
  }

  // LOGICA PENTRU FORMULARUL DE TEST

  const total = testData.questions.length;
  const totalPages = Math.ceil(total / QUESTIONS_PER_PAGE);
  const isLastPage = page === totalPages - 1;

  const pageQuestions = testData.questions.slice(
    page * QUESTIONS_PER_PAGE,
    page * QUESTIONS_PER_PAGE + QUESTIONS_PER_PAGE,
  );

  const pageAnswered = pageQuestions.every((q) => answers[q.id] !== undefined);
  const allAnswered = testData.questions.every(
    (q) => answers[q.id] !== undefined,
  );

  const handleSelect = (questionId: number, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleNext = () => {
    if (!isLastPage) setPage((p) => p + 1);
  };

  const handleSubmit = async () => {
    if (!childId) {
      alert("Eroare: Nu s-a putut identifica elevul.");
      return;
    }

    setLoadingSubmit(true);
    try {
      // Trimitem la backend exact formatul pe care l-am setat în SubmitTestView / Serializer
      const res = await api.post(`/api/lessons/${lessonId}/submit-test/`, {
        child_id: childId,
        answers: answers,
      });

      setResult({
        score: res.data.correct_answers,
        total: res.data.total_questions,
      });

      setSubmitted(true);
      onSubmit?.(res.data.score, res.data.total_questions);
    } catch (err) {
      console.error("Eroare la trimiterea testului:", err);
      alert("A apărut o problemă la trimiterea testului.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  // ECRANUL DE REZULTAT FINAL PENTRU ELEV
  if (submitted && result) {
    const percent = result.score;
    return (
      <div className="test-result">
        <div className="result-circle">
          <span className="result-score">{result.score}</span>
          <span className="result-divider">/</span>
          <span className="result-total">{result.total}</span>
        </div>
        <h2 className="result-title">
          {percent >= 80
            ? "Excelent!"
            : percent >= 50
              ? "Bine! Continuă să înveți."
              : "Mai exersează!"}
        </h2>
        <p className="result-percent">{percent}% răspunsuri corecte</p>
        <button
          className="btn--primary"
          onClick={closeTest}
          style={{ marginTop: "30px" }}
        >
          Întoarce-te la lecție
        </button>
      </div>
    );
  }

  // RENDER PENTRU FORMULAR

  return (
    <div className="test-wrapper">
      <div className="test-header">
        <h2 className="test-title">Test</h2>
        <div className="test-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((page + 1) / totalPages) * 100}%` }}
            />
          </div>
          <span className="progress-label">
            {page + 1} / {totalPages}
          </span>
        </div>
      </div>

      <div className="questions-list">
        {pageQuestions.map((question, i) => {
          const globalIndex = page * QUESTIONS_PER_PAGE + i;
          return (
            <div key={question.id} className="question-card">
              <p className="question-number">Întrebarea {globalIndex + 1}</p>
              <p className="question-text">{question.question}</p>
              <div className="options-list">
                {question.options.map((opt, optI) => {
                  const letters = ["A", "B", "C", "D"];
                  const isSelected = answers[question.id] === opt;
                  return (
                    <button
                      key={opt}
                      className={`option-btn ${isSelected ? "option-btn--selected" : ""}`}
                      onClick={() => handleSelect(question.id, opt)}
                    >
                      <span className="option-letter">{letters[optI]}</span>
                      <span className="option-text">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="test-footer">
        <span className="answered-count">
          {Object.keys(answers).length} / {total} răspunse
        </span>
        <div className="test-actions">
          {!isLastPage ? (
            <button
              className="btn--primary"
              onClick={handleNext}
              disabled={!pageAnswered}
            >
              Următoarea
            </button>
          ) : (
            <button
              className="btn--primary"
              onClick={handleSubmit}
              disabled={!allAnswered || loadingSubmit}
            >
              {loadingSubmit ? "Se trimite..." : "Trimite"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
