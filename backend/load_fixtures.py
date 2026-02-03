"""
Скрипт загрузки тестовых фикстур для локальной разработки.

Использование:
    uv run python load_fixtures.py

Опции:
    --force     Принудительная перезагрузка (удаляет существующие данные)
    --no-force  Не удалять данные даже в dev режиме (только добавить недостающие)

Поведение зависит от APP_ENV:
- development (по умолчанию): автоматически --force (очистка + загрузка)
- production: фикстуры ЗАБЛОКИРОВАНЫ (для безопасности)

Этот скрипт загружает тестовые данные из fixtures/data.py:
- Пользователи (админ, операторы)
- Регионы (города)  
- Департаменты (отделы)
- Скрипты (ответы на вопросы)
"""

import asyncio
import sys
from typing import Dict, List, Any

from sqlalchemy import select, delete, text
from sqlalchemy.dialects.postgresql import insert

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import AsyncSessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.region import Region
from app.models.department import Department
from app.models.script import Script

# Import fixtures
from fixtures.data import USERS, REGIONS, DEPARTMENTS, SCRIPTS


class FixtureLoader:
    """Загрузчик тестовых фикстур."""

    def __init__(self, force: bool = False):
        self.force = force
        self.stats = {
            "users": 0,
            "regions": 0,
            "departments": 0,
            "scripts": 0,
        }

    async def load_all(self):
        """Загрузить все фикстуры."""
        print("=" * 60)
        print("🔧 Загрузка тестовых фикстур")
        print(f"   Режим: {settings.APP_ENV}")
        print(f"   Force: {'Да' if self.force else 'Нет'}")
        print("=" * 60)

        async with AsyncSessionLocal() as session:
            if self.force:
                await self._clear_data(session)

            await self._load_users(session)
            await self._load_regions(session)
            await self._load_departments(session)
            await self._load_scripts(session)

            await session.commit()

        self._print_summary()

    async def _clear_data(self, session):
        """Очистить существующие данные (при --force)."""
        print("\n⚠️  Режим --force: удаление существующих данных...")
        
        # Удаляем в правильном порядке (учитываем foreign keys)
        # Сначала удаляем calls (ссылается на users, regions, departments, scripts)
        await session.execute(text("DELETE FROM calls"))
        await session.execute(delete(Script))
        await session.execute(delete(Department))
        await session.execute(delete(Region))
        await session.execute(delete(User))
        await session.commit()
        
        print("   ✓ Данные очищены")

    async def _load_users(self, session):
        """Загрузить пользователей."""
        print("\n👥 Загрузка пользователей...")

        for user_data in USERS:
            # Проверяем, существует ли пользователь
            result = await session.execute(
                select(User).where(User.username == user_data["username"])
            )
            existing = result.scalar_one_or_none()

            if existing:
                print(f"   ⏭️  {user_data['username']} уже существует")
                continue

            # Создаём пользователя
            user = User(
                username=user_data["username"],
                hashed_password=get_password_hash(user_data["password"]),
                role=UserRole(user_data["role"]),
                is_active=user_data["is_active"],
            )
            session.add(user)
            self.stats["users"] += 1
            print(f"   ✓ {user_data['username']} ({user_data['role']})")

        await session.flush()

    async def _load_regions(self, session):
        """Загрузить регионы (города)."""
        print("\n🏙️  Загрузка регионов...")

        for region_data in REGIONS:
            # Проверяем, существует ли регион
            result = await session.execute(
                select(Region).where(Region.code == region_data["code"])
            )
            existing = result.scalar_one_or_none()

            if existing:
                print(f"   ⏭️  {region_data['name']} уже существует")
                continue

            # Создаём регион
            region = Region(
                name=region_data["name"],
                code=region_data["code"],
            )
            session.add(region)
            self.stats["regions"] += 1
            print(f"   ✓ {region_data['name']} ({region_data['code']})")

        await session.flush()

    async def _load_departments(self, session):
        """Загрузить департаменты (отделы)."""
        print("\n🏢 Загрузка департаментов...")

        # Получаем все регионы для связи
        result = await session.execute(select(Region))
        regions = {r.code: r for r in result.scalars().all()}

        for region_code, dept_names in DEPARTMENTS.items():
            region = regions.get(region_code)
            if not region:
                print(f"   ⚠️  Регион {region_code} не найден, пропускаем департаменты")
                continue

            for dept_name in dept_names:
                # Проверяем, существует ли департамент
                result = await session.execute(
                    select(Department).where(
                        Department.name == dept_name,
                        Department.region_id == region.id
                    )
                )
                existing = result.scalar_one_or_none()

                if existing:
                    continue

                # Создаём департамент
                dept = Department(
                    name=dept_name,
                    region_id=region.id,
                )
                session.add(dept)
                self.stats["departments"] += 1

        print(f"   ✓ Загружено департаментов: {self.stats['departments']}")
        await session.flush()

    async def _load_scripts(self, session):
        """Загрузить скрипты (Q&A)."""
        print("\n📝 Загрузка скриптов...")

        for script_data in SCRIPTS:
            # Проверяем по вопросу (простая проверка дубликатов)
            result = await session.execute(
                select(Script).where(Script.question == script_data["question"])
            )
            existing = result.scalar_one_or_none()

            if existing:
                print(f"   ⏭️  Скрипт уже существует: {script_data['question'][:40]}...")
                continue

            # Создаём скрипт
            script = Script(
                question=script_data["question"],
                answer=script_data["answer"],
                is_custom=script_data["is_custom"],
                needs_review=script_data["needs_review"],
            )
            session.add(script)
            self.stats["scripts"] += 1
            print(f"   ✓ {script_data['question'][:50]}...")

        await session.flush()

    def _print_summary(self):
        """Вывести итоговую статистику."""
        print("\n" + "=" * 60)
        print("✅ Загрузка фикстур завершена!")
        print("=" * 60)
        print(f"   👥 Пользователей:   {self.stats['users']}")
        print(f"   🏙️  Регионов:        {self.stats['regions']}")
        print(f"   🏢 Департаментов:   {self.stats['departments']}")
        print(f"   📝 Скриптов:        {self.stats['scripts']}")
        print()
        print("🔑 Тестовые учётные данные:")
        print("   admin / admin (админ)")
        print("   supervisor / supervisor123 (супервизор)")
        print("   operator1 / operator123 (оператор)")
        print()


async def main():
    """Точка входа."""
    # Определяем режим force
    explicit_force = "--force" in sys.argv
    explicit_no_force = "--no-force" in sys.argv
    
    # В production фикстуры ЗАПРЕЩЕНЫ
    if settings.is_production:
        print("=" * 60)
        print("🚫 ОШИБКА: Загрузка фикстур заблокирована в production!")
        print("=" * 60)
        print()
        print("   Текущий APP_ENV:", settings.APP_ENV)
        print()
        print("   Фикстуры предназначены только для локальной разработки.")
        print("   Если вам нужно загрузить данные в production,")
        print("   используйте миграции или административный интерфейс.")
        print()
        sys.exit(1)
    
    # В development режиме автоматически используем --force
    # (если явно не указано --no-force)
    if settings.is_development:
        if explicit_no_force:
            force = False
            print("📋 Development режим: --no-force, добавляем только недостающие данные")
        else:
            force = True
            print("🔄 Development режим: автоматическая очистка и перезагрузка БД")
    else:
        # Неизвестный режим - требуем явного --force
        force = explicit_force
    
    loader = FixtureLoader(force=force)
    await loader.load_all()


if __name__ == "__main__":
    asyncio.run(main())

