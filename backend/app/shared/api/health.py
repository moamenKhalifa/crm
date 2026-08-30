from fastapi import APIRouter

from app.shared.infrastructure.database import check_database

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict[str, str]:
    db_ok = await check_database()
    return {
        "status": "ok",
        "database": "ok" if db_ok else "unreachable",
    }
