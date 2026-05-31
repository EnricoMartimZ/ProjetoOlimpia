-- Migração 001: adiciona colunas ao schema existente
-- Executa apenas se as colunas ainda não existirem (idempotente via IF NOT EXISTS)

-- campo: novas colunas para suportar todos os tipos do frontend
ALTER TABLE campo
    ADD COLUMN IF NOT EXISTS opcoes       TEXT[]  NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS obrigatorio  BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS ordem        INTEGER NOT NULL DEFAULT 0;

-- hospedagem: informações exibidas nos cards da DiariaMediaPage
ALTER TABLE hospedagem
    ADD COLUMN IF NOT EXISTS categoria  VARCHAR(50)  NOT NULL DEFAULT 'Hotel',
    ADD COLUMN IF NOT EXISTS estrelas   SMALLINT     NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS quartos    INTEGER      NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS foto_url   TEXT;

-- diaria_media: separar preço FDS de preço semana (conforme formulário do frontend)
-- Passo 1: adicionar novas colunas com default temporário
ALTER TABLE diaria_media
    ADD COLUMN IF NOT EXISTS preco_fds      NUMERIC(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS preco_semana   NUMERIC(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS fonte_booking  TEXT,
    ADD COLUMN IF NOT EXISTS observacoes    TEXT;

-- Passo 2: copiar o valor existente de preco para as duas novas colunas (se houver dados)
UPDATE diaria_media
    SET preco_fds = preco, preco_semana = preco
    WHERE preco_fds = 0 AND preco > 0;

-- Passo 3: remover a coluna antiga (manter comentado até confirmar a migração)
-- ALTER TABLE diaria_media DROP COLUMN IF EXISTS preco;

-- tipo_campo ENUM: adicionar novos valores se não existirem
-- (no PostgreSQL, não há IF NOT EXISTS para ALTER TYPE ADD VALUE antes da 9.1)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'texto_longo'
                   AND enumtypid = 'tipo_campo'::regtype) THEN
        ALTER TYPE tipo_campo ADD VALUE 'texto_longo';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'numero'
                   AND enumtypid = 'tipo_campo'::regtype) THEN
        ALTER TYPE tipo_campo ADD VALUE 'numero';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'escala'
                   AND enumtypid = 'tipo_campo'::regtype) THEN
        ALTER TYPE tipo_campo ADD VALUE 'escala';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sim_nao'
                   AND enumtypid = 'tipo_campo'::regtype) THEN
        ALTER TYPE tipo_campo ADD VALUE 'sim_nao';
    END IF;
    -- Renomear multipla_escolha_1 para multipla_escolha se necessário
    -- (não há suporte nativo; resolver via UPDATE nos dados existentes)
END;
$$;
