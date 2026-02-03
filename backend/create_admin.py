"""
Create initial admin user.

DEPRECATED: Используйте load_fixtures.py для загрузки тестовых данных.
"""
import asyncio
from app.core.security import get_password_hash
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole


async def create_admin():
    """Create admin user if not exists."""
    async with AsyncSessionLocal() as session:
        # Check if admin exists
        from sqlalchemy import select
        result = await session.execute(select(User).where(User.username == "admin"))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print("Admin user already exists")
            return
        
        # Create admin user
        admin = User(
            username="admin",
            hashed_password=get_password_hash("admin"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        print("Admin user created successfully!")
        print("Username: admin")
        print("Password: admin")
        print()
        print("TIP: Для загрузки полного набора тестовых данных используйте:")
        print("     uv run python load_fixtures.py")


if __name__ == "__main__":
    asyncio.run(create_admin())
