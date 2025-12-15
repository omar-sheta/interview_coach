"""
EngCoach Curriculum Service

Generates personalized learning roadmaps for ANY engineering role using Qwen3.
Supports dynamic role detection and role-specific curriculum generation.
"""

import json
import re
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional, List

# MLX model path (downloaded from HuggingFace)
MODEL_PATH = Path(__file__).parent.parent / "models" / "qwen3-32b"

# Lazy load MLX modules
_model = None
_tokenizer = None


# Role-specific focus areas for curriculum generation
ROLE_FOCUS_AREAS = {
    "embedded": ["RTOS Fundamentals", "I2C/SPI/UART Protocols", "Memory Management", "Interrupt Handling", "Low-Power Design"],
    "fpga": ["Verilog/VHDL", "Timing Analysis", "State Machines", "Clock Domain Crossing", "FPGA Architecture"],
    "hardware": ["PCB Design", "Signal Integrity", "Power Distribution", "EMC/EMI", "Schematic Review"],
    "frontend": ["DOM Manipulation", "Rendering Patterns", "Accessibility (A11y)", "Performance Optimization", "State Management"],
    "backend": ["API Design", "Database Optimization", "Caching Strategies", "Microservices", "System Scaling"],
    "devops": ["CI/CD Pipelines", "Infrastructure as Code", "Container Orchestration", "Monitoring & Logging", "Cloud Architecture"],
    "ml": ["Model Training", "Feature Engineering", "MLOps", "Model Evaluation", "Data Pipelines"],
    "data": ["SQL Optimization", "Data Modeling", "ETL Pipelines", "Data Warehousing", "Analytics"],
    "security": ["Threat Modeling", "Penetration Testing", "Secure Coding", "Authentication/Authorization", "Cryptography"],
    "mobile": ["Platform-Specific APIs", "Performance Optimization", "Offline-First Design", "Push Notifications", "App Architecture"],
}


def _detect_role_category(target_role: str) -> str:
    """Detect the role category from the target role string."""
    role_lower = target_role.lower()
    
    if any(kw in role_lower for kw in ["embedded", "firmware", "rtos", "microcontroller"]):
        return "embedded"
    elif any(kw in role_lower for kw in ["fpga", "verilog", "vhdl", "asic"]):
        return "fpga"
    elif any(kw in role_lower for kw in ["hardware", "pcb", "electrical", "circuit"]):
        return "hardware"
    elif any(kw in role_lower for kw in ["frontend", "react", "vue", "angular", "ui", "ux"]):
        return "frontend"
    elif any(kw in role_lower for kw in ["backend", "api", "server", "node", "python", "java", "go"]):
        return "backend"
    elif any(kw in role_lower for kw in ["devops", "sre", "infrastructure", "cloud", "aws", "gcp", "azure"]):
        return "devops"
    elif any(kw in role_lower for kw in ["ml", "machine learning", "ai", "deep learning", "data scientist"]):
        return "ml"
    elif any(kw in role_lower for kw in ["data engineer", "analytics", "etl", "data platform"]):
        return "data"
    elif any(kw in role_lower for kw in ["security", "cybersecurity", "infosec", "penetration"]):
        return "security"
    elif any(kw in role_lower for kw in ["mobile", "ios", "android", "react native", "flutter"]):
        return "mobile"
    else:
        return "backend"  # Default fallback


def extract_skills(text: str) -> List[str]:
    """
    Extract technical skills from text using keyword matching.
    Fast operation for initial UI feedback.
    """
    text_lower = text.lower()
    
    # Common tech keywords to look for
    keywords = [
        "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "php", "ruby", "swift", "kotlin",
        "react", "vue", "angular", "svelte", "next.js", "node.js", "express", "django", "flask", "fastapi", "spring",
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins", "gitlab", "github actions",
        "postgres", "mysql", "mongodb", "redis", "elasticsearch", "kafka", "rabbitmq",
        "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "opencv",
        "linux", "bash", "git", "agile", "scrum", "microservices", "rest api", "graphql",
        "verilog", "vhdl", "fpga", "rtos", "embedded", "pcb", "assembly", "cuda"
    ]
    
    found_skills = []
    for kw in keywords:
        # Match whole word
        if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
            # Capitalize nicely for display
            clean_kw = kw.title()
            if kw in ["aws", "gcp", "php", "sql", "pcb", "fpga", "rtos", "cuda"]:
                clean_kw = kw.upper()
            elif kw == "javascript": clean_kw = "JavaScript"
            elif kw == "typescript": clean_kw = "TypeScript"
            elif kw == "next.js": clean_kw = "Next.js"
            elif kw == "node.js": clean_kw = "Node.js"
            elif kw == "react": clean_kw = "React"
            elif kw == "vue": clean_kw = "Vue"
            elif kw == "github actions": clean_kw = "GitHub Actions"
            
            found_skills.append(clean_kw)
            
    return found_skills[:10]  # Return top 10 unique matches


