-- Migração 004: reestrutura diaria_media e hospedagem (REQ 6 — Diária Média)
--
-- Motivo: a tabela diaria_media estava replicando dado fixo da hospedagem e
-- guardava dois preços + fonte do Booking. O novo modelo:
--   diaria_media(id, hospedagem_cnpj, data, preco, registrado_em)  -- só o que varia por coleta
--   hospedagem(..., url_booking, foto_url)                         -- link do Booking é fixo por hospedagem
--
-- Idempotente (IF [NOT] EXISTS) e seguro tanto se o banco estiver com a coluna
-- original `preco` quanto com o par `preco_fds`/`preco_semana`.

-- hospedagem: link fixo do Booking
ALTER TABLE hospedagem
    ADD COLUMN IF NOT EXISTS url_booking TEXT;

-- diaria_media: colapsar para um único preço ------------------------------
ALTER TABLE diaria_media
    ADD COLUMN IF NOT EXISTS preco NUMERIC(10, 2);

-- Popula `preco` só onde está nulo (preserva valor original se ele já existia).
-- Quando a coluna foi recém-criada, herda do par antigo (prioriza preço de semana).
UPDATE diaria_media
   SET preco = COALESCE(preco_semana, preco_fds)
 WHERE preco IS NULL
   AND (preco_semana IS NOT NULL OR preco_fds IS NOT NULL);

-- Garante NOT NULL para eventuais remanescentes
UPDATE diaria_media SET preco = 0 WHERE preco IS NULL;
ALTER TABLE diaria_media ALTER COLUMN preco SET NOT NULL;

-- Remove colunas redundantes (dado replicado / movido para hospedagem)
ALTER TABLE diaria_media
    DROP COLUMN IF EXISTS preco_fds,
    DROP COLUMN IF EXISTS preco_semana,
    DROP COLUMN IF EXISTS fonte_booking,
    DROP COLUMN IF EXISTS observacoes;

-- Constraints de preço: remove as antigas, garante a única atual
ALTER TABLE diaria_media DROP CONSTRAINT IF EXISTS ck_preco_fds_positivo;
ALTER TABLE diaria_media DROP CONSTRAINT IF EXISTS ck_preco_semana_positivo;
ALTER TABLE diaria_media DROP CONSTRAINT IF EXISTS ck_preco_positivo;
ALTER TABLE diaria_media ADD CONSTRAINT ck_preco_positivo CHECK (preco >= 0);

-- Garante a unicidade (um registro por hospedagem por data)
ALTER TABLE diaria_media DROP CONSTRAINT IF EXISTS uk_diaria_hospedagem_data;
ALTER TABLE diaria_media ADD CONSTRAINT uk_diaria_hospedagem_data UNIQUE (hospedagem_cnpj, data);
