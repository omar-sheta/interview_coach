"""
Grading Service for Guided Learning Platform

Provides AI-powered grading and coaching feedback using:
- Qwen3-VL via MLX for vision analysis and grading (runs locally on M4 Max)
"""

import base64
import json
import re
from pathlib import Path
from typing import Dict, Any, Optional

# MLX model path (downloaded from HuggingFace)
MODEL_PATH = Path(__file__).parent.parent / "models" / "qwen3-vl"

# Lazy load MLX modules to avoid import errors if not installed
_model = None
_processor = None


def _load_model():
    """Lazy load the MLX model and processor."""
    global _model, _processor
    
    if _model is None:
        try:
            from mlx_vlm import load, generate
            from mlx_vlm.prompt_utils import apply_chat_template
            from mlx_vlm.utils import load_config
            
            print(f"🔄 Loading Qwen3-VL model from {MODEL_PATH}...")
            _model, _processor = load(str(MODEL_PATH))
            print("✅ Qwen3-VL model loaded successfully!")
        except ImportError as e:
            print(f"❌ MLX-VLM not installed: {e}")
            print("   Install with: pip install mlx-vlm")
            return None, None
        except Exception as e:
            print(f"❌ Failed to load model: {e}")
            return None, None
    
    return _model, _processor


def _generate_response(prompt: str, image_path: Optional[str] = None, max_tokens: int = 2048) -> str:
    """Generate a response using the local Qwen3-VL model."""
    model, processor = _load_model()
    
    if model is None:
        return "[Model not available - please ensure Qwen3-VL is downloaded]"
    
    try:
        from mlx_vlm import generate
        from mlx_vlm.prompt_utils import apply_chat_template
        from mlx_vlm.utils import load_config
        
        # Build messages
        if image_path:
            messages = [
                {"role": "user", "content": [
                    {"type": "image", "image": image_path},
                    {"type": "text", "text": prompt}
                ]}
            ]
        else:
            messages = [
                {"role": "user", "content": prompt}
            ]
        
        # Load config and apply chat template
        config = load_config(MODEL_PATH)
        formatted_prompt = apply_chat_template(processor, config, messages, add_generation_prompt=True)
        
        # Generate response
        output = generate(
            model,
            processor,
            formatted_prompt,
            image=image_path,
            max_tokens=max_tokens,
            verbose=False
        )
        
        # Handle GenerationResult object - extract text content
        if hasattr(output, 'text'):
            return output.text
        elif isinstance(output, str):
            return output
        else:
            return str(output)
        
    except Exception as e:
        print(f"❌ Generation error: {e}")
        return f"[Generation error: {str(e)}]"


def extract_json_from_response(text: str) -> Optional[Dict[str, Any]]:
    """Extract JSON from LLM response, handling markdown code blocks."""
    # Try to find JSON in code blocks first
    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass
    
    # Try to find raw JSON object
    json_match = re.search(r'\{[\s\S]*\}', text)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass
    
    return None


def analyze_image_with_vision(file_path: str) -> str:
    """
    Analyze an uploaded image/diagram using Qwen3-VL.
    
    Args:
        file_path: Path to the uploaded image file
    
    Returns:
        Text description of the technical solution in the image
    """
    prompt = """Analyze this technical diagram/solution image in detail.

Describe:
1. What type of diagram/solution is shown (system design, flowchart, code, etc.)
2. The main components or elements visible
3. The relationships and data flow between components
4. Any labels, annotations, or text visible
5. The overall architecture or approach being demonstrated

Be specific and technical in your analysis."""

    return _generate_response(prompt, image_path=file_path, max_tokens=2048)


