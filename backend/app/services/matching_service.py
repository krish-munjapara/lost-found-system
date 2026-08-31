"""Embedding-based matching service for Guardian-Link.

This service compares stored face embeddings between opposite report types,
filters candidates by metadata, and stores pending-review matches without
auto-approval or notifications.
"""

from __future__ import annotations

import math
from typing import Any

from bson import ObjectId

from app.config import (
    AGE_TOLERANCE,
    HIGH_MATCH_THRESHOLD,
    LOCATION_RADIUS,
    LOW_MATCH_THRESHOLD,
    MATCH_THRESHOLD,
    MEDIUM_MATCH_THRESHOLD,
    TOP_MATCH_LIMIT,
)
from app.database import get_db
from app.utils import get_timestamp
from app.services.embedding_service import log_event

MATCH_LOCATION_RADIUS_KM = LOCATION_RADIUS


def _get_confidence_label(score: float) -> str:
    if score >= HIGH_MATCH_THRESHOLD:
        return "High Confidence"
    if score >= MEDIUM_MATCH_THRESHOLD:
        return "Medium Confidence"
    if score >= LOW_MATCH_THRESHOLD:
        return "Low Confidence"
    return "No Match"


def _cosine_similarity(left: list[float] | None, right: list[float] | None) -> float:
    if not left or not right:
        return 0.0
    if len(left) != len(right):
        return 0.0
    dot = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(a * a for a in left))
    right_norm = math.sqrt(sum(a * a for a in right))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    similarity = dot / (left_norm * right_norm)
    return round(max(0.0, min(1.0, similarity)) * 100.0, 2)


def _finalize_match_score(raw_score: float) -> float:
    if raw_score >= HIGH_MATCH_THRESHOLD:
        return round(raw_score, 2)
    if raw_score >= MEDIUM_MATCH_THRESHOLD:
        return round(raw_score * 0.95, 2)
    if raw_score >= LOW_MATCH_THRESHOLD:
        return round(raw_score * 0.9, 2)
    return 0.0


async def _get_embedding_for_report(db: Any, report_id: str | None) -> list[float] | None:
    if not report_id:
        return None
    query_id = report_id
    try:
        query_id = ObjectId(report_id)
    except Exception:
        pass
    doc = await db.face_embeddings.find_one({"report_id": query_id})
    if doc and isinstance(doc.get("embedding"), list):
        # DIAGNOSTIC: Log embedding version for debugging
        embedding_version = doc.get("embedding_model_version", "UNKNOWN")
        embedding_dim = len(doc["embedding"])
        print(f"[MATCHING_EMBEDDING_RETRIEVED] report_id={report_id} version={embedding_version} dim={embedding_dim}")
        return doc["embedding"]
    return None


def _is_gender_compatible(source_gender: str | None, target_gender: str | None) -> bool:
    if not source_gender or not target_gender:
        return True
    return str(source_gender).strip().lower() == str(target_gender).strip().lower()


def _is_age_compatible(source_age: Any, target_age: Any) -> bool:
    try:
        source_value = int(str(source_age).split(" ", 1)[0])
        target_value = int(str(target_age).split(" ", 1)[0])
    except (TypeError, ValueError):
        return True
    return abs(source_value - target_value) <= AGE_TOLERANCE


def _extract_location_components(location: Any) -> tuple[str | None, float | None, float | None]:
    if isinstance(location, dict):
        city = location.get("city") or location.get("name")
        lat = location.get("lat") or location.get("latitude")
        lng = location.get("lng") or location.get("longitude")
        try:
            lat_val = float(lat)
            lng_val = float(lng)
        except (TypeError, ValueError):
            lat_val = None
            lng_val = None
        return str(city).strip() if city else None, lat_val, lng_val

    if isinstance(location, str):
        return location.strip() or None, None, None

    return None, None, None


def _is_location_compatible(source_location: Any, target_location: Any) -> bool:
    source_city, source_lat, source_lng = _extract_location_components(source_location)
    target_city, target_lat, target_lng = _extract_location_components(target_location)

    # Extract state and district for fallback comparison
    source_state = None
    source_district = None
    target_state = None
    target_district = None
    
    if isinstance(source_location, dict):
        source_state = source_location.get("state")
        source_district = source_location.get("district")
    if isinstance(target_location, dict):
        target_state = target_location.get("state")
        target_district = target_location.get("district")

    # If both have no location info at all, consider compatible
    if not source_city and not target_city and source_lat is None and source_lng is None and target_lat is None and target_lng is None and not source_state and not target_state:
        return True

    # City match (case-insensitive)
    if source_city and target_city:
        if str(source_city).strip().lower() == str(target_city).strip().lower():
            return True

    # Geographic distance match
    if source_lat is not None and source_lng is not None and target_lat is not None and target_lng is not None:
        distance_km = _haversine_km(source_lat, source_lng, target_lat, target_lng)
        if distance_km <= MATCH_LOCATION_RADIUS_KM:
            return True

    # Fallback: if no coordinates, check state and district
    if source_lat is None or source_lng is None or target_lat is None or target_lng is None:
        # Same state and district → compatible
        if source_state and target_state and source_district and target_district:
            if (str(source_state).strip().lower() == str(target_state).strip().lower() and
                str(source_district).strip().lower() == str(target_district).strip().lower()):
                return True
        # Same state only → compatible (more lenient)
        if source_state and target_state:
            if str(source_state).strip().lower() == str(target_state).strip().lower():
                return True

    return False


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius_km = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius_km * c


