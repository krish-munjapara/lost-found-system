"""AI worker for Guardian-Link.

This worker processes AI jobs from the persistent job queue.
It runs independently from the web process and survives restarts.
"""

import asyncio
import signal
import sys
from typing import Any

from app.config import MATCH_THRESHOLD
from app.database import connect_db, close_db, get_db
from app.services.embedding_service import (
    load_image_from_url_or_path,
    create_embedding_record_for_report,
)
from app.services.job_service import (
    claim_ai_job,
    update_job_success,
    update_job_failure,
    update_report_status,
)
from app.services.matching_service import run_matching_for_report


async def process_ai_job(job: dict[str, Any]) -> None:
    """Process a single AI job."""
    job_id = str(job["_id"])
    report_id = job["report_id"]
    report_type = job["report_type"]
    report_collection = job["report_collection"]
    
    print(f"[AI_WORKER_START] job_id={job_id} report_id={report_id} report_type={report_type}")
    
    # Update report status to processing
    await update_report_status(report_id, report_collection, "processing")
    
    try:
        from app.database import get_db
        db = get_db()
        
        # Fetch report from MongoDB
        print(f"[AI_REPORT_FETCH_START] job_id={job_id} report_id={report_id}")
        from bson import ObjectId
        report = await db[report_collection].find_one({"_id": ObjectId(report_id)})
        if not report:
            print(f"[AI_REPORT_FETCH_ERROR] job_id={job_id} report_id={report_id} error=report_not_found")
            await update_job_failure(job_id, "Report not found")
            await update_report_status(report_id, report_collection, "failed", "Report not found")
            return
        print(f"[AI_REPORT_FETCH_SUCCESS] job_id={job_id} report_id={report_id}")
        
        # Get image_url from report
        image_url = report.get("image_url")
        if not image_url:
            print(f"[AI_REPORT_IMAGE_URL_ERROR] job_id={job_id} report_id={report_id} error=image_url_missing")
            await update_job_failure(job_id, "Image URL missing")
            await update_report_status(report_id, report_collection, "failed", "Image URL missing")
            return
        
        # Truncate URL for logging
        url_prefix = image_url[:80] if len(image_url) > 80 else image_url
        print(f"[AI_REPORT_IMAGE_URL_FOUND] job_id={job_id} report_id={report_id} url={url_prefix}...")
        
        # Load image from Cloudinary URL with retry
        print(f"[AI_IMAGE_LOAD_START] job_id={job_id} report_id={report_id}")
        print(f"[AI_IMAGE_SOURCE_TYPE] source_type=url")
        
        max_retries = 3
        image = None
        last_error = None
        
        for attempt in range(1, max_retries + 1):
            print(f"[AI_IMAGE_DOWNLOAD_ATTEMPT] job_id={job_id} attempt={attempt}/{max_retries}")
            image = load_image_from_url_or_path(image_url)
            if image is not None:
                print(f"[AI_IMAGE_DOWNLOAD_SUCCESS] job_id={job_id} attempt={attempt}")
                break
            last_error = "Image load returned None"
            if attempt < max_retries:
                print(f"[AI_IMAGE_DOWNLOAD_RETRY] job_id={job_id} waiting_2s before_attempt={attempt + 1}")
                await asyncio.sleep(2)
        
        if image is None:
            print(f"[AI_IMAGE_LOAD_ERROR] job_id={job_id} report_id={report_id} error={last_error} after_{max_retries}_attempts")
            await update_job_failure(job_id, last_error)
            await update_report_status(report_id, report_collection, "failed", last_error)
            return
        
        print(f"[AI_IMAGE_LOAD_SUCCESS] job_id={job_id} report_id={report_id} image_shape={image.shape}")
        
        # Generate embedding
        print(f"[AI_EMBEDDING_START] job_id={job_id} report_id={report_id}")
        embedding_result = await create_embedding_record_for_report(
            report_id=report_id,
            report_type=report_type,
            user_id=report.get("user_id"),
            image_input=image,
            report_collection_name=report_collection,
        )
        
        if not embedding_result or embedding_result.get("status") == "failed":
            error_msg = embedding_result.get("error", "Embedding generation failed") if embedding_result else "Embedding generation failed"
            print(f"[AI_EMBEDDING_ERROR] job_id={job_id} report_id={report_id} error={error_msg}")
            await update_job_failure(job_id, error_msg)
            await update_report_status(report_id, report_collection, "failed", error_msg)
            return
        
        print(f"[AI_EMBEDDING_SUCCESS] job_id={job_id} report_id={report_id} embedding_dimensions={embedding_result.get('dimensions')}")
        
        # Run matching
        print(f"[MATCHING_START] job_id={job_id} report_id={report_id} report_type={report_type}")
        candidate_collection_name = "children_found" if report_type == "missing" else "children"
        matches = await run_matching_for_report(
            report_id=report_id,
            report_type=report_type,
            report_collection_name=report_collection,
            candidate_collection_name=candidate_collection_name,
        )
        
        print(f"[MATCHING_COMPLETE] job_id={job_id} report_id={report_id} matches_created={len(matches)}")
        
        # Mark job as completed
        await update_job_success(job_id)
        await update_report_status(report_id, report_collection, "completed")
        print(f"[AI_JOB_COMPLETE] job_id={job_id} report_id={report_id}")
        
    except Exception as e:
        print(f"[AI_JOB_ERROR] job_id={job_id} report_id={report_id} error={str(e)}")
        import traceback
        print(f"[AI_JOB_ERROR] job_id={job_id} traceback={traceback.format_exc()}")
        await update_job_failure(job_id, str(e))
        await update_report_status(report_id, report_collection, "failed", str(e))


