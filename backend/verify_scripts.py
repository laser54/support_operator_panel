import asyncio
import sys
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.script import Script
from app.models.call import Call
from app.services.script_service import script_service
from app.schemas.script import ScriptInput

async def verify():
    async with AsyncSessionLocal() as db:
        print("Verifying Script Integration...")
        
        # 1. Test "Select KB" flow (External ID)
        script_in = ScriptInput(
            question="Test KB Question",
            answer="Test KB Answer",
            external_id="ext-123",
            is_custom=False
        )
        script_1 = await script_service.resolve_script(db, script_in)
        print(f"Created/Found Script 1: ID={script_1.id}, Ext={script_1.external_id}")
        
        # Verify idempotency
        script_1b = await script_service.resolve_script(db, script_in)
        assert script_1.id == script_1b.id, "Should return same script for same external_id+content"
        print("Idempotency check passed.")
        
        # 2. Test "Custom Script" flow
        custom_in = ScriptInput(
            question="Custom Q",
            answer="Custom A",
            is_custom=True,
            needs_review=True
        )
        script_2 = await script_service.resolve_script(db, custom_in)
        print(f"Created Custom Script 2: ID={script_2.id}, Custom={script_2.is_custom}, Review={script_2.needs_review}")
        
        # 3. Test Linking to Call
        # Need an operator
        result = await db.execute(select(User).limit(1))
        user = result.scalars().first()
        if not user:
            print("No user found, skipping call link test (create a user first)")
            return

        print(f"Linking to User: {user.username}")
        new_call = Call(
            operator_id=user.id,
            question="Call Question",
            solution="Call Solution",
            script_id=script_1.id
        )
        db.add(new_call)
        await db.commit()
        await db.refresh(new_call)
        
        print(f"Created Call: ID={new_call.id}, Linked Script ID={new_call.script_id}")
        assert new_call.script_id == script_1.id, "Call should be linked to script 1"
        
        print("Verification Successful!")

if __name__ == "__main__":
    asyncio.run(verify())