async def _match_exists(db: Any, missing_id: str, found_id: str) -> bool:
    missing_obj_id = missing_id
    found_obj_id = found_id
    try:
        missing_obj_id = ObjectId(missing_id)
    except Exception:
        pass
    try:
        found_obj_id = ObjectId(found_id)
    except Exception:
        pass
    existing = await db.matches.find_one({
        "$or": [
            {"missing_id": missing_obj_id, "found_id": found_obj_id},
            {"missing_id": found_obj_id, "found_id": missing_obj_id},
        ]
    })
    return existing is not None


async def filter_candidate_reports(
    db: Any,
    source_report: dict[str, Any],
    report_id: str,
    candidate_collection_name: str,
    report_type: str,
) -> list[dict[str, Any]]:
    """Pre-filter candidate reports before any expensive AI scoring.
    
    HARD FILTERS (must pass to proceed):
    - Not the same report
    - Opposite report type (missing vs found)
    - Not resolved/inactive
    - Has valid embedding
    - Embedding status is success or success_with_warnings
    
    SOFT FILTERS (logged as warnings, do NOT block):
    - Gender mismatch
    - Age mismatch
    - Location mismatch
    - Same user ID
    """
    # Defensive validation: enforce collection isolation based on report_type
    if report_type == "missing":
        expected_collection = "children_found"
    elif report_type == "found":
        expected_collection = "children"
    else:
        raise ValueError(f"Invalid report_type: {report_type}")

    if candidate_collection_name != expected_collection:
        print(
            f"[FILTER_ERROR] Collection mismatch: "
            f"report_type={report_type}, "
            f"expected={expected_collection}, "
            f"actual={candidate_collection_name}"
        )
        candidate_collection_name = expected_collection

    candidate_query = {
        "status": {"$ne": "Resolved"},
        "embedding_status": {"$in": ["success", "success_with_warnings"]},
    }

    candidate_reports: list[dict[str, Any]] = []
    source_user_id = source_report.get("user_id")
    
    # DIAGNOSTIC: Log candidate collection and query
    print(f"[MATCH_CANDIDATES] opposite_type={candidate_collection_name} expected_opposite={'found' if report_type == 'missing' else 'missing'}")
    
    async for candidate in db[candidate_collection_name].find(candidate_query):
        candidate_id = str(candidate.get("_id"))
        candidate_user_id = candidate.get("user_id")
        candidate_embedding = await _get_embedding_for_report(db, candidate_id)
        same_report = str(candidate_id) == str(report_id)
        same_user = source_user_id and candidate_user_id and str(source_user_id) == str(candidate_user_id)
        has_embedding = candidate_embedding is not None
        is_active = str(candidate.get("status", "")).strip().lower() not in {"resolved", "archived", "closed"}

        # HARD FILTER: Same report
        if same_report:
            log_event(
                "Rejected Reason",
                report_id=report_id,
                candidate_id=candidate_id,
                reason="same-report",
                source_report_type=report_type,
            )
            continue
        
        # HARD FILTER: Inactive/Resolved status
        if not is_active or candidate.get("status") == "Resolved":
            log_event(
                "Rejected Reason",
                report_id=report_id,
                candidate_id=candidate_id,
                reason="inactive-or-resolved",
                source_report_type=report_type,
            )
            continue
        
        # HARD FILTER: Missing embedding
        if not has_embedding:
            log_event(
                "Rejected Reason",
                report_id=report_id,
                candidate_id=candidate_id,
                reason="missing-embedding",
                source_report_type=report_type,
            )
            continue
        
        # SOFT FILTERS: Log warnings but do NOT reject
        metadata_warnings = []
        
        # Gender mismatch warning
        if not _is_gender_compatible(source_report.get("gender"), candidate.get("gender")):
            source_gender = source_report.get("gender")
            target_gender = candidate.get("gender")
            metadata_warnings.append("gender_mismatch")
            print(f"[MATCH_METADATA_WARNING] candidate_report_id={candidate_id} warnings=[gender_mismatch] source_gender={source_gender} target_gender={target_gender}")
        
        # Age mismatch warning
        if not _is_age_compatible(source_report.get("age"), candidate.get("age")):
            source_age = source_report.get("age")
            target_age = candidate.get("age")
            metadata_warnings.append("age_difference")
            print(f"[MATCH_METADATA_WARNING] candidate_report_id={candidate_id} warnings=[age_difference] source_age={source_age} target_age={target_age}")
        
        # Location mismatch warning
        if not _is_location_compatible(source_report.get("location_structured"), candidate.get("location_structured")):
            source_loc = source_report.get("location_structured")
            target_loc = candidate.get("location_structured")
            metadata_warnings.append("location_difference")
            print(f"[MATCH_METADATA_WARNING] candidate_report_id={candidate_id} warnings=[location_difference] source_location={source_loc} target_location={target_loc}")
        
        # Same user warning
        if same_user:
            metadata_warnings.append("same_user")
            print(f"[MATCH_METADATA_WARNING] candidate_report_id={candidate_id} warnings=[same_user]")
        
        # Attach metadata warnings to candidate for later use
        candidate["_metadata_warnings"] = metadata_warnings
        
        candidate_reports.append(candidate)
        log_event(
            "Candidates Found",
            report_id=report_id,
            candidate_id=candidate_id,
            report_type=report_type,
        )

    return candidate_reports


