"""
Curriculum Service for Guided Learning Platform

Generates personalized learning roadmaps using Qwen3-32B via MLX (runs locally on M4 Max).
"""

import json
import re
from pathlib import Path
from typing import Dict, Any, Optional

# MLX model path (downloaded from HuggingFace)
MODEL_PATH = Path(__file__).parent.parent / "models" / "qwen3-32b"

# Lazy load MLX modules
_model = None
_tokenizer = None


def _load_model():
    """Lazy load the MLX model and tokenizer."""
    global _model, _tokenizer
    
    if _model is None:
        try:
            from mlx_lm import load
            
            print(f"🔄 Loading Qwen3-32B model from {MODEL_PATH}...")
            _model, _tokenizer = load(str(MODEL_PATH))
            print("✅ Qwen3-32B model loaded successfully!")
        except ImportError as e:
            print(f"❌ MLX-LM not installed: {e}")
            print("   Install with: pip install mlx-lm")
            return None, None
        except Exception as e:
            print(f"❌ Failed to load model: {e}")
            return None, None
    
    return _model, _tokenizer


def _generate_response(prompt: str, system_prompt: str = "", max_tokens: int = 4096) -> str:
    """Generate a response using the local Qwen3-32B model."""
    model, tokenizer = _load_model()
    
    if model is None:
        return ""
    
    try:
        from mlx_lm import generate
        
        # Build messages for chat format
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        # Apply chat template
        formatted_prompt = tokenizer.apply_chat_template(
            messages, 
            tokenize=False, 
            add_generation_prompt=True
        )
        
        # Generate response
        output = generate(
            model,
            tokenizer,
            prompt=formatted_prompt,
            max_tokens=max_tokens,
            verbose=False
        )
        
        return output
        
    except Exception as e:
        print(f"❌ Generation error: {e}")
        return ""


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


def generate_curriculum(cv_text: str, target_role: str) -> Dict[str, Any]:
    """
    Generate a 4-week learning curriculum based on CV and target role.
    
    Args:
        cv_text: Extracted text from the user's CV/resume
        target_role: The role the user is preparing for (e.g., "Senior Backend Engineer")
    
    Returns:
        A structured curriculum with modules, goals, and practice questions
    """
    
    system_prompt = """You are an expert technical interview coach and career advisor. 
Your task is to analyze a candidate's CV and create a personalized 4-week learning plan 
to prepare them for their target role.

You MUST respond with a valid JSON object following this exact structure:
{
    "weak_points": [
        "Weakness 1 identified from CV",
        "Weakness 2 identified from CV", 
        "Weakness 3 identified from CV"
    ],
    "modules": [
        {
            "week": 1,
            "id": "module_1",
            "title": "Module Title",
            "focus_area": "Main focus area",
            "goals": ["Goal 1", "Goal 2", "Goal 3"],
            "practice_questions": [
                {
                    "id": "q1_1",
                    "type": "coding",
                    "difficulty": "medium",
                    "question": "Full question text",
                    "hints": ["Hint 1", "Hint 2"]
                }
            ]
        }
    ],
    "total_estimated_hours": 40,
    "recommended_resources": ["Resource 1", "Resource 2"]
}

Include 4 modules (one per week), each with 3-5 practice questions. 
Question types can be: "coding", "system_design", "behavioral", "technical_concept"."""

    user_prompt = f"""Analyze the following CV and create a 4-week learning plan for the target role.

TARGET ROLE: {target_role}

CV CONTENT:
{cv_text}

Identify the top 3 weak points based on the CV relative to the target role, 
then create a structured 4-week curriculum to address these gaps.
Respond ONLY with valid JSON."""

    try:
        response_text = _generate_response(user_prompt, system_prompt, max_tokens=4096)
        
        # Parse JSON from response
        curriculum = extract_json_from_response(response_text)
        
        if curriculum:
            # Validate required fields
            if "modules" not in curriculum:
                curriculum["modules"] = []
            if "weak_points" not in curriculum:
                curriculum["weak_points"] = []
            return curriculum
        else:
            # Return a fallback structure if parsing fails
            return _create_fallback_curriculum(target_role)
            
    except Exception as e:
        print(f"❌ Curriculum generation error: {e}")
        return _create_fallback_curriculum(target_role)


def _create_fallback_curriculum(target_role: str) -> Dict[str, Any]:
    """Create a generic fallback curriculum when LLM fails."""
    return {
        "weak_points": [
            "Unable to analyze CV - please review manually",
            "Consider reviewing core concepts for target role",
            "Focus on practical coding exercises"
        ],
        "modules": [
            {
                "week": 1,
                "id": "module_1",
                "title": "Data Structures & Algorithms Fundamentals",
                "focus_area": "Core DSA",
                "goals": [
                    "Master array and string manipulation",
                    "Understand hash tables and their applications",
                    "Practice time/space complexity analysis"
                ],
                "practice_questions": [
                    {
                        "id": "q1_1",
                        "type": "coding",
                        "difficulty": "easy",
                        "question": "Implement a function to reverse a string in-place.",
                        "hints": ["Use two pointers", "Consider edge cases"]
                    },
                    {
                        "id": "q1_2",
                        "type": "coding",
                        "difficulty": "medium",
                        "question": "Design a HashMap from scratch with get, put, and delete operations.",
                        "hints": ["Handle collisions", "Consider load factor"]
                    }
                ]
            },
            {
                "week": 2,
                "id": "module_2",
                "title": "Advanced Data Structures",
                "focus_area": "Trees, Graphs, Heaps",
                "goals": [
                    "Master binary tree traversals",
                    "Understand graph algorithms (BFS, DFS)",
                    "Apply heaps for priority-based problems"
                ],
                "practice_questions": [
                    {
                        "id": "q2_1",
                        "type": "coding",
                        "difficulty": "medium",
                        "question": "Implement level-order traversal of a binary tree.",
                        "hints": ["Use a queue", "Track level boundaries"]
                    }
                ]
            },
            {
                "week": 3,
                "id": "module_3",
                "title": "System Design Fundamentals",
                "focus_area": "Scalability & Architecture",
                "goals": [
                    "Understand load balancing strategies",
                    "Learn about database sharding",
                    "Design for high availability"
                ],
                "practice_questions": [
                    {
                        "id": "q3_1",
                        "type": "system_design",
                        "difficulty": "medium",
                        "question": f"Design a URL shortener service for {target_role} interview.",
                        "hints": ["Consider scale", "Think about data storage"]
                    }
                ]
            },
            {
                "week": 4,
                "id": "module_4",
                "title": "Behavioral & Mock Interviews",
                "focus_area": "Interview Skills",
                "goals": [
                    "Practice STAR method for behavioral questions",
                    "Conduct mock coding interviews",
                    "Review and consolidate learnings"
                ],
                "practice_questions": [
                    {
                        "id": "q4_1",
                        "type": "behavioral",
                        "difficulty": "medium",
                        "question": "Tell me about a time you had to deal with a difficult technical decision.",
                        "hints": ["Use STAR method", "Focus on your specific contribution"]
                    }
                ]
            }
        ],
        "total_estimated_hours": 40,
        "recommended_resources": [
            "LeetCode Premium",
            "System Design Primer (GitHub)",
            "Cracking the Coding Interview"
        ]
    }


def check_model_available() -> bool:
    """Check if the local Qwen3-32B model is available."""
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
