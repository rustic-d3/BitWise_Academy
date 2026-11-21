from django.db import models


class TestResult(models.Model):
    """A child's answers to a lesson's quiz. One result per child per lesson."""

    lesson = models.ForeignKey(
        "classrooms.Lesson", on_delete=models.CASCADE, related_name="test_results"
    )
    child = models.ForeignKey(
        "accounts.ChildProfile", on_delete=models.CASCADE, related_name="test_results"
    )
    child_answer = models.JSONField(default=dict)  # {"<question index>": "<chosen option>"}
    score = models.FloatField(null=True, blank=True)  # percentage, 0-100
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Test Result"
        verbose_name_plural = "Test Results"
        constraints = [
            models.UniqueConstraint(fields=["lesson", "child"], name="one_result_per_child")
        ]

    def __str__(self):
        return f"Rezultat {self.child.full_name} - Lecția {self.lesson_id} - Scor: {self.score}%"
