import asyncio
import httpx

async def main():
    async with httpx.AsyncClient(base_url="http://localhost:8000/api/v1") as client:
        # 1. Login
        print("Logging in...")
        resp = await client.post("/auth/login", data={"username": "admin", "password": "admin"})
        if resp.status_code != 200:
             print("Login failed:", resp.text)
             return
        token = resp.json()["access_token"]
        print("Got token")
        
        # 2. Create Call with Script
        print("Creating Call with Script...")
        payload = {
            "question": "API Test Q",
            "script": {
                "question": "API Script Q",
                "answer": "API Script A",
                "is_custom": True,
                "needs_review": True
            }
        }
        resp = await client.post("/calls/", json=payload, headers={"Authorization": f"Bearer {token}"})
        print("Create Call Status:", resp.status_code)
        print("Create Call Response:", resp.text)
        
        if resp.status_code == 201:
            data = resp.json()
            # Check script part
            # Note: response model CallRead might have 'script' field populated
            if data.get("script") and data["script"]["question"] == "API Script Q":
                print("SUCCESS: Script linked correctly")
            else:
                 print("FAILURE: Script not linked or incorrect. Response:", data)

if __name__ == "__main__":
    asyncio.run(main())
