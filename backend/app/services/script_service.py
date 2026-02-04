from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.script import Script
from app.schemas.script import ScriptInput

class ScriptService:
    async def resolve_script(self, db: AsyncSession, script_in: ScriptInput) -> Script:
        """
        Finds or creates a Script based on input.
        - If external_id provided: check DB, if not exists or content changed, create new. 
          (Actually, if external_id matches, we should probably check if content is identical. 
           If not, do we update or create? User said 'If in source changed then new ID'. 
           We'll create a NEW row if content differs, but we can't have duplicate external_ids if we want unique index.
           Wait, I made external_id index=True but not unique=True in the model. So multiple rows can have same external_id.
           This supports versioning by history.)
        - If custom: create new with is_custom=True.
        """
        
        if script_in.external_id:
            # Check for existing latest version of this external script
            # We want the EXACT match on content + external_id to reuse ID
            query = select(Script).where(
                Script.external_id == script_in.external_id,
                Script.question == script_in.question,
                Script.answer == script_in.answer
            )
            result = await db.execute(query)
            existing = result.scalars().first()
            if existing:
                return existing
                
            # If not found (new external ID or content changed), create new
            new_script = Script(
                external_id=script_in.external_id,
                question=script_in.question,
                answer=script_in.answer,
                is_custom=False,
                needs_review=False, # External usually trusted? Or maybe flags if content changed? For now False.
                in_registry_queue=False
            )
            db.add(new_script)
            await db.commit()
            await db.refresh(new_script)
            return new_script
            
        else:
            # Custom script
            # For custom, we always create new? Or deduplicate?
            # User said "add custom script which ... will fall to supervisor".
            # Probably always create new instance associated with this call/proposal.
            new_script = Script(
                question=script_in.question,
                answer=script_in.answer,
                is_custom=True,
                needs_review=script_in.needs_review,
                in_registry_queue=script_in.in_registry_queue
            )
            db.add(new_script)
            await db.commit()
            await db.refresh(new_script)
            return new_script

script_service = ScriptService()
