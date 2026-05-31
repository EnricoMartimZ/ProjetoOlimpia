-- Migração 002: adiciona usuario_id à tabela resposta
-- Preenchido quando um pesquisador de campo (logado) registra a resposta.
-- NULL para respostas públicas anônimas. ON DELETE SET NULL preserva a resposta
-- mesmo que o usuário seja removido.

ALTER TABLE resposta
    ADD COLUMN IF NOT EXISTS usuario_id INTEGER
    REFERENCES usuario(id) ON DELETE SET NULL;
