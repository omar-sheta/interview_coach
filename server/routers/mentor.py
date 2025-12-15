"""
Mentor Router for Guided Learning Platform

Handles AI mentor/interviewer interactions with mode-aware behavior.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from server.services.auth_service import get_current_user
from server.services.mentor_service import generate_ai_response
from server.data_manager import data_manager

router = APIRouter(prefix="/api/mentor", tags=["mentor"])


class MentorAskRequest(BaseModel):
    session_id: str
    code: str
    question: str
    whiteboard_analysis: Optional[str] = None  # Optional vision analysis


class MentorAskResponse(BaseModel):
    response: str
    session_id: str
    mode: str


class StartSessionRequest(BaseModel):
    module_id: str
    mode: str = "coaching"  # 'coaching' or 'interview'
    time_limit_minutes: Optional[int] = None  # Required for interview mode
    question_text: Optional[str] = None  # The practice question to work on
    target_role: Optional[str] = None  # The target role for context


class StartSessionResponse(BaseModel):
    session_id: str
    mode: str
    time_limit_minutes: Optional[int]
    started_at: Optional[str]
    question_text: Optional[str]


@router.post("/session/start", response_model=StartSessionResponse)
async def start_session(
    request: StartSessionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Start a new practice or interview session."""
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    # Validate mode
    if request.mode not in ["coaching", "interview"]:
        raise HTTPException(status_code=400, detail="Mode must be 'coaching' or 'interview'")

    # Interview mode requires time limit
    time_limit = request.time_limit_minutes
    if request.mode == "interview" and not time_limit:
        time_limit = 45  # Default 45 minutes for interviews

    # Create session with question context
    session_id = data_manager.create_practice_session(
        user_id=user_id,
        module_id=request.module_id,
        mode=request.mode,
        time_limit_minutes=time_limit,
        question_text=request.question_text,
        target_role=request.target_role
    )

    # Retrieve session to get started_at
    session = data_manager.get_session(session_id)

    return StartSessionResponse(
        session_id=session_id,
        mode=request.mode,
        time_limit_minutes=time_limit,
        started_at=session.get("started_at") if session else None,
        question_text=request.question_text
    )


@router.post("/ask", response_model=MentorAskResponse)
async def ask_mentor_endpoint(
    request: MentorAskRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Ask the AI Mentor/Interviewer a question about the current code.
    Behavior changes based on session mode.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    # Get session to determine mode and context
    session = data_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    mode = session.get("mode", "coaching")
    
    # Extract problem context from session (stored in code_snapshot as JSON)
    import json
    problem_context = None
    target_role = None
    if session.get("code_snapshot"):
        try:
            context_data = json.loads(session["code_snapshot"])
            problem_context = context_data.get("question_text")
            target_role = context_data.get("target_role")
        except (json.JSONDecodeError, TypeError):
            pass

    # Retrieve Chat History
    try:
        chat_history = data_manager.get_session_history(request.session_id)
    except Exception as e:
        print(f"Error fetching history: {e}")
        chat_history = []

    # Create context snapshot for this message
    context_snapshot = {
        "code": request.code,
        "whiteboard_analysis": request.whiteboard_analysis
    }

    # Save User Message to DB with context
    data_manager.save_chat_message(
        session_id=request.session_id,
        role="user",
        content=request.question,
        context_snapshot=context_snapshot
    )

    # Generate AI Response based on mode with problem context
    ai_response_text = generate_ai_response(
        session_id=request.session_id,
        user_message=request.question,
        current_code=request.code,
        mode=mode,
        chat_history=chat_history,
        whiteboard_image_analysis=request.whiteboard_analysis,
        problem_context=problem_context,
        target_role=target_role
    )

    # Save AI Response to DB
    data_manager.save_chat_message(
        session_id=request.session_id,
        role="assistant",
        content=ai_response_text
    )

    return MentorAskResponse(
        response=ai_response_text,
        session_id=request.session_id,
        mode=mode
    )


@router.get("/session/{session_id}")
async def get_session_info(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get session information including mode, time remaining, etc."""
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    session = data_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Verify ownership
    if session.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this session")

    history = data_manager.get_session_history(session_id)

    return {
        **session,
        "message_count": len(history)
    }


@router.get("/session/{session_id}/history")
async def get_session_history(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get chat history for a session."""
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    session = data_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    history = data_manager.get_session_history(session_id)

    return {
        "session_id": session_id,
        "mode": session.get("mode"),
        "messages": history
    }
