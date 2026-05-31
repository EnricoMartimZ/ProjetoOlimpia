-- =====================================================================
-- Schema: Projeto Olímpia (MERX)
-- Banco: PostgreSQL (Neon)
-- =====================================================================
-- ATENÇÃO: a tabela `usuario` já existe no banco de produção.
-- Este arquivo cria APENAS as tabelas restantes.
-- Para rodar:
--   psql "$DATABASE_URL" -f schema.sql
-- Ou cole no SQL Editor do Neon.
-- =====================================================================

-- Limpa as tabelas restantes (nunca dropa usuario)
DROP TABLE IF EXISTS coletou CASCADE;
DROP TABLE IF EXISTS resposta CASCADE;
DROP TABLE IF EXISTS campo CASCADE;
DROP TABLE IF EXISTS edicao CASCADE;
DROP TABLE IF EXISTS pesquisa CASCADE;
DROP TABLE IF EXISTS diaria_media CASCADE;
DROP TABLE IF EXISTS hospedagem CASCADE;

DROP TYPE IF EXISTS tipo_campo;

-- =====================================================================
-- ENUM: tipos de Campo
-- Alinhado com o FieldType do frontend (types/index.ts)
-- =====================================================================
CREATE TYPE tipo_campo AS ENUM (
    'texto',              -- Texto curto (input)
    'texto_longo',        -- Texto longo (textarea)
    'numero',             -- Valor numérico
    'multipla_escolha',   -- Apenas 1 opção selecionável (radio)
    'data',               -- Data
    'escala',             -- Escala 1 a 5
    'sim_nao'             -- Booleano (Sim / Não)
);

-- =====================================================================
-- PESQUISA
-- Template de formulário. Define campos fixos reutilizados em edições.
-- =====================================================================
CREATE TABLE pesquisa (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(150) NOT NULL UNIQUE,
    descricao   TEXT,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- EDIÇÃO
-- Instância de uma Pesquisa em um período específico.
-- Gera o link público do formulário via ID.
-- =====================================================================
CREATE TABLE edicao (
    id                 SERIAL PRIMARY KEY,
    pesquisa_id        INTEGER NOT NULL REFERENCES pesquisa(id) ON DELETE CASCADE,
    numero_edicao      INTEGER NOT NULL,
    data_abertura      DATE NOT NULL,
    data_fechamento    DATE,
    criado_em          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_edicao_pesquisa UNIQUE (pesquisa_id, numero_edicao),
    CONSTRAINT ck_datas_edicao CHECK (
        data_fechamento IS NULL OR data_fechamento >= data_abertura
    )
);

-- =====================================================================
-- CAMPO
-- Pergunta de um formulário.
-- Pode ser fixo (pesquisa_id) ou extra por edição (edicao_id).
-- =====================================================================
CREATE TABLE campo (
    id                 SERIAL PRIMARY KEY,
    hash_pergunta      VARCHAR(64) NOT NULL UNIQUE,    -- SHA-256 do texto, gerado pelo backend
    texto_pergunta     TEXT NOT NULL,
    tipo               tipo_campo NOT NULL,
    opcoes             TEXT[] NOT NULL DEFAULT '{}',   -- Opções para multipla_escolha
    obrigatorio        BOOLEAN NOT NULL DEFAULT FALSE, -- Campo required no frontend
    ordem              INTEGER NOT NULL DEFAULT 0,     -- Posição no formulário
    regex              TEXT DEFAULT '',                -- REGEX para mineração (backend)
    pesquisa_id        INTEGER REFERENCES pesquisa(id) ON DELETE CASCADE,
    edicao_id          INTEGER REFERENCES edicao(id) ON DELETE CASCADE,
    criado_em          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_campo_origem CHECK (
        (pesquisa_id IS NOT NULL AND edicao_id IS NULL) OR
        (pesquisa_id IS NULL AND edicao_id IS NOT NULL)
    )
);

-- =====================================================================
-- RESPOSTA
-- Registro de um envio de formulário por uma Edição.
-- =====================================================================
CREATE TABLE resposta (
    id                 SERIAL PRIMARY KEY,
    edicao_id          INTEGER NOT NULL REFERENCES edicao(id) ON DELETE CASCADE,
    usuario_id         INTEGER REFERENCES usuario(id) ON DELETE SET NULL, -- Preenchido se pesquisador de campo fez login
    timestamp_envio    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- COLETOU
-- Relação N:N entre Campo e Resposta.
-- Armazena o texto bruto coletado do formulário.
-- =====================================================================
CREATE TABLE coletou (
    id                 SERIAL PRIMARY KEY,
    campo_id           INTEGER NOT NULL REFERENCES campo(id) ON DELETE CASCADE,
    resposta_id        INTEGER NOT NULL REFERENCES resposta(id) ON DELETE CASCADE,
    atributo_texto     TEXT NOT NULL,
    CONSTRAINT uk_coletou_campo_resposta UNIQUE (campo_id, resposta_id)
);

-- =====================================================================
-- HOSPEDAGEM
-- Hotéis e resorts cadastrados para a pesquisa de Diária Média.
-- =====================================================================
CREATE TABLE hospedagem (
    cnpj            VARCHAR(18) PRIMARY KEY,
    nome_fantasia   VARCHAR(150) NOT NULL,
    local           VARCHAR(200) NOT NULL,
    categoria       VARCHAR(50) NOT NULL DEFAULT 'Hotel',  -- Hotel, Pousada, Resort, Airbnb, etc.
    estrelas        SMALLINT NOT NULL DEFAULT 0,
    quartos         INTEGER NOT NULL DEFAULT 0,
    foto_url        TEXT,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- DIÁRIA MÉDIA
-- Registro contínuo de preço por hospedagem (inserido pelo servidor).
-- Um registro por hospedagem por data.
-- preco_fds  = diária fim de semana
-- preco_semana = diária dia de semana
-- =====================================================================
CREATE TABLE diaria_media (
    id               SERIAL PRIMARY KEY,
    hospedagem_cnpj  VARCHAR(18) NOT NULL REFERENCES hospedagem(cnpj) ON DELETE CASCADE,
    data             DATE NOT NULL,
    preco_fds        NUMERIC(10, 2) NOT NULL,
    preco_semana     NUMERIC(10, 2) NOT NULL,
    fonte_booking    TEXT,
    observacoes      TEXT,
    registrado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_diaria_hospedagem_data UNIQUE (hospedagem_cnpj, data),
    CONSTRAINT ck_preco_fds_positivo CHECK (preco_fds >= 0),
    CONSTRAINT ck_preco_semana_positivo CHECK (preco_semana >= 0)
);

-- =====================================================================
-- FIM
-- =====================================================================