async def score_candidate_matches(
    db: Any,
    source_report: dict[str, Any],
    source_embedding: list[float],
    candidate_reports: list[dict[str, Any]],
    source_report_id: str | None = None,
    match_threshold: float = MATCH_THRESHOLD,
) -> list[tuple[float, float, dict[str, Any]]]:
    """Run AI similarity scoring only for already-filtered candidates."""
    scored_matches: list[tuple[float, float, dict[str, Any]]] = []
    for candidate in candidate_reports:
        candidate_id = str(candidate.get("_id"))
        target_embedding = await _get_embedding_for_report(db, candidate_id)
        raw_score = _cosine_similarity(source_embedding, target_embedding)
        final_score = _finalize_match_score(raw_score)
        
        # Get metadata warnings from candidate
        metadata_warnings = candidate.get("_metadata_warnings", [])
        
        # DIAGNOSTIC: Log each comparison with metadata details
        matched = raw_score >= match_threshold
        print(f"[MATCH_COMPARISON] source_report_id={source_report_id} candidate_report_id={candidate_id} face_similarity={raw_score} gender_source={source_report.get('gender')} gender_candidate={candidate.get('gender')} age_source={source_report.get('age')} age_candidate={candidate.get('age')} location_source={source_report.get('location_structured')} location_candidate={candidate.get('location_structured')}")
        
        if metadata_warnings:
            print(f"[MATCH_METADATA_WARNING] candidate_report_id={candidate_id} warnings={metadata_warnings}")
        
        log_event(
            "Similarity Calculated",
            report_id=candidate_id,
            source_report_id=source_report_id,
            raw_score=raw_score,
            final_score=final_score,
        )
        
        if raw_score < match_threshold:
            print(f"[MATCH_THRESHOLD_REJECTED] candidate_report_id={candidate_id} similarity={raw_score} threshold={match_threshold}")
            continue
        scored_matches.append((final_score, raw_score, candidate))

    scored_matches.sort(key=lambda item: item[0], reverse=True)
    return scored_matches


def rank_matches(scored_matches: list[tuple[float, float, dict[str, Any]]], max_matches: int = TOP_MATCH_LIMIT) -> list[tuple[int, float, float, dict[str, Any]]]:
    """Rank matches for return and storage; this is a clean seam for future ANN/FAISS integration."""
    ranked_matches: list[tuple[int, float, float, dict[str, Any]]] = []
    for rank, (final_score, raw_score, candidate) in enumerate(scored_matches[:max_matches], start=1):
        ranked_matches.append((rank, final_score, raw_score, candidate))
    return ranked_matches