def generate_market_analysis(target_role: str) -> Dict[str, Any]:
    """
    Simulate a market search by asking the LLM for current trends.
    Returns structured data about the role's market status.
    """
    role_category = _detect_role_category(target_role)
    
    prompt = f"""
    Act as a Technical Industry Analyst.
    Perform a "market scan" for the role: {target_role}.
    
    Provide the following data in JSON format:
    1. "top_requirements": List of 5 critical technical skills currently in high demand for this role.
    2. "emerging_tech": List of 3 emerging technologies or tools relevant to this role in 2024/2025.
    3. "salary_range": A realistic salary range string (e.g. "$120k - $160k").
    4. "demand_level": "High", "Medium", or "Low".
    
    JSON only, no markdown formatting.
    """
    
    import concurrent.futures
    from mlx_lm import stream_generate
    
    system_prompt = "You are a precise data extraction engine. Output valid JSON only."
    
    # Non-streaming fallback logic (kept for robustness)
    def run_inference():
        response = _generate_response(prompt, system_prompt, max_tokens=1024)
        # Clean response to ensure valid JSON
        json_str = response.strip()
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0].strip()
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0].strip()
        return json.loads(json_str)

    try:
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(run_inference)
            data = future.result(timeout=25)
            return data
            
    except concurrent.futures.TimeoutError:
        print(f"⚠️ Market analysis timed out (25sLimit). Using fallback data.")
        return {
            "top_requirements": ["System Design", "Cloud Infrastructure", "Scalable Architecture", "API Security", "CI/CD"],
            "emerging_tech": ["AI-Assisted Coding", "Serverless v2", "Internal Developer Platforms"],
            "salary_range": "$130k - $170k",
            "demand_level": "High (Fallback)"
        }
    except Exception as e:
        print(f"❌ Market analysis failed: {e}")
        return {
            "top_requirements": ["System Design", "Cloud Infrastructure", "Scalable Architecture", "API Security", "CI/CD"],
            "emerging_tech": ["AI-Assisted Coding", "Serverless v2", "Internal Developer Platforms"],
            "salary_range": "$130k - $170k",
            "demand_level": "High"
        }


# Import JobAnalyst
from server.services.job_search_service import JobAnalyst

async def stream_market_analysis(target_role: str):
    """
    Generator that streams the market analysis tokens in real-time.
    Uses JobAnalyst to find real-world context first.
    """
    analyst = JobAnalyst()
    
    # Define simple async callback to yield messages to the stream
    queue = asyncio.Queue()
    
    async def progress_callback(msg):
        await queue.put(msg + "\n")

    # Run gather_skills in background task so we can consume queue
    task = asyncio.create_task(analyst.gather_skills(target_role, callback=progress_callback))
    
    # Stream logs from queue
    while not task.done():
        try:
            # Wait for message or task completion
            # We use a short timeout to check task status frequently
            msg = await asyncio.wait_for(queue.get(), timeout=0.1)
            yield msg
        except asyncio.TimeoutError:
            continue
            
    # Flush remaining messages
    while not queue.empty():
        yield await queue.get()
        
    # Check result
    result = await task
    # yield f"\nFinal Skills: {result}\n" # Optional, frontend parses logs anyway


