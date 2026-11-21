"""Quiz generation (Gemini) and grading.

A quiz is a list of questions:
    [{"question": str, "options": [str, str, str, str], "correct_answer": str}, ...]
Answers are a dict from question index (as a string) to the chosen option.
"""

from dataclasses import dataclass
import json

from core import gemini

QUESTION_COUNT = 10
MATERIAL_CHAR_LIMIT = 10_000

QUIZ_PROMPT = """
Analizează următorul text dintr-un material didactic și generează un test grilă cu {count} întrebări.
Răspunsul tău trebuie să fie EXCLUSIV un cod JSON valid, fără alte explicații.
Formatul JSON trebuie să fie o listă de obiecte cu structura:
[
  {{
    "question": "textul întrebării",
    "options": ["varianta A", "varianta B", "varianta C", "varianta D"],
    "correct_answer": "varianta exactă din listă"
  }}
]
Limba în care generezi testul trebuie să fie în conformitate cu limba din datele de intrare.

Text: {material}
"""


class InvalidQuizError(ValueError):
    """The model's answer was not a usable quiz."""


def parse_quiz(raw_text: str) -> list[dict]:
    cleaned = raw_text.replace("```json", "").replace("```", "").strip()
    try:
        quiz = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise InvalidQuizError("AI-ul a returnat un format invalid.") from exc

    is_valid = isinstance(quiz, list) and all(
        isinstance(q, dict) and {"question", "options", "correct_answer"} <= q.keys()
        for q in quiz
    )
    if not is_valid:
        raise InvalidQuizError("AI-ul a returnat un format invalid.")
    return quiz


def generate_quiz(material_text: str) -> list[dict]:
    prompt = QUIZ_PROMPT.format(
        count=QUESTION_COUNT, material=material_text[:MATERIAL_CHAR_LIMIT]
    )
    return parse_quiz(gemini.generate_text(prompt))


@dataclass(frozen=True)
class Mistake:
    question: str
    correct_answer: str
    given_answer: str


@dataclass(frozen=True)
class Grade:
    correct: int
    total: int
    mistakes: list[Mistake]

    @property
    def score(self) -> float:
        return (self.correct / self.total) * 100 if self.total else 0


def grade(quiz: list[dict], answers: dict) -> Grade:
    correct, mistakes = 0, []
    for key, answer in answers.items():
        try:
            index = int(key)
        except (TypeError, ValueError):
            continue
        if not 0 <= index < len(quiz):
            continue

        question = quiz[index]
        if answer == question.get("correct_answer"):
            correct += 1
        else:
            mistakes.append(
                Mistake(question.get("question"), question.get("correct_answer"), answer)
            )
    return Grade(correct=correct, total=len(quiz), mistakes=mistakes)
