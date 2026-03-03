# E-commerce COMPIA - Editora de Livros de IA

E-commerce completo para a editora COMPIA, especializada em livros de Inteligência Artificial.

## 🚀 Tecnologias

- **React** - Interface do usuário
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **React Router** - Navegação
- **Sonner** - Notificações toast
- **Lucide React** - Ícones

## 🎯 Funcionalidades

### Para Usuários (Compradores)
- ✅ Cadastro e autenticação JWT
- ✅ Catálogo de produtos com filtros (categoria, tipo, preço)
- ✅ Carrinho de compras sincronizado com backend
- ✅ Gerenciamento de endereços de entrega
- ✅ Cálculo automático de frete via API dos Correios
- ✅ Preenchimento automático de endereço por CEP (ViaCEP)
- ✅ Pagamento integrado com Mercado Pago (cartão, PIX, parcelamento)
- ✅ Histórico de pedidos
- ✅ Produtos físicos e digitais (e-books)

### Para Administradores
- ✅ Dashboard com métricas (receita, pedidos, produtos, clientes)
- ✅ Gerenciamento completo de produtos (criar, editar, excluir, ativar/desativar)
- ✅ Visualização de pedidos recentes
- ✅ Listagem de todos os pedidos
- ✅ Filtros avançados de produtos

## 📦 Estrutura do Projeto

```
src/
├── app/
│   ├── components/     # Componentes reutilizáveis
│   ├── context/        # Context API (Auth, Cart)
│   ├── pages/          # Páginas da aplicação
│   ├── services/       # Serviços (API)
│   └── routes.ts       # Configuração de rotas
```

## 🔧 Configuração

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```
   
4. Edite o arquivo `.env` com suas configurações:
   - `VITE_API_URL`: URL da API backend
   - `VITE_ORIGIN_POSTAL_CODE`: CEP de origem para cálculo de frete
   - `VITE_MERCADO_PAGO_PUBLIC_KEY`: Chave pública do Mercado Pago

5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 🔑 API Backend

O frontend está integrado com uma API backend FastAPI. Documentação das rotas disponível em `/src/imports/api_rotas_front-1.md`.

### Principais Endpoints

- **Auth**: `/api/v1/users/login`, `/api/v1/users/signup`, `/api/v1/users/me`
- **Produtos**: `/api/v1/products/`
- **Carrinho**: `/api/v1/users/{user_id}/cart/`
- **Pedidos**: `/api/v1/users/{user_id}/orders/`
- **Endereços**: `/api/v1/users/{user_id}/addresses/`
- **Frete**: `/api/v1/shipping/quotes`, `/api/v1/shipping/address/{cep}`
- **Pagamento**: `/api/v1/mercado-pago/create-checkout`
- **Admin**: `/api/v1/admin/summary`, `/api/v1/admin/recent-orders`

## 👥 Tipos de Usuários

- **User** (Comprador): Pode navegar, comprar produtos e gerenciar pedidos
- **Admin** (Administrador): Acesso completo ao painel administrativo

## 💳 Pagamentos

Integração completa com **Mercado Pago**:
- Cartão de crédito (até 12x)
- Cartão de débito
- PIX
- Redirecionamento seguro para checkout do Mercado Pago

## 📦 Tipos de Produtos

- **physical_book**: Livros físicos (necessitam frete)
- **ebook**: E-books digitais (sem frete)
- **kit**: Kits de livros
- **magazine**: Revistas

## 🎨 Design

- Interface moderna e responsiva
- Design system consistente com Tailwind CSS
- Tema de cores: Azul (#2563EB) como cor primária
- Experiência otimizada para desktop e mobile

## 📱 Páginas

- **Home**: Apresentação e últimas unidades (produtos com baixo estoque)
- **Catálogo**: Listagem completa com filtros
- **Detalhes do Produto**: Informações completas do produto
- **Carrinho**: Gerenciamento de itens
- **Entrega**: Seleção de endereço e cálculo de frete
- **Checkout**: Pagamento via Mercado Pago
- **Meus Pedidos**: Histórico de compras
- **Admin**: Painel administrativo completo
- **Login/Cadastro**: Autenticação de usuários

## 🔐 Segurança

- Autenticação JWT
- Tokens armazenados em localStorage
- Headers Authorization em todas as requisições protegidas
- Validação de permissões no frontend e backend

## 📝 Notas

- O carrinho é sincronizado automaticamente com o backend
- Produtos com estoque < 10 são exibidos como "Últimas Unidades"
- E-books não possuem limite de estoque
- Frete calculado em tempo real via API dos Correios
- Endereço preenchido automaticamente via CEP (ViaCEP)

## 🚀 Deploy

Para fazer deploy em produção:

1. Build do projeto:
   ```bash
   npm run build
   ```

2. Configure as variáveis de ambiente no serviço de hosting

3. Faça o deploy da pasta `dist/`

## 📄 Licença

Projeto desenvolvido para a COMPIA Editora.
