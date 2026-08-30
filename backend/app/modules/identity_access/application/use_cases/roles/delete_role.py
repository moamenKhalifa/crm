from __future__ import annotations

from uuid import UUID

from app.modules.identity_access.domain.errors import RoleNotFoundError
from app.modules.identity_access.domain.ports.repositories import RoleRepository


class DeleteRole:
    def __init__(self, role_repo: RoleRepository) -> None:
        self._role_repo = role_repo

    async def execute(self, role_id: UUID) -> None:
        role = await self._role_repo.find_by_id(role_id)
        if role is None:
            raise RoleNotFoundError(f"No role with id {role_id}")
        # `user_roles` rows cascade-delete at the database level (Task 4.1),
        # so a role still assigned to users is deleted without orphan rows —
        # there is no "protected role" concept in this story.
        await self._role_repo.delete(role_id)
