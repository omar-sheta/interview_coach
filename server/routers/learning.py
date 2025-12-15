"""
Learning Router for Guided Learning Platform

Handles learning plan generation and retrieval.
"""

import io
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel
from typing import Optional

from server.data_manager import data_manager
from server.services.curriculum_service import generate_track, check_model_available, extract_skills
from server.services.auth_service import get_current_user

# Try to import pypdf, fall back gracefully
try:
    from pypdf import PdfReader
    PYPDF_AVAILABLE = True
except ImportError:
    PYPDF_AVAILABLE = False
    print("⚠️ pypdf not installed. PDF parsing will be unavailable.")

router = APIRouter(prefix="/api/learning", tags=["learning"])


class GeneratePlanRequest(BaseModel):
    """Request body for generating a learning plan with text input."""
    cv_text: str
    target_role: str


class GeneratePlanResponse(BaseModel):
    """Response for learning plan generation."""
    success: bool
    message: str
    plan: Optional[dict] = None


@router.post("/generate", response_model=GeneratePlanResponse)
async def generate_learning_plan(
    target_role: str = Form(...),
    cv_file: Optional[UploadFile] = File(None),
    cv_text: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a personalized learning plan from CV.
    
    Accepts either a PDF file upload or raw text.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    # Extract CV text from PDF or use provided text
    extracted_text = ""
    
    if cv_file:
        if not PYPDF_AVAILABLE:
            raise HTTPException(
                status_code=500, 
                detail="PDF processing not available. Please install pypdf."
            )
        
        # Read and parse PDF
        try:
            content = await cv_file.read()
            pdf_reader = PdfReader(io.BytesIO(content))
            
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text += page_text + "\n"
            
            if not extracted_text.strip():
                raise HTTPException(
                    status_code=400,
                    detail="Could not extract text from PDF. Please try a different file."
                )
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to parse PDF: {str(e)}"
            )
    elif cv_text:
        extracted_text = cv_text
    else:
        raise HTTPException(
            status_code=400,
            detail="Please provide either a CV file or CV text."
        )
    
    # Check if Ollama is available
    if not check_model_available():
        # Use fallback curriculum without failing
        print("⚠️ Ollama not available, using fallback curriculum")
    
    # Generate curriculum
    try:
        curriculum = generate_track(extracted_text, target_role)
        
        # Save to database
        plan = data_manager.create_learning_plan(
            user_id=user_id,
            target_role=target_role,
            curriculum=curriculum
        )
        
        return GeneratePlanResponse(
            success=True,
            message="Learning plan generated successfully!",
            plan=plan
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate learning plan: {str(e)}"
        )


@router.get("/plan")
async def get_learning_plan(current_user: dict = Depends(get_current_user)):
    """Get the current user's learning plan."""
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    plan = data_manager.get_learning_plan(user_id)
    
    if not plan:
        return {
            "has_plan": False,
            "plan": None,
            "message": "No learning plan found. Please upload your CV to generate one."
        }
    
    return {
        "has_plan": True,
        "plan": plan,
        "message": "Learning plan retrieved successfully."
    }


@router.get("/plan/module/{module_id}")
async def get_module_details(
    module_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get details for a specific module including questions."""
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    plan = data_manager.get_learning_plan(user_id)
    if not plan:
        raise HTTPException(status_code=404, detail="No learning plan found")
    
    curriculum = plan.get("curriculum", {})
    modules = curriculum.get("modules", [])
    
    # Find the requested module
    module = next((m for m in modules if m.get("id") == module_id), None)
    
    if not module:
        raise HTTPException(status_code=404, detail=f"Module {module_id} not found")
    
    # Get user's submissions for this module
    submissions = data_manager.get_submissions_for_module(user_id, module_id)
    
    return {
        "module": module,
        "submissions": submissions,
        "progress": plan.get("progress", {}).get(module_id, {})
    }


@router.post("/plan/progress/{module_id}")
async def update_module_progress(
    module_id: str,
    progress_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update progress for a specific module."""
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    plan = data_manager.get_learning_plan(user_id)
    if not plan:
        raise HTTPException(status_code=404, detail="No learning plan found")
    
    # Update progress
    current_progress = plan.get("progress", {})
    current_progress[module_id] = progress_data
    
    success = data_manager.update_learning_plan_progress(user_id, current_progress)
    
    if success:
        return {"success": True, "message": "Progress updated"}
    else:
        raise HTTPException(status_code=500, detail="Failed to update progress")


@router.get("/status")
async def get_model_status():
    """Check if local MLX models are available."""
    model_available = check_model_available()
    
    return {
        "model_available": model_available,
        "curriculum_model": "Qwen3-32B-MLX-4bit",
        "message": "Ready" if model_available else "Model not available. Fallback curriculum will be used."
    }


@router.post("/analyze")
async def analyze_skills(
    cv_file: Optional[UploadFile] = File(None),
    cv_text: Optional[str] = Form(None),
):
    """
    Quickly extract skills from CV for UI feedback.
    No auth required for this step to reduce friction, but result is temporary.
    """
    extracted_text = ""
    
    if cv_file:
        if not PYPDF_AVAILABLE:
            if not cv_text:
                raise HTTPException(status_code=400, detail="PDF support unavailble and no text provided")
        else:
            try:
                content = await cv_file.read()
                pdf_file = io.BytesIO(content)
                reader = PdfReader(pdf_file)
                extracted_text = "\n".join([page.extract_text() for page in reader.pages])
            except Exception as e:
                print(f"❌ PDF extraction failed: {e}")
                if not cv_text:
                    raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
    
    if not extracted_text and cv_text:
        extracted_text = cv_text
        
    if not extracted_text:
        raise HTTPException(status_code=400, detail="No CV content provided")
        
    skills = extract_skills(extracted_text)
    
    return {
        "success": True,
        "skills": skills,
        "role_category": "unknown" 
    }


@router.post("/market")
async def analyze_market(
    target_role: str = Form(...)
):
    """
    Perform deep market analysis for a role.
    Simulates a "Thread 2" for the UI.
    """
    from server.services.curriculum_service import generate_market_analysis
    
    analysis = generate_market_analysis(target_role)
    
    return {
        "success": True,
        "market_data": analysis
    }


@router.get("/market/stream")
async def stream_market(target_role: str):
    """
    Stream market analysis tokens in real-time.
    Uses JobAnalyst to search web, crawl, and analyze.
    """
    from fastapi.responses import StreamingResponse
    from server.services.curriculum_service import stream_market_analysis
    
    print(f"📡 [Stream] Starting market stream for: {target_role}")
    
    # FastAPI StreamingResponse handles async generators natively
    async def generate():
        try:
            async for chunk in stream_market_analysis(target_role):
                print(f"📤 [Stream] Yielding: {chunk[:50]}...")
                yield chunk
        except Exception as e:
            print(f"❌ [Stream] Error: {e}")
            yield f"Error: {str(e)}\n"
            
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )


@router.get("/plans")
async def get_all_plans(current_user: dict = Depends(get_current_user)):
    """
    Get all learning plans for the current user.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    plans = data_manager.get_all_learning_plans(user_id)
    
    return {
        "success": True,
        "plans": plans
    }


@router.delete("/plan/{plan_id}")
async def delete_plan(plan_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete a specific learning plan.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    success = data_manager.delete_learning_plan(plan_id, user_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Plan not found or not owned by user")
    
    return {
        "success": True,
        "message": "Plan deleted successfully"
    }
