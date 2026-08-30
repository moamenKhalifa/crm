class IdentityError(Exception):
    """Base class for all identity & access domain errors."""


class InvalidCredentialsError(IdentityError):
    pass


class DuplicateAccountError(IdentityError):
    pass


class DuplicateRoleError(IdentityError):
    pass


class DuplicatePermissionError(IdentityError):
    pass


class UserNotFoundError(IdentityError):
    pass


class RoleNotFoundError(IdentityError):
    pass


class PermissionNotFoundError(IdentityError):
    pass


class RefreshTokenInvalidError(IdentityError):
    pass


class RefreshTokenExpiredError(IdentityError):
    pass


class RefreshTokenRevokedError(IdentityError):
    pass


class PermissionDeniedError(IdentityError):
    pass


class WeakPasswordError(IdentityError):
    pass


class InvalidEmailError(IdentityError):
    pass
