from pydantic import BaseModel, EmailStr


class LoginInput(BaseModel):
    email: EmailStr
    senha: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
