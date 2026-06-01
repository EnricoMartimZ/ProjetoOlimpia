-- Migração 003: adiciona a coluna `tipo` à tabela pesquisa.
-- Distingue pesquisas respondidas pelo público (link aberto) das pesquisas
-- coletadas presencialmente por um pesquisador de campo autenticado.
--
-- Valores: 'publica' (padrão) | 'campo'.
-- String simples (não ENUM) para mudar o mínimo possível do banco — segue o
-- mesmo padrão de usuario.role. Idempotente: ADD COLUMN IF NOT EXISTS.

    ALTER TABLE pesquisa
        ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) NOT NULL DEFAULT 'publica';