async def generate_track(cv_text: str, target_role: str) -> Dict[str, Any]:
    """
    Generate a 4-week learning track based on role and CV.
    Now enriched with REAL-TIME market data.
    """
    # 1. Get Real-Time Market Data (Hit cache if stream already ran)
    print(f"🔄 [Generate] Fetching market context for {target_role}...")
    analyst = JobAnalyst()
    # No callback needed for synthesis phase, just get result (fast if cached)
    real_world_skills = await analyst.gather_skills(target_role)
    print(f"✅ [Generate] Using skills: {real_world_skills}")

    role_category = _detect_role_category(target_role)
    focus_areas = ROLE_FOCUS_AREAS.get(role_category, [])
    
    # 2. Generate Curriculum
    prompt = f"""
    Act as a Principal Engineering Mentor.
    Create a highly personalized 4-Week Learning Plan (JSON) for a user targeting the role: {target_role}.
    
    CRITICAL MARKET CONTEXT:
    The current job market specifically demands these skills for this role: {real_world_skills}.
    Ensure the curriculum heavily emphasizes these specific technologies where appropriate.
    
    User's Current CV/Skills:
    {cv_text[:2000]}
    
    Role Focus Areas (General): {", ".join(focus_areas)}
    
    Structure the JSON exactly as follows:
    {{
        "weeks": [
            {{
                "week_number": 1,
                "theme": "Week 1 Theme",
                "goal": "Week 1 Goal",
                "topics": ["Topic 1", "Topic 2", "Topic 3"],
                "project": "Project Title & Description"
            }},
            ... (Weeks 2-4)
        ]
    }}
    
    JSON only. No markdown.
    """
    
    system_prompt = "You are a JSON-only response engine. Provide valid JSON for a learning curriculum."
    
    json_response = _generate_response(prompt, system_prompt, max_tokens=2048)
    
    # Parse JSON (resilient)
    try:
        curriculum = json.loads(json_response)
    except json.JSONDecodeError:
        # Try to fix "```json" wrapping
        clean_json = json_response.replace("```json", "").replace("```", "").strip()
        try:
            curriculum = json.loads(clean_json)
        except:
             # Fallback
             print("❌ Failed to parse JSON, using fallback.")
             curriculum = {"weeks": [{"week_number": 1, "theme": "Fundamentals", "goal": "Build core skills", "topics": ["Basics"], "project": "Starter Project"}]}

    return curriculum


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


def generate_track(cv_text: str, target_role: str) -> Dict[str, Any]:
    """
    Generate a dynamic learning track for ANY engineering role.
    
    Args:
        cv_text: Extracted text from the user's CV/resume
        target_role: The role the user is preparing for (e.g., "FPGA Engineer", "DevOps Lead")
    
    Returns:
        A structured curriculum with modules, goals, and practice scenarios
    """
    
    # Detect role category for focus areas
    role_category = _detect_role_category(target_role)
    focus_areas = ROLE_FOCUS_AREAS.get(role_category, ROLE_FOCUS_AREAS["backend"])
    
    system_prompt = f"""You are a Principal Engineering Mentor with 20+ years of experience.
Your task is to analyze a candidate's CV and create a personalized 4-week study plan 
to prepare them for their target role: {target_role}.

Based on the role category ({role_category}), focus on these areas: {', '.join(focus_areas)}.

You MUST respond with a valid JSON object following this exact structure:
{{
    "target_role": "{target_role}",
    "role_category": "{role_category}",
    "cv_summary": "Brief summary of candidate's background",
    "gap_analysis": [
        "Gap 1 identified from CV relative to target role",
        "Gap 2 identified from CV",
        "Gap 3 identified from CV"
    ],
    "modules": [
        {{
            "week": 1,
            "id": "module_1",
            "title": "Module Title",
            "focus_area": "Main focus area from the list above",
            "description": "What this module covers and why it matters for the role",
            "goals": ["Goal 1", "Goal 2", "Goal 3"],
            "problem_scenario": "A realistic problem scenario the candidate would face in this role"
        }}
    ],
    "recommended_language": "Primary programming language for this role",
    "total_estimated_hours": 40
}}

Create 4 modules (one per week), each with a realistic problem_scenario that mirrors real interview questions for {target_role}.

IMPORTANT: Do NOT use generic software engineering topics. Be SPECIFIC to {target_role}."""

    user_prompt = f"""Analyze the following CV and create a 4-week learning plan for: {target_role}

CV CONTENT:
{cv_text if cv_text else "No CV provided - create a general curriculum for the target role."}

Create a structured 4-week curriculum that will take this candidate from their current level to interview-ready for {target_role}.
Respond ONLY with valid JSON."""

    try:
        response_text = _generate_response(user_prompt, system_prompt, max_tokens=4096)
        
        # Parse JSON from response
        curriculum = extract_json_from_response(response_text)
        
        if curriculum:
            # Ensure required fields
            curriculum["target_role"] = target_role
            curriculum["role_category"] = role_category
            if "modules" not in curriculum:
                curriculum["modules"] = []
            if "gap_analysis" not in curriculum:
                curriculum["gap_analysis"] = []
            return curriculum
        else:
            # Return a fallback structure if parsing fails
            return _create_fallback_curriculum(target_role, role_category, focus_areas)
            
    except Exception as e:
        print(f"❌ Curriculum generation error: {e}")
        return _create_fallback_curriculum(target_role, role_category, focus_areas)


