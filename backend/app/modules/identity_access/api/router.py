from fastapi import APIRouter

from .routers import auth as auth_router
from .routers import permissions as permissions_router
from .routers import roles as roles_router
from .routers import users as users_router

router = APIRouter()
router.include_router(auth_router.router, prefix="/auth", tags=["auth"])
router.include_router(users_router.router, prefix="/users", tags=["users"])
router.include_router(roles_router.router, prefix="/roles", tags=["roles"])
router.include_router(permissions_router.router, prefix="/permissions", tags=["permissions"])
