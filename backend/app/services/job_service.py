"""Persistent AI job service for Guardian-Link.

This service manages AI processing jobs that survive web process restarts.
Jobs are stored in MongoDB and processed by an independent worker.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from bson import ObjectId
from pymongo import ASCENDING

from app.config import MATCH_THRESHOLD
from app.database import get_db
from app.utils import get_timestamp


async def create_ai_job(
    report_id: str,
    report_type: str,
    report_collection_name: str,
    max_attempts: int = 3,
) -> str:
    """Create a persistent AI job for a report."""
    db = get_db()
    
    job_doc = {
        "report_id": report_id,
        "report_type": report_type,
        "report_collection": report_collection_name,
        "status": "queued",
        "attempts": 0,
        "max_attempts": max_attempts,
        "created_at": get_timestamp(),
        "started_at": None,
        "completed_at": None,
        "last_error": None,
        "next_retry_at": None,
    }
    
    result = await db.ai_jobs.insert_one(job_doc)
    job_id = str(result.inserted_id)
    print(f"[AI_JOB_CREATED] job_id={job_id} report_id={report_id} report_type={report_type}")
    return job_id


async def claim_ai_job(timeout_seconds: int = 300) -> dict[str, Any] | None:
    """Atomically claim a queued AI job for processing.
    
    Also reclaims jobs stuck in 'processing' status for longer than timeout.
    """
    db = get_db()
    now = get_timestamp()
    timeout_timestamp = now - timedelta(seconds=timeout_seconds)
    
    print(f"[AI_JOB_CLAIM_QUERY] Starting job claim query...")
    
    # First, reclaim stuck jobs
    reclaim_result = await db.ai_jobs.update_many(
        {
            "status": "processing",
            "started_at": {"$lt": timeout_timestamp},
            "attempts": {"$lt": 3}
        },
        {
            "$set": {
                "status": "queued",
                "last_error": "Job timed out, requeued",
                "next_retry_at": None
            }
        }
    )
    if reclaim_result.modified_count > 0:
        print(f"[AI_JOB_RECLAIM] Reclaimed {reclaim_result.modified_count} stuck jobs")
    
    # Count queued jobs before claiming
    queued_count = await db.ai_jobs.count_documents({"status": "queued"})
    print(f"[AI_JOB_CLAIM_QUERY] Queued jobs count: {queued_count}")
    
    # Atomically claim a queued job
    job = await db.ai_jobs.find_one_and_update(
        {
            "status": "queued",
            "$or": [
                {"next_retry_at": None},
                {"next_retry_at": {"$lte": now}}
            ]
        },
        {
            "$set": {
                "status": "processing",
                "started_at": now
            },
            "$inc": {
                "attempts": 1
            }
        },
        return_document=True,
        sort=[("created_at", ASCENDING)]
    )
    
    if job:
        print(f"[AI_JOB_CLAIMED] job_id={str(job['_id'])} report_id={job['report_id']} attempt={job['attempts']}")
    else:
        print(f"[AI_JOB_CLAIM_NONE] No queued jobs available to claim")
    
    return job


async def update_job_success(job_id: str) -> None:
    """Mark a job as successfully completed."""
    db = get_db()
    now = get_timestamp()
    
    await db.ai_jobs.update_one(
        {"_id": ObjectId(job_id)},
        {
            "$set": {
                "status": "completed",
                "completed_at": now,
                "last_error": None,
                "next_retry_at": None
            }
        }
    )
    print(f"[AI_JOB_COMPLETE] job_id={job_id}")


async def update_job_failure(
    job_id: str,
    error: str,
    retry_delay_seconds: int = 30,
) -> None:
    """Mark a job as failed or schedule a retry."""
    db = get_db()
    job = await db.ai_jobs.find_one({"_id": ObjectId(job_id)})
    
    if not job:
        print(f"[AI_JOB_ERROR] job_id={job_id} error=job_not_found")
        return
    
    attempts = job.get("attempts", 0)
    max_attempts = job.get("max_attempts", 3)
    
    if attempts >= max_attempts:
        # Permanent failure
        await db.ai_jobs.update_one(
            {"_id": ObjectId(job_id)},
            {
                "$set": {
                    "status": "failed",
                    "completed_at": get_timestamp(),
                    "last_error": error,
                    "next_retry_at": None
                }
            }
        )
        print(f"[AI_JOB_FAILED] job_id={job_id} attempts={attempts} error={error[:100]}")
    else:
        # Schedule retry
        next_retry_at = get_timestamp() + timedelta(seconds=retry_delay_seconds)
        await db.ai_jobs.update_one(
            {"_id": ObjectId(job_id)},
            {
                "$set": {
                    "status": "queued",
                    "last_error": error,
                    "next_retry_at": next_retry_at
                }
            }
        )
        print(f"[AI_JOB_RETRY] job_id={job_id} attempt={attempts} next_retry_in={retry_delay_seconds}s error={error[:100]}")


async def update_report_status(
    report_id: str,
    report_collection_name: str,
    status: str,
    error: str | None = None,
) -> None:
    """Update the AI processing status on the report."""
    db = get_db()
    
    update_data = {
        "ai_processing_status": status
    }
    
    if status == "processing":
        update_data["ai_processing_started_at"] = get_timestamp()
    elif status == "completed":
        update_data["ai_processing_completed_at"] = get_timestamp()
        update_data["ai_processing_error"] = None
    elif status == "failed":
        update_data["ai_processing_error"] = error
    
    await db[report_collection_name].update_one(
        {"_id": ObjectId(report_id)},
        {"$set": update_data}
    )
