import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings

class KnowledgeBaseService:
    def __init__(self):
        self.base_url = settings.KNOWLEDGE_BASE_URL.rstrip('/')
        self.password = settings.KNOWLEDGE_BASE_PASSWORD
        self.client = httpx.AsyncClient(timeout=10.0, verify=False) # Skip SSL check for QA if needed
        self.cookies: Optional[httpx.Cookies] = None

    async def _login(self):
        """Authenticates with the external Knowledge Base."""
        url = f"{self.base_url}/api/auth/login"
        print(f"[KB] Attempting login to {url}")
        response = await self.client.post(url, json={"password": self.password})
        if response.status_code == 200:
            print("[KB] Login successful")
            self.cookies = response.cookies
        else:
            print(f"[KB] Login failed: {response.status_code} - {response.text}")
            raise Exception(f"Failed to login to Knowledge Base: {response.text}")

    async def search(self, query: str, top_k: int = 5) -> Dict[str, Any]:
        """Proxies search request to the external Knowledge Base."""
        if not self.cookies:
            await self._login()

        url = f"{self.base_url}/api/search"
        params = {"query": query, "topK": top_k}
        print(f"[KB] Searching KB for: {query}")
        
        response = await self.client.get(url, params=params, cookies=self.cookies)
        print(f"[KB] Search response status: {response.status_code}")
        
        # If unauthorized, try to re-login once
        if response.status_code == 401:
            await self._login()
            response = await self.client.get(url, params=params, cookies=self.cookies)
            
        if response.status_code != 200:
            raise Exception(f"Search failed: {response.text}")
            
        return response.json()

kb_service = KnowledgeBaseService()
