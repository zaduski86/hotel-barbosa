# 🏨 Hotel Barbosa 24 Horas — Sistema de Gestão

## Stack
- **Frontend:** React + Vite
- **Banco:** Supabase (PostgreSQL)
- **Deploy:** Vercel

---

## 1. Configurar o banco (Supabase)

1. Acesse seu projeto em supabase.com
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `supabase-schema.sql` e execute
4. Isso cria todas as tabelas e os 14 quartos iniciais

---

## 2. Rodar localmente

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
```

Acesse: http://localhost:5173

---

## 3. Deploy na Vercel

1. Suba o projeto no GitHub
2. Importe no Vercel
3. Adicione as variáveis de ambiente:
   - `VITE_SUPABASE_URL` = sua URL do Supabase
   - `VITE_SUPABASE_ANON_KEY` = sua chave pública
4. Deploy! ✅

---

## Funcionalidades implementadas

- ✅ Mapa de quartos com cards coloridos por status
- ✅ Drag and drop para trocar hóspede de quarto
- ✅ Ícones de casinha por tipo de quarto (single, duplo, triplo, suíte)
- ✅ Reservas (balcão + link remoto via WhatsApp)
- ✅ Check-in e check-out
- ✅ Recibo PDF automático no check-out (editável)
- ✅ Envio de recibo por WhatsApp
- ✅ Cadastro de hóspedes com preenchimento automático de CEP
- ✅ Gestão de quartos com upload de fotos
- ✅ Gastos do hotel com OCR (Tesseract + Claude fallback)
- ✅ Usuários (gestor/recepcionista) com popup de credenciais
- ✅ Responsivo (mobile + desktop)

## Próximos passos (próximas iterações)

- Pagamentos com arraste de comprovante + OCR
- Consumos por quarto em 2 cliques
- Relatórios financeiros
- Página pública do hotel
