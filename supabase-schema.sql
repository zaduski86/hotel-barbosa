-- =============================================
-- HOTEL BARBOSA 24 HORAS — Schema do Banco
-- Execute no Supabase SQL Editor
-- =============================================

-- Tipos de quarto
CREATE TYPE tipo_quarto AS ENUM ('single', 'duplo', 'triplo', 'suite', 'suite_master');

-- Status do quarto
CREATE TYPE status_quarto AS ENUM ('disponivel', 'ocupado', 'limpeza', 'manutencao', 'bloqueado');

-- Status da reserva
CREATE TYPE status_reserva AS ENUM ('pre_reserva', 'confirmada', 'checkin', 'checkout', 'cancelada');

-- Método de pagamento
CREATE TYPE metodo_pagamento AS ENUM ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'transferencia');

-- Status do pagamento
CREATE TYPE status_pagamento AS ENUM ('pendente', 'parcial', 'pago', 'estornado');

-- =============================================
-- QUARTOS
-- =============================================
CREATE TABLE quartos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  nome TEXT,
  tipo tipo_quarto NOT NULL DEFAULT 'duplo',
  andar INT DEFAULT 1,
  capacidade INT DEFAULT 2,
  preco_diaria DECIMAL(10,2) NOT NULL DEFAULT 0,
  descricao TEXT,
  comodidades TEXT[],
  status status_quarto DEFAULT 'disponivel',
  ativo BOOLEAN DEFAULT true,
  ordem INT DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Fotos dos quartos
CREATE TABLE quarto_fotos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quarto_id UUID REFERENCES quartos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  principal BOOLEAN DEFAULT false,
  ordem INT DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- HÓSPEDES
-- =============================================
CREATE TABLE hospedes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT UNIQUE,
  rg TEXT,
  data_nascimento DATE,
  nacionalidade TEXT DEFAULT 'Brasileira',
  email TEXT,
  telefone TEXT,
  cep TEXT,
  endereco TEXT,
  numero_end TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  profissao TEXT,
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Acompanhantes
CREATE TABLE acompanhantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hospede_id UUID REFERENCES hospedes(id) ON DELETE CASCADE,
  reserva_id UUID,
  nome TEXT NOT NULL,
  cpf TEXT,
  data_nascimento DATE,
  parentesco TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RESERVAS
-- =============================================
CREATE TABLE reservas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT UNIQUE DEFAULT 'RES-' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0'),
  quarto_id UUID REFERENCES quartos(id),
  hospede_id UUID REFERENCES hospedes(id),
  data_entrada DATE NOT NULL,
  data_saida DATE NOT NULL,
  total_diarias INT NOT NULL,
  valor_diaria DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  valor_pago DECIMAL(10,2) DEFAULT 0,
  status status_reserva DEFAULT 'confirmada',
  status_pagamento status_pagamento DEFAULT 'pendente',
  origem TEXT DEFAULT 'balcao',
  token_link TEXT UNIQUE,
  observacoes TEXT,
  checkin_em TIMESTAMPTZ,
  checkout_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar FK de acompanhantes para reservas
ALTER TABLE acompanhantes ADD CONSTRAINT fk_acomp_reserva
  FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE;

-- =============================================
-- CONSUMOS
-- =============================================
CREATE TABLE produtos_servicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT DEFAULT 'outros',
  preco DECIMAL(10,2) NOT NULL DEFAULT 0,
  unidade TEXT DEFAULT 'unidade',
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE consumos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reserva_id UUID REFERENCES reservas(id) ON DELETE CASCADE,
  quarto_id UUID REFERENCES quartos(id),
  produto_id UUID REFERENCES produtos_servicos(id),
  nome_item TEXT NOT NULL,
  quantidade INT DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  registrado_por TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PAGAMENTOS
