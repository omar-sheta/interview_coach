
import asyncio
from ddgs import DDGS
from crawl4ai import AsyncWebCrawler

class JobAnalyst:
    _cache = {}  # Simple in-memory cache: {role_title: skills_result}


    def __init__(self):
        self.ddgs = DDGS()

    def search_job_context(self, role_title: str) -> list[str]:
        """
        Phase 1: Find recent job descriptions for this role.
        Uses broader queries to increase hit rate.
        """
        print(f"🕵️ Searching for real-world context for: {role_title}...")
        
        # Extract core role keywords (strip company names)
        core_role = role_title.lower()
        for company in ["at google", "at meta", "at amazon", "at microsoft", "at apple", "at openai"]:
            core_role = core_role.replace(company, "").strip()
        
        # Try multiple query variations for robustness
        # Use simple keywords, NOT quoted phrases
        queries = [
            f"{core_role} skills requirements 2025",
            f"{core_role} job description",
            f"senior {core_role} skills",
        ]
        
        all_urls = []
        for query in queries:
            try:
                print(f"   🔍 Trying: {query}")
                # ddgs.text() returns a generator, must consume it
                results = list(self.ddgs.text(query, max_results=2))
                print(f"   📊 Got {len(results)} results")
                if results:
                    urls = [r['href'] for r in results]
                    all_urls.extend(urls)
                    if len(all_urls) >= 3:
                        break
            except Exception as e:
                print(f"   ⚠️ Query failed: {e}")
                continue
        
        if not all_urls:
            print("   ❌ No results from any query.")
            return []
            
        # Dedupe and limit
        unique_urls = list(dict.fromkeys(all_urls))[:3]
        print(f"   ✅ Found {len(unique_urls)} URLs")
        return unique_urls

    async def gather_skills(self, role_title: str, callback=None) -> str:
        """
        Phase 2: Scrape and Summarize with callback for streaming updates.
        Checks cache first. Now with DETAILED progress messages.
        """
        # Check cache
        if role_title in self._cache:
            if callback: await callback(f"✓ Using cached market data for '{role_title}'")
            return self._cache[role_title]

        # Extract core role
        core_role = role_title.lower()
        for company in ["at google", "at meta", "at amazon", "at microsoft", "at apple", "at openai"]:
            core_role = core_role.replace(company, "").strip()

        if callback: await callback(f"🔍 Searching DDG for: '{core_role} skills 2025'...")
        
        # Run synchronous DDG search in executor
        loop = asyncio.get_event_loop()
        urls = await loop.run_in_executor(None, self.search_job_context, role_title)
        
        if not urls:
            if callback: await callback("⚠️ No search results. Using default context.")
            return "Standard industry requirements"

        # Show what we found
        if callback: 
            await callback(f"✓ Found {len(urls)} job postings:")
            for url in urls:
                domain = url.split('//')[-1].split('/')[0]
                await callback(f"   → {domain}")
        
        combined_text = ""
        crawled_count = 0

        # 3. Scrape the content (Async)
        if callback: await callback("📖 Extracting job requirements...")
        
        async with AsyncWebCrawler(verbose=False) as crawler:  # verbose=False for cleaner logs
            for url in urls:
                try:
                    domain = url.split('//')[-1].split('/')[0]
                    if callback: await callback(f"   Crawling {domain}...")
                    
                    result = await crawler.arun(url=url)
                    if result and result.markdown:
                        text_snippet = result.markdown[:300].replace('\n', ' ')[:100]
                        if callback: await callback(f"   ✓ Got ~{len(result.markdown)} chars: '{text_snippet}...'")
                        combined_text += result.markdown[:1500] + "\n\n"
                        crawled_count += 1
                except Exception as e:
                    if callback: await callback(f"   ✗ Failed: {domain} ({str(e)[:30]})")

        if not combined_text:
            if callback: await callback("⚠️ No content extracted. Using defaults.")
            return "Standard industry requirements"

        if callback: await callback(f"🧠 Analyzing {crawled_count} pages with Qwen3...")

        # 4. Use Qwen to extract the signal
        from server.services.curriculum_service import _load_model, _generate_response
        model, tokenizer = _load_model()
        if not model:
            if callback: await callback("❌ Model failed to load!")
            return "Standard industry requirements (Model Error)"
        
        prompt = f"""
        Role: {role_title}
        Raw Job Descriptions:
        {combined_text[:6000]} 
        
        Task: Identify the top 5 most critical technical technologies and patterns mentioned.
        Output: A concise comma-separated list.
        """
        
        response = _generate_response(prompt, "You are a precise data analyst.", max_tokens=200)
        clean_response = response.strip()
        
        if callback: await callback(f"✓ Market Skills: {clean_response}")
        
        # Cache result
        self._cache[role_title] = clean_response
        return clean_response

        # 4. Use Qwen to extract the signal from the noise
        from server.services.curriculum_service import _load_model, _generate_response
        model, tokenizer = _load_model()
        if not model:
            if callback: await callback("Error: Model failed to load.")
            return "Standard industry requirements (Model Error)"
        
        prompt = f"""
        Role: {role_title}
        Raw Job Descriptions:
        {combined_text[:6000]} 
        
        Task: Identify the top 5 most critical technical technologies and patterns mentioned in these descriptions.
        Output: A concise comma-separated list.
        """
        
        system_prompt = "You are a precise data analyst."
        
        # We can stream the generation here too if we want "thinking" effect
        # For now, just generate.
        response = _generate_response(prompt, system_prompt, max_tokens=200)
        
        # Clean up response
        clean_response = response.strip()
        
        if callback: await callback(f"Identified Market Skills: {clean_response}")
        
        # Cache result
        self._cache[role_title] = clean_response
        return clean_response
