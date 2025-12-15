"""
Mentor Service for Guided Learning Platform

Provides AI-powered mentoring and interview simulation using:
- Qwen3-32B via MLX for conversational AI (runs locally on M4 Max)

Supports two personas:
- Coach: Encouraging, educational, gives hints
- Interviewer: Professional, neutral, probing questions
"""

from pathlib import Path
from typing import List, Dict, Optional
from mlx_lm import load, generate

# Model Configuration
MODEL_DIR = Path(__file__).parent.parent / "models" / "qwen3-32b"
MAX_CONTEXT_TOKENS = 4096


class MentorModel:
    """Singleton model loader to keep model in RAM."""
    _instance = None
    _model = None
    _tokenizer = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = MentorModel()
        return cls._instance

    def __init__(self):
        if MentorModel._model is None:
            print(f"🔄 Loading Mentor Model from {MODEL_DIR}...")
            try:
                if not MODEL_DIR.exists():
                    print(f"⚠️ Model directory not found: {MODEL_DIR}")
                    return
                MentorModel._model, MentorModel._tokenizer = load(str(MODEL_DIR))
                print("✅ Mentor Model loaded successfully!")
            except Exception as e:
                print(f"❌ Failed to load Mentor Model: {e}")

    @property
    def model(self):
        return MentorModel._model

    @property
    def tokenizer(self):
        return MentorModel._tokenizer


# ============================================================================
# PERSONA PROMPTS
# ============================================================================

COACH_SYSTEM_PROMPT = """You are a Senior Mentor sitting next to a Junior Engineer. They are practicing for a {target_role} role.

**THE PROBLEM THEY ARE WORKING ON:**
{problem_context}

**Student's Current Code:**
```
{code}
```

{whiteboard_context}

**Previous Conversation:**
{history}

**Student's Current Question:** {question}

Rules:
1. Tone: Encouraging, educational, supportive.
2. Goal: Unblock them and help them learn.
3. If they ask for a hint, give it freely.
4. If their logic is flawed, explain *why* concepts like Big O, data structures, or design patterns matter here.
5. Guide them to the solution with questions, but you CAN provide code snippets if they're truly stuck.
6. Keep responses concise (3-5 sentences max) but helpful."""

INTERVIEWER_SYSTEM_PROMPT = """You are a Staff Engineer at a Big Tech company conducting a formal technical interview for a {target_role} position.

**THE INTERVIEW QUESTION:**
{problem_context}

**Candidate's Current Code:**
```
{code}
```

{whiteboard_context}

**Interview Transcript So Far:**
{history}

**Candidate's Statement:** {question}

Rules:
1. Tone: Professional, neutral, slightly demanding. This is an evaluation.
2. Goal: Assess their competency fairly.
3. Do NOT give hints unless they are completely stuck (and note this mentally affects their score).
4. Do NOT write code for them under any circumstances.
5. If they propose a solution, ask probing questions:
   - "How does this handle network partitions?"
   - "What is the time complexity of this approach?"
   - "What happens if the input size doubles?"
6. If they ask "Is this right?", respond: "Please walk me through your reasoning."
7. Keep responses professional and brief (2-3 sentences)."""


def _format_history(history: List[Dict[str, str]], mode: str = "coaching") -> str:
    """Format chat history for the prompt based on mode."""
    if not history:
        return "(No previous messages)"
    
    formatted = ""
    for msg in history:
        if mode == "coaching":
            role = "Student" if msg.get("role") == "user" else "Mentor"
        else:
            role = "Candidate" if msg.get("role") == "user" else "Interviewer"
        content = msg.get("content", "")
        formatted += f"{role}: {content}\n"
    return formatted.strip()


def _truncate_history(history: List[Dict[str, str]], max_messages: int = 10) -> List[Dict[str, str]]:
    """Keep only the last N messages to fit context window."""
    return history[-max_messages:] if len(history) > max_messages else history


def generate_ai_response(
    session_id: str,
    user_message: str,
    current_code: str,
    mode: str = "coaching",
    chat_history: Optional[List[Dict[str, str]]] = None,
    whiteboard_image_analysis: Optional[str] = None,
    problem_context: Optional[str] = None,
    target_role: Optional[str] = None
) -> str:
    """
    Generate an AI response based on session mode.
    
    Args:
        session_id: The practice session ID
        user_message: The user's current message/question
        current_code: The user's current code in the editor
        mode: 'coaching' or 'interview'
        chat_history: Previous messages in the session
        whiteboard_image_analysis: Optional vision analysis of whiteboard/diagram
        problem_context: The practice question/problem the user is working on
        target_role: The job role the user is preparing for
    
    Returns:
        AI response string
    """
    instance = MentorModel.get_instance()
    model = instance.model
    tokenizer = instance.tokenizer

    if not model or not tokenizer:
        return "System Error: AI model is not loaded. Please try again later."

    # Prepare context
    history = chat_history or []
    recent_history = _truncate_history(history)
    history_text = _format_history(recent_history, mode)
    
    # Handle whiteboard context
    whiteboard_context = ""
    if whiteboard_image_analysis:
        whiteboard_context = f"Whiteboard/Diagram Analysis:\n{whiteboard_image_analysis}"

    # Default values
    problem_text = problem_context or "(No specific problem provided)"
    role_text = target_role or "Software Engineer"

    # Select persona prompt based on mode
    if mode == "interview":
        system_prompt = INTERVIEWER_SYSTEM_PROMPT.format(
            target_role=role_text,
            problem_context=problem_text,
            code=current_code or "(No code written yet)",
            whiteboard_context=whiteboard_context,
            history=history_text,
            question=user_message
        )
    else:
        system_prompt = COACH_SYSTEM_PROMPT.format(
            target_role=role_text,
            problem_context=problem_text,
            code=current_code or "(No code written yet)",
            whiteboard_context=whiteboard_context,
            history=history_text,
            question=user_message
        )

    # Build message for model
    messages = [{"role": "user", "content": system_prompt}]
    
    try:
        prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        
        response = generate(
            model,
            tokenizer,
            prompt=prompt,
            max_tokens=1024,  # Increased for full code responses
            verbose=False
        )
        
        # Strip Qwen3 thinking tags if present (complete or incomplete)
        import re
        # First try to remove complete <think>...</think> blocks
        response = re.sub(r'<think>.*?</think>\s*', '', response, flags=re.DOTALL)
        # Then remove any incomplete <think> block that wasn't closed
        response = re.sub(r'<think>.*$', '', response, flags=re.DOTALL)
        # Also remove any dangling </think> tags
        response = re.sub(r'</think>\s*', '', response)
        
        return response.strip()
    except Exception as e:
        print(f"❌ Generation Error: {e}")
        if mode == "interview":
            return "Let's pause for a moment. Please continue when you're ready."
        else:
            return "I'm having trouble thinking right now. Let's try again in a moment."


# Keep legacy function for backward compatibility
def ask_mentor(current_code: str, user_question: str, chat_history: List[Dict[str, str]]) -> str:
    """Legacy function - wraps generate_ai_response with coaching mode."""
    return generate_ai_response(
        session_id="legacy",
        user_message=user_question,
        current_code=current_code,
        mode="coaching",
        chat_history=chat_history
    )