def _create_fallback_curriculum(target_role: str, role_category: str, focus_areas: list) -> Dict[str, Any]:
    """Create a role-specific fallback curriculum when LLM fails."""
    
    # Language mapping by role
    language_map = {
        "embedded": "C/C++",
        "fpga": "Verilog/SystemVerilog",
        "hardware": "Python (Scripting)",
        "frontend": "TypeScript",
        "backend": "Python",
        "devops": "Python/Bash",
        "ml": "Python",
        "data": "SQL/Python",
        "security": "Python",
        "mobile": "Swift/Kotlin",
    }
    
    return {
        "target_role": target_role,
        "role_category": role_category,
        "cv_summary": "CV analysis pending - using general curriculum",
        "gap_analysis": [
            f"Review core concepts for {target_role}",
            f"Practice with {focus_areas[0]} problems",
            f"Build hands-on experience with {focus_areas[1]}"
        ],
        "modules": [
            {
                "week": 1,
                "id": "module_1",
                "title": f"{focus_areas[0]} Fundamentals",
                "focus_area": focus_areas[0],
                "description": f"Master the core concepts of {focus_areas[0]} essential for {target_role}.",
                "goals": [
                    f"Understand {focus_areas[0]} principles",
                    "Complete 3 hands-on exercises",
                    "Build a mini-project"
                ],
                "problem_scenario": f"Design and implement a solution involving {focus_areas[0]} for a real-world {target_role} use case."
            },
            {
                "week": 2,
                "id": "module_2",
                "title": f"{focus_areas[1]} Deep Dive",
                "focus_area": focus_areas[1],
                "description": f"Advanced concepts in {focus_areas[1]} for interview preparation.",
                "goals": [
                    f"Master {focus_areas[1]} patterns",
                    "Debug common issues",
                    "Optimize performance"
                ],
                "problem_scenario": f"Troubleshoot and optimize a {focus_areas[1]} implementation under constraints."
            },
            {
                "week": 3,
                "id": "module_3",
                "title": f"{focus_areas[2]} Practical Application",
                "focus_area": focus_areas[2],
                "description": f"Real-world application of {focus_areas[2]} in {target_role} contexts.",
                "goals": [
                    "Design system architecture",
                    "Implement end-to-end solution",
                    "Present technical decisions"
                ],
                "problem_scenario": f"Given a business requirement, design and implement a {focus_areas[2]} solution."
            },
            {
                "week": 4,
                "id": "module_4",
                "title": "Interview Simulation & Review",
                "focus_area": "Interview Skills",
                "description": f"Mock interviews and consolidation for {target_role} interviews.",
                "goals": [
                    "Complete 2 mock technical interviews",
                    "Practice behavioral questions",
                    "Review and strengthen weak areas"
                ],
                "problem_scenario": f"Full mock interview simulation for {target_role} position."
            }
        ],
        "recommended_language": language_map.get(role_category, "Python"),
        "total_estimated_hours": 40
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
        "ready": len(safetensor_files) >= 4,
        "message": "Model ready" if len(safetensor_files) >= 4 else f"Downloading... ({len(safetensor_files)}/4 shards)"
    }