-- =============================================
CREATE TABLE pagamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reserva_id UUID REFERENCES reservas(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL,
  metodo metodo_pagamento NOT NULL,
  status status_pagamento DEFAULT 'pago',
  comprovante_url TEXT,
  ocr_dados JSONB,
  observacoes TEXT,
  registrado_por TEXT,
  pago_em TIMESTAMPTZ DEFAULT NOW(),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- GASTOS DO HOTEL
-- =============================================
CREATE TABLE gastos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  categoria TEXT DEFAULT 'outros',
  fornecedor TEXT,
  data_gasto DATE DEFAULT CURRENT_DATE,
  foto_url TEXT,
  ocr_dados JSONB,
  registrado_por TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- USUÁRIOS DO SISTEMA
-- =============================================
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID UNIQUE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE,
  telefone TEXT,
  cargo TEXT DEFAULT 'recepcionista',
  permissoes JSONB DEFAULT '{"reservas":true,"hospedes":true,"quartos":false,"financeiro":false,"configuracoes":false}',
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- HISTÓRICO DE ATIVIDADES
-- =============================================
CREATE TABLE atividades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  entidade TEXT,
  entidade_id UUID,
  usuario TEXT,
  dados JSONB,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STORAGE BUCKETS
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('quartos-fotos', 'quartos-fotos', true),
  ('comprovantes', 'comprovantes', true),
  ('gastos-fotos', 'gastos-fotos', true);

-- =============================================
-- DADOS INICIAIS — 14 quartos
-- =============================================
INSERT INTO quartos (numero, nome, tipo, andar, capacidade, preco_diaria, descricao, status, ordem)
VALUES
  ('101', 'Quarto 101', 'single', 1, 1, 120.00, 'Quarto individual confortável', 'disponivel', 1),
  ('102', 'Quarto 102', 'duplo', 1, 2, 150.00, 'Quarto duplo com ar-condicionado', 'disponivel', 2),
  ('103', 'Quarto 103', 'duplo', 1, 2, 150.00, 'Quarto duplo com varanda', 'disponivel', 3),
  ('104', 'Quarto 104', 'triplo', 1, 3, 200.00, 'Quarto triplo espaçoso', 'disponivel', 4),
  ('105', 'Quarto 105', 'duplo', 1, 2, 150.00, 'Quarto duplo standard', 'disponivel', 5),
  ('201', 'Quarto 201', 'duplo', 2, 2, 170.00, 'Quarto duplo superior', 'disponivel', 6),
  ('202', 'Quarto 202', 'duplo', 2, 2, 170.00, 'Quarto duplo com vista', 'disponivel', 7),
  ('203', 'Quarto 203', 'triplo', 2, 3, 220.00, 'Quarto triplo superior', 'disponivel', 8),
  ('204', 'Quarto 204', 'suite', 2, 2, 280.00, 'Suíte com banheira', 'disponivel', 9),
  ('205', 'Quarto 205', 'duplo', 2, 2, 170.00, 'Quarto duplo confortável', 'disponivel', 10),
  ('301', 'Quarto 301', 'suite', 3, 2, 300.00, 'Suíte master com jacuzzi', 'disponivel', 11),
  ('302', 'Quarto 302', 'duplo', 3, 2, 180.00, 'Quarto duplo com varanda', 'disponivel', 12),
  ('303', 'Quarto 303', 'triplo', 3, 3, 230.00, 'Quarto triplo premium', 'disponivel', 13),
  ('304', 'Quarto 304', 'duplo', 3, 2, 180.00, 'Quarto duplo premium', 'disponivel', 14);

-- Produtos e serviços iniciais
INSERT INTO produtos_servicos (nome, categoria, preco, unidade)
VALUES
  ('Lavanderia — peça simples', 'lavanderia', 15.00, 'peça'),
  ('Lavanderia — peça grande', 'lavanderia', 25.00, 'peça'),
  ('Água mineral 500ml', 'frigobar', 5.00, 'unidade'),
  ('Refrigerante lata', 'frigobar', 8.00, 'unidade'),
  ('Cerveja long neck', 'frigobar', 12.00, 'unidade'),
  ('Café da manhã adicional', 'alimentacao', 20.00, 'pessoa'),
  ('Room service — refeição', 'alimentacao', 35.00, 'prato'),
  ('Estacionamento diária', 'servicos', 20.00, 'diária'),
  ('Transfer aeroporto', 'servicos', 80.00, 'viagem'),
  ('Toalha extra', 'enxoval', 10.00, 'unidade');
