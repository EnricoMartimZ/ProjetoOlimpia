-- Migração 004: remove a check constraint de usuario.role para suportar
-- usuários com múltiplos perfis (ex: "servidor,pesquisador_campo").
--
-- A constraint anterior só aceitava "servidor" | "pesquisador_campo".
-- A nova lógica armazena os perfis como string separada por vírgula e
-- a validação passa a ser feita no backend (Pydantic + dependencies.py).
-- Idempotente: DROP CONSTRAINT IF EXISTS.

ALTER TABLE usuario
    DROP CONSTRAINT IF EXISTS usuario_role_check;