async def run_matching_for_report(
    report_id: str,
    report_type: str,
    report_collection_name: str,
    candidate_collection_name: str,
    max_matches: int = TOP_MATCH_LIMIT,
) -> list[dict[str, Any]]:
    """Create ranked embedding-based match candidates for a report."""
    print(f"[MATCHING_START] report_id={report_id} report_type={report_type}")
    
    db = get_db()

    if report_type not in {"missing", "found"}:
        print(f"[MATCHING_ERROR] invalid_report_type={report_type}")
        print(f"[MATCHING_COMPLETE] matches_created=0")
        return []

    try:
        report_obj_id = ObjectId(report_id)
    except Exception:
        report_obj_id = report_id

    source_report = await db[report_collection_name].find_one({"_id": report_obj_id})
    if not source_report:
        print(f"[MATCHING_ERROR] report_not_found report_id={report_id}")
        print(f"[MATCHING_COMPLETE] matches_created=0")
        return []

    print(f"[MATCHING_REPORT_LOADED] report_id={report_id} collection={report_collection_name}")

    source_embedding = await _get_embedding_for_report(db, report_id)
    if not source_embedding:
        print(f"[MATCHING_ERROR] missing_source_embedding report_id={report_id}")
        print(f"[MATCHING_COMPLETE] matches_created=0")
        return []

    print(f"[MATCHING_EMBEDDING_LOADED] embedding_length={len(source_embedding)}")

    candidate_reports = await filter_candidate_reports(
        db,
        source_report,
        report_id,
        candidate_collection_name,
        report_type,
    )

    print(f"[MATCHING_CANDIDATES_FOUND] count={len(candidate_reports)}")

    if len(candidate_reports) == 0:
        print(f"[MATCHING_NO_CANDIDATES] report_id={report_id} expected_opposite_type={'found' if report_type == 'missing' else 'missing'}")
        print(f"[MATCHING_COMPLETE] matches_created=0 reason=no_candidates")
        return []

    scored_matches = await score_candidate_matches(
        db,
        source_report,
        source_embedding,
        candidate_reports,
        source_report_id=str(report_obj_id),
    )
    ranked_matches = rank_matches(scored_matches, max_matches=max_matches)

    print(f"[MATCHING_SCORED] scored_count={len(scored_matches)} ranked_count={len(ranked_matches)}")
    
    # Log best similarity score
    if scored_matches:
        # scored_matches structure: (final_score, raw_score, candidate)
        best_score = max(final_score for final_score, _, _ in scored_matches)
        print(f"[MATCHING_BEST_SCORE] best_similarity={best_score} threshold={MATCH_THRESHOLD} passed={best_score >= MATCH_THRESHOLD}")
        print(f"[MATCHING_SCORE_TYPE] type=float value={best_score}")

    created_matches: list[dict[str, Any]] = []
    now = get_timestamp()
    for rank, score, raw_score, candidate in ranked_matches:
        candidate_id = candidate.get("_id")
        try:
            candidate_id_obj = ObjectId(candidate_id)
        except Exception:
            candidate_id_obj = candidate_id
        
        missing_id = candidate_id_obj if report_type == "found" else report_obj_id
        found_id = report_obj_id if report_type == "found" else candidate_id_obj
        missing_reporter = candidate.get("reporter_email") if report_type == "found" else source_report.get("reporter_email")
        found_reporter = source_report.get("reporter_email") if report_type == "found" else candidate.get("reporter_email")
        
        if await _match_exists(db, str(missing_id), str(found_id)):
            print(f"[MATCHING_DUPLICATE] missing_id={missing_id} found_id={found_id}")
            continue

        print(f"[MATCHING_CREATE] rank={rank} score={score} raw_score={raw_score}")
        
        # Get metadata warnings from candidate
        metadata_warnings = candidate.get("_metadata_warnings", [])
        
        match_doc = {
            "missing_id": missing_id,
            "found_id": found_id,
            "missing_reporter": missing_reporter,
            "found_reporter": found_reporter,
            "rank": rank,
            "confidence": _get_confidence_label(score),
            "similarity": float(raw_score),
            "raw_score": float(raw_score),
            "score": float(score),
            "confidence_label": _get_confidence_label(score),
            "status": "Pending",
            "created_at": now,
            "updated_at": now,
            "metadata_warnings": metadata_warnings,
        }
        result = await db.matches.insert_one(match_doc)
        match_doc["_id"] = str(result.inserted_id)
        created_matches.append(match_doc)
        
        # DIAGNOSTIC: Log successful match creation
        print(f"[MATCH_FOUND] missing_report_id={missing_id} found_report_id={found_id} similarity={raw_score}")
        print(f"[MATCH_SAVED] match_id={result.inserted_id}")
        
        # Update the missing child's status to "Ai Matches"
        await db.children.update_one(
            {"_id": missing_id},
            {"$set": {"status": "Ai Matches", "updated_at": now}}
        )
        
        log_event(
            "Match Created",
            report_id=str(report_obj_id),
            candidate_id=str(candidate_id),
            rank=rank,
            score=float(score),
            raw_score=float(raw_score),
            confidence=_get_confidence_label(score),
        )
        print(f"[MATCHING_CREATED] match_id={result.inserted_id}")

    print(f"[MATCHING_COMPLETE] matches_created={len(created_matches)}")
    
    if not created_matches:
        print(f"[MATCHING_NO_MATCH] reason=score_below_threshold")

    return created_matches