async def worker_loop(poll_interval_seconds: int = 5, standalone: bool = False) -> None:
    """Main worker loop that polls for and processes jobs.
    
    Args:
        poll_interval_seconds: Seconds to wait between job polls
        standalone: If True, register signal handlers for graceful shutdown.
                    If False (embedded in FastAPI), rely on asyncio.CancelledError.
    """
    print("[AI_WORKER_START] Starting AI worker loop")
    print(f"[AI_WORKER_CONFIG] poll_interval={poll_interval_seconds}s standalone={standalone}")
    
    shutdown_requested = False
    
    # Setup signal handlers only in standalone mode
    if standalone:
        def signal_handler():
            nonlocal shutdown_requested
            print("[AI_WORKER_SHUTDOWN] Shutdown requested")
            shutdown_requested = True
        
        # Setup signal handlers for graceful shutdown
        if sys.platform != "win32":
            # Unix-like systems
            signal.signal(signal.SIGTERM, signal_handler)
            signal.signal(signal.SIGINT, signal_handler)
    
    while not shutdown_requested:
        try:
            # Claim a job
            job = await claim_ai_job(timeout_seconds=300)
            
            if job:
                print(f"[AI_WORKER_JOB_ACQUIRED] job_id={str(job['_id'])}")
                await process_ai_job(job)
            else:
                # No jobs available, wait before next poll
                await asyncio.sleep(poll_interval_seconds)
                
        except asyncio.CancelledError:
            print("[AI_WORKER_SHUTDOWN] Worker cancelled")
            break
        except Exception as e:
            print(f"[AI_WORKER_ERROR] error={str(e)}")
            import traceback
            print(f"[AI_WORKER_ERROR] traceback={traceback.format_exc()}")
            await asyncio.sleep(poll_interval_seconds)
    
    print("[AI_WORKER_SHUTDOWN] Worker loop stopped")


async def main():
    """Main entry point for the AI worker."""
    print("[AI_WORKER_INIT] Initializing AI worker")
    
    # Connect to MongoDB
    await connect_db()
    print("[AI_WORKER_INIT] MongoDB connected")
    
    # Start worker loop in standalone mode
    await worker_loop(poll_interval_seconds=5, standalone=True)
    
    # Cleanup
    await close_db()
    print("[AI_WORKER_SHUTDOWN] MongoDB disconnected")


if __name__ == "__main__":
    asyncio.run(main())
