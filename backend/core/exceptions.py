from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    """DRF's handler, plus an `error` key next to `detail`.

    The frontend reads `response.data.error`, so 401/403/404 responses raised by
    DRF itself (permissions, get_object_or_404) show a message too.
    """
    response = exception_handler(exc, context)
    if response is not None and isinstance(response.data, dict):
        if "detail" in response.data and "error" not in response.data:
            response.data["error"] = response.data["detail"]
    return response