def grade_submission(
    question_text: str,
    user_text_answer: str,
    vision_analysis: Optional[str] = None,
    question_type: str = "coding"
) -> Dict[str, Any]:
    """
    Grade a practice submission and provide Socratic coaching feedback.
    
    Args:
        question_text: The original question
        user_text_answer: The user's written answer
        vision_analysis: Optional analysis from vision model if image was uploaded
        question_type: Type of question (coding, system_design, behavioral, technical_concept)
    
    Returns:
        Grading result with score, feedback, and ideal solution
    """
    
    # Build the combined answer context
    answer_context = f"**User's Written Answer:**\n{user_text_answer}"
    if vision_analysis:
        answer_context += f"\n\n**Analysis of Uploaded Diagram/Image:**\n{vision_analysis}"
    
    prompt = f"""You are a Socratic Interview Coach helping a candidate improve their {question_type} skills.

Evaluate this {question_type} answer and provide coaching feedback.

**QUESTION:**
{question_text}

**CANDIDATE'S SUBMISSION:**
{answer_context}

You MUST respond with a valid JSON object following this exact structure:
{{
    "score": 75,
    "score_breakdown": {{
        "correctness": 20,
        "completeness": 15,
        "clarity": 20,
        "optimization": 10,
        "best_practices": 10
    }},
    "strengths": [
        "Strength 1",
        "Strength 2"
    ],
    "areas_to_improve": [
        "Area 1 with specific suggestion",
        "Area 2 with specific suggestion"
    ],
    "what_was_missed": [
        "Key concept or approach that was overlooked"
    ],
    "ideal_solution": "The complete ideal solution with explanation...",
    "coaching_tips": [
        "Actionable tip 1",
        "Actionable tip 2"
    ],
    "follow_up_question": "A question to deepen understanding..."
}}

Score breakdown (out of 100):
- Correctness (0-25): Is the solution correct?
- Completeness (0-25): Does it handle edge cases?
- Clarity (0-20): Is the explanation/code clear?
- Optimization (0-15): Is it efficient?
- Best Practices (0-15): Does it follow good practices?

Respond ONLY with valid JSON."""

    try:
        response_text = _generate_response(prompt, max_tokens=4096)
        
        # Parse JSON from response
        grading = extract_json_from_response(response_text)
        
        if grading and "score" in grading:
            return grading
        else:
            # Return fallback grading if parsing fails
            return _create_fallback_grading(response_text)
            
    except Exception as e:
        print(f"❌ Grading error: {e}")
        return _create_error_grading(str(e))


def _create_fallback_grading(raw_response: str) -> Dict[str, Any]:
    """Create a fallback grading when JSON parsing fails."""
    return {
        "score": 50,
        "score_breakdown": {
            "correctness": 15,
            "completeness": 10,
            "clarity": 10,
            "optimization": 10,
            "best_practices": 5
        },
        "strengths": ["Attempted the problem"],
        "areas_to_improve": ["Review the AI feedback below"],
        "what_was_missed": ["Unable to parse structured feedback"],
        "ideal_solution": raw_response if raw_response else "Unable to generate ideal solution.",
        "coaching_tips": ["Try breaking down the problem into smaller parts"],
        "follow_up_question": "What was the most challenging part of this problem for you?"
    }


def _create_error_grading(error_message: str) -> Dict[str, Any]:
    """Create an error grading response."""
    return {
        "score": 0,
        "score_breakdown": {
            "correctness": 0,
            "completeness": 0,
            "clarity": 0,
            "optimization": 0,
            "best_practices": 0
        },
        "strengths": [],
        "areas_to_improve": [f"Grading service error: {error_message}"],
        "what_was_missed": [],
        "ideal_solution": "Unable to generate due to service error.",
        "coaching_tips": ["Please try again later or check if the model is loaded."],
        "follow_up_question": None,
        "error": error_message
    }


def check_model_available() -> bool:
    """Check if the local Qwen3-VL model is available."""
    if not MODEL_PATH.exists():
        return False
    
    # Check for model files
    safetensor_files = list(MODEL_PATH.glob("*.safetensors"))
    return len(safetensor_files) >= 1


def get_model_status() -> Dict[str, Any]:
    """Get status of the local model."""
    model_exists = MODEL_PATH.exists()
    safetensor_files = list(MODEL_PATH.glob("*.safetensors")) if model_exists else []
    
    return {
        "model_path": str(MODEL_PATH),
        "model_exists": model_exists,
        "safetensor_files": len(safetensor_files),
        "ready": len(safetensor_files) >= 4,  # Need all 4 shards
        "message": "Model ready" if len(safetensor_files) >= 4 else f"Downloading... ({len(safetensor_files)}/4 shards)"
    }
