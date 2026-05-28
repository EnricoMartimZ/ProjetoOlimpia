-- =====================================================================
-- Schema: Projeto Olímpia (MERX)
-- Banco: PostgreSQL (Neon)
-- =====================================================================
-- Para rodar:
--   psql "$DATABASE_URL" -f schema.sql
-- Ou cole no SQL Editor do Neon.
-- =====================================================================

-- Limpa o schema antes de recriar (cuidado em produção!)
DROP TABLE IF EXISTS coletou CASCADE;
DROP TABLE IF EXISTS resposta CASCADE;
DROP TABLE IF EXISTS campo CASCADE;
DROP TABLE IF EXISTS edicao CASCADE;
DROP TABLE IF EXISTS pesquisa CASCADE;
DROP TABLE IF EXISTS diaria_media CASCADE;
DROP TABLE IF EXISTS hospedagem CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;

DROP TYPE IF EXISTS tipo_campo;

-- =====================================================================
-- ENUM: tipos de Campo (define como a resposta deve ser minerada)
-- =====================================================================
CREATE TYPE tipo_campo AS ENUM (
    'multipla_escolha_1',   -- Apenas 1 opção selecionável
    'multipla_escolha_n',   -- Múltiplas opções selecionáveis
    'texto',                -- Resposta livre
    'data'                  -- Data
);

-- =====================================================================
-- USUARIO
-- Usuários autenticados (servidores da Secretaria e pesquisadores).
-- =====================================================================
CREATE TABLE usuario (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(150) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    senha_hash  VARCHAR(255) NOT NULL,
    role        VARCHAR(30)  NOT NULL CHECK (role IN ('servidor', 'pesquisador_campo')),
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- PESQUISA
-- Template de um formulário. Define campos fixos.
-- =====================================================================
CREATE TABLE pesquisa (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(150) NOT NULL UNIQUE,
    descricao   TEXT,
    criado_em   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- EDIÇÃO
-- Instância de uma Pesquisa em um período específico.
-- =====================================================================
CREATE TABLE edicao (
    id                 SERIAL PRIMARY KEY,
    pesquisa_id        INTEGER NOT NULL REFERENCES pesquisa(id) ON DELETE CASCADE,
    numero_edicao      INTEGER NOT NULL,
    data_abertura      DATE NOT NULL,
    data_fechamento    DATE,
    criado_em          TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_edicao_pesquisa UNIQUE (pesquisa_id, numero_edicao),
    CONSTRAINT ck_datas_edicao CHECK (
        data_fechamento IS NULL OR data_fechamento >= data_abertura
    )
);

-- =====================================================================
-- CAMPO
-- Pergunta de um formulário.
-- Pode ser fixa (vinculada a Pesquisa) ou extra (vinculada a Edição).
-- =====================================================================
CREATE TABLE campo (
    id                 SERIAL PRIMARY KEY,
    hash_pergunta      VARCHAR(64) NOT NULL UNIQUE,
    texto_pergunta     TEXT NOT NULL,
    tipo               tipo_campo NOT NULL,
    regex              TEXT NOT NULL,
    pesquisa_id        INTEGER REFERENCES pesquisa(id) ON DELETE CASCADE,
    edicao_id          INTEGER REFERENCES edicao(id) ON DELETE CASCADE,
    criado_em          TIMESTAMP NOT NULL DEFAULT NOW(),
    -- Um campo pertence OU a uma Pesquisa (fixo) OU a uma Edição (extra),
    -- nunca aos dois, e nunca a nenhum.
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
    timestamp_envio    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- COLETOU
-- Relação N:N entre Campo e Resposta.
-- Armazena o texto bruto coletado do formulário.
-- A informação útil é extraída via REGEX do Campo (backend).
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
    criado_em       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- DIÁRIA MÉDIA
-- Registro contínuo de preço por hospedagem (inserido pelo servidor).
-- =====================================================================
CREATE TABLE diaria_media (
    id              SERIAL PRIMARY KEY,
    hospedagem_cnpj VARCHAR(18) NOT NULL REFERENCES hospedagem(cnpj) ON DELETE CASCADE,
    data            DATE NOT NULL,
    preco           NUMERIC(10, 2) NOT NULL,
    registrado_em   TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_diaria_hospedagem_data UNIQUE (hospedagem_cnpj, data),
    CONSTRAINT ck_preco_positivo CHECK (preco >= 0)
);

-- =====================================================================
-- FIM
-- =====================================================================
