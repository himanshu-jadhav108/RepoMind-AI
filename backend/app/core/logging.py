import json
import logging
import sys
from typing import Any, Dict, Optional


class JSONFormatter(logging.Formatter):
    """
    Structured JSON log formatter compliant with RULES.md
    """

    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Contextual fields
        for field in ["run_id", "agent_name", "provider", "latency_ms", "tokens_used"]:
            if hasattr(record, field):
                log_data[field] = getattr(record, field)

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)


def setup_logger(name: str = "repomind") -> logging.Logger:
    logger_inst = logging.getLogger(name)
    logger_inst.setLevel(logging.INFO)

    if not logger_inst.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger_inst.addHandler(handler)
        logger_inst.propagate = False

    return logger_inst


logger = setup_logger()


def log_agent_event(
    event_type: str,
    agent_name: str,
    run_id: str,
    message: str,
    extra: Optional[Dict[str, Any]] = None,
) -> None:
    """Helper for structured logging at agent boundaries (start, complete, failure)"""
    context = {"run_id": run_id, "agent_name": agent_name, "event_type": event_type}
    if extra:
        context.update(extra)
    logger.info(f"[Agent {agent_name}] [{event_type.upper()}] {message}", extra=context)


def log_provider_call(
    provider_name: str,
    run_id: Optional[str],
    agent_name: Optional[str],
    latency_ms: float,
    success: bool,
    tokens_used: int = 0,
    error: Optional[str] = None,
) -> None:
    """Helper for structured logging of every provider invocation"""
    context = {
        "provider": provider_name,
        "latency_ms": latency_ms,
        "tokens_used": tokens_used,
        "success": success,
    }
    if run_id:
        context["run_id"] = run_id
    if agent_name:
        context["agent_name"] = agent_name

    msg = f"[Provider {provider_name}] {'SUCCESS' if success else 'FAILED'} ({latency_ms:.2f}ms)"
    if error:
        msg += f" - {error}"

    if success:
        logger.info(msg, extra=context)
    else:
        logger.warning(msg, extra=context)
