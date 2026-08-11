import asyncio
from typing import Dict, List, Optional

from app.core.config import settings
from app.core.logging import logger


class AnalysisConcurrencyManager:
    """
    Manages analysis run execution concurrency and FIFO queueing.
    Constrains active pipeline executions on resource-constrained free hosts (e.g. Render 512MB RAM / 0.1 CPU).
    """

    def __init__(self, max_concurrent: int = 1, max_queued: int = 5):
        self.max_concurrent = max_concurrent
        self.max_queued = max_queued
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._active_runs: set = set()
        self._queue: List[str] = []
        self._run_meta: Dict[str, Dict] = {}

    def get_queue_depth(self) -> int:
        return len(self._queue)

    def is_queue_full(self) -> bool:
        return len(self._queue) >= self.max_queued

    def register_run(self, run_id: str) -> Dict:
        """
        Registers a new run. If execution concurrency slot is free, marks as 'running'.
        Otherwise queues the run and assigns a 1-based queue position.
        Raises ValueError if queue is full.
        """
        if self._semaphore.locked() or len(self._queue) > 0:
            if len(self._queue) >= self.max_queued:
                raise ValueError(
                    f"Too many analysis runs queued right now ({len(self._queue)} queued). "
                    f"To keep our free-tier service available, please try again in a few minutes."
                )
            self._queue.append(run_id)
            pos = len(self._queue)
            info = {
                "status": "queued",
                "queue_position": pos,
                "message": f"Waiting for another analysis to finish (Position {pos} in queue).",
            }
            self._run_meta[run_id] = info
            logger.info(f"Enqueued run '{run_id}' at queue position {pos}")
            return info
        else:
            info = {"status": "running", "queue_position": 0, "message": "Analysis running."}
            self._run_meta[run_id] = info
            return info

    async def acquire_execution_slot(self, run_id: str):
        """
        Acquires the concurrency semaphore. Blocks if another run is executing.
        Updates queue positions for remaining queued runs when entering.
        """
        await self._semaphore.acquire()

        # Remove from queue if it was queued
        if run_id in self._queue:
            self._queue.remove(run_id)
            # Recalculate positions for remaining queued runs
            for idx, q_id in enumerate(self._queue, start=1):
                if q_id in self._run_meta:
                    self._run_meta[q_id]["queue_position"] = idx
                    self._run_meta[q_id]["message"] = f"Waiting for another analysis to finish (Position {idx} in queue)."

        self._active_runs.add(run_id)
        self._run_meta[run_id] = {"status": "running", "queue_position": 0, "message": "Analysis running."}
        logger.info(f"Acquired execution slot for run '{run_id}'")

    def release_execution_slot(self, run_id: str):
        """
        Releases the execution slot reliably.
        """
        self._active_runs.discard(run_id)
        self._run_meta.pop(run_id, None)
        try:
            self._semaphore.release()
            logger.info(f"Released execution slot for run '{run_id}'")
        except ValueError:
            pass

    def get_run_status_info(self, run_id: str) -> Optional[Dict]:
        return self._run_meta.get(run_id)


analysis_concurrency_manager = AnalysisConcurrencyManager(
    max_concurrent=getattr(settings, "MAX_CONCURRENT_ANALYSIS_RUNS", 1),
    max_queued=getattr(settings, "MAX_QUEUED_RUNS", 5),
)
