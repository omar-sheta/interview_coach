"""
Practice Router for Guided Learning Platform

Handles practice submissions with text and file uploads.
"""

import os
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from typing import Optional

from server.data_manager import data_manager
from server.services.grading_service import (
    grade_submission, 
    analyze_image_with_vision,
    check_model_available
)
from server.services.auth_service import get_current_user

router = APIRouter(prefix="/api/practice", tags=["practice"])

# Ensure uploads directory exists
UPLOADS_DIR = Path(__file__).parent.parent / "data" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp'}


def is_allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS


@router.post("/submit")
async def submit_practice_answer(
    module_id: str = Form(...),
    question_id: str = Form(...),
    question_text: str = Form(...),
    question_type: str = Form("coding"),
    text_answer: Optional[str] = Form(None),
    file_upload: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Submit a practice answer for grading.
    
    Accepts text answer and/or file upload (image/PDF of handwritten solution).
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    # Validate that at least one answer is provided
    if not text_answer and not file_upload:
        raise HTTPException(
            status_code=400,
            detail="Please provide a text answer or upload a file."
        )
    
    # Process file upload if provided
    file_path = None
    vision_analysis = None
    
    if file_upload:
        # Validate file type
        if not is_allowed_file(file_upload.filename):
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Generate unique filename
        file_ext = Path(file_upload.filename).suffix.lower()
        unique_filename = f"{user_id}_{module_id}_{question_id}_{uuid.uuid4().hex[:8]}{file_ext}"
        file_path = str(UPLOADS_DIR / unique_filename)
        
        # Save file
        try:
            content = await file_upload.read()
            with open(file_path, "wb") as f:
                f.write(content)
            print(f"📁 Saved upload: {unique_filename}")
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save uploaded file: {str(e)}"
            )
        
        # Analyze image with vision model if it's an image
        if file_ext in {'.png', '.jpg', '.jpeg', '.gif', '.webp'}:
            if check_model_available():
                vision_analysis = analyze_image_with_vision(file_path)
            else:
                vision_analysis = "[Vision analysis unavailable - Qwen3-VL model not loaded]"
    
    # Grade the submission
    try:
        grading_result = grade_submission(
            question_text=question_text,
            user_text_answer=text_answer or "",
            vision_analysis=vision_analysis,
            question_type=question_type
        )
    except Exception as e:
        print(f"❌ Grading failed: {e}")
        grading_result = {
            "score": 0,
            "error": str(e),
            "message": "Grading service unavailable. Please try again."
        }
    
    # Generate session ID for this practice session
    session_id = str(uuid.uuid4())
    
    # Store the submission
    submission = data_manager.submit_practice_answer({
        "user_id": user_id,
        "session_id": session_id,
        "module_id": module_id,
        "question_text": question_text,
        "user_text_answer": text_answer,
        "user_file_path": file_path,
        "ai_feedback": grading_result,
        "score": grading_result.get("score", 0)
    })
    
    return {
        "success": True,
        "submission_id": submission.get("id"),
        "score": grading_result.get("score", 0),
        "feedback": grading_result,
        "file_analyzed": vision_analysis is not None,
        "message": "Answer submitted and graded successfully!"
    }


@router.get("/submissions/{module_id}")
async def get_module_submissions(
    module_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all submissions for a specific module."""
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    submissions = data_manager.get_submissions_for_module(user_id, module_id)
    
    return {
        "module_id": module_id,
        "submissions": submissions,
        "count": len(submissions)
    }


@router.get("/submissions")
async def get_all_submissions(current_user: dict = Depends(get_current_user)):
    """Get all practice submissions for the current user."""
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    submissions = data_manager.get_user_submissions(user_id)
    
    # Group by module
    by_module = {}
    for sub in submissions:
        mid = sub.get("module_id", "unknown")
        if mid not in by_module:
            by_module[mid] = []
        by_module[mid].append(sub)
    
    return {
        "total_submissions": len(submissions),
        "by_module": by_module,
        "submissions": submissions
    }


@router.get("/status")
async def get_practice_status():
    """Check if grading services are available."""
    model_available = check_model_available()
    
    return {
        "model_available": model_available,
        "vision_model": "Qwen3-VL-32B-Instruct-4bit",
        "grading_model": "Qwen3-32B-MLX-4bit",
        "ready": model_available,
        "message": "All models ready" if model_available else "Models not loaded yet"
    }
