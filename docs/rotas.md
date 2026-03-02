# Documentação de Rotas da API (para o Front)

Base URL padrão (desenvolvimento):

- `http://localhost:8000/api/v1`

Todas as rotas protegidas usam **Bearer Token JWT** no header:

- `Authorization: Bearer <access_token>`

Os roles usados no backend são: `admin` e `user`.

---

## 1. Auth / Usuários

### 1.1 POST /api/v1/users/login

- **Auth**: pública (não exige token)
- **Body (JSON)**:
  - `email`: string (email)
  - `password`: string
- **Resposta (200)**:
  - `message`: string
  - `access_token`: string (JWT de acesso)
  - `refresh_token`: string (JWT de refresh)
  - `user`:
    - `email`: string
    - `uid`: string (UUID do usuário)

---

### 1.2 GET /api/v1/users/refresh_token

- **Auth**: header Authorization com **refresh token**
- **Headers**:
  - `Authorization: Bearer <refresh_token>`
- **Resposta (200)**:
  - `access_token`: string (novo token de acesso)

---

### 1.3 GET /api/v1/users/logout

- **Auth**: header Authorization com **access token**
- **Headers**:
  - `Authorization: Bearer <access_token>`
- **Resposta (200)**:
  - `message`: "Logged Out"

---

### 1.4 GET /api/v1/users/me

- **Auth**: access token (roles: `admin`, `user`)
- **Headers**:
  - `Authorization: Bearer <access_token>`
- **Resposta (200)** – usuário atual:
  - `uid`: string (UUID)
  - `full_name`: string
  - `email`: string
  - `cpf`: string
  - `role`: string (`"admin"` ou `"user"`)

---

### 1.5 POST /api/v1/users/signup

- **Auth**: pública (não exige token)
- **Body (JSON)**:
  - `full_name`: string
  - `email`: string
  - `cpf`: string
  - `password`: string
- **Resposta (201)** – usuário criado:
  - `uid`: string (UUID)
  - `full_name`: string
  - `email`: string
  - `cpf`: string
  - `role`: string (`"admin"` por padrão só via seed ou alteração direta; signup normal cria `"user"`)

---

### 1.6 PATCH /api/v1/users/{user_id}

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `user_id`: string (UUID do usuário)
- **Body (JSON)**:
  - `full_name`: string
  - `email`: string
  - `password`: string
- **Resposta (200)** – usuário atualizado:
  - `uid`: string (UUID)
  - `full_name`: string
  - `email`: string
  - `cpf`: string
  - `role`: string

---

### 1.7 GET /api/v1/users/

- **Auth**: access token (roles: `admin`, `user`)
- **Resposta (200)** – lista de usuários:
  - Array de objetos:
    - `uid`: string (UUID)
    - `full_name`: string
    - `email`: string
    - `cpf`: string
    - `role`: string

---

### 1.8 GET /api/v1/users/{user_id}

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `user_id`: string (UUID)
- **Resposta (200)** – usuário:
  - `uid`: string (UUID)
  - `full_name`: string
  - `email`: string
  - `cpf`: string
  - `role`: string

---

### 1.9 DELETE /api/v1/users/{user_id}

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `user_id`: string (UUID)
- **Resposta (204)** – sem corpo

---

## 2. Endereços (Address)

Prefixo backend: `/api/v1/users/{user_id}/addresses`

### 2.1 POST /api/v1/users/{user_id}/addresses/

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `user_id`: string (UUID do usuário dono do endereço)
- **Body (JSON)**:
  - `street`: string
  - `street_number`: number
  - `neighborhood`: string
  - `city`: string
  - `state_code`: string (2 letras, ex: "PB")
  - `zip_code`: string
  - `country`: string (default "Brazil")
  - `complement`: string | null
  - `reference`: string | null
  - `address_type`: string (enum, ex: "residential")
  - `primary`: boolean
- **Resposta (201)** – endereço criado:
  - `uid`: string (UUID do endereço)
  - `user_uid`: string (UUID do usuário)
  - demais campos iguais ao payload

---

### 2.2 GET /api/v1/users/{user_id}/addresses/

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `user_id`: string (UUID)
- **Resposta (200)** – lista de endereços do usuário:
  - Array de objetos `AddressResponseDTO` (mesmos campos do item acima)

---

### 2.3 GET /api/v1/users/{user_id}/addresses/{address_id}

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `user_id`: string (UUID)
  - `address_id`: string (UUID do endereço)
- **Resposta (200)** – endereço específico (campos de `AddressResponseDTO`)

---

### 2.4 PATCH /api/v1/users/{user_id}/addresses/{address_id}

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `user_id`: string (UUID)
  - `address_id`: string (UUID)
- **Body (JSON)** – todos opcionais:
  - `street?`: string
  - `street_number?`: number
  - `neighborhood?`: string
  - `city?`: string
  - `state_code?`: string (2 letras)
  - `zip_code?`: string
  - `country?`: string
  - `complement?`: string
  - `reference?`: string
  - `address_type?`: string (enum)
  - `primary?`: boolean
- **Resposta (200)** – endereço atualizado (mesmo formato `AddressResponseDTO`)

---

### 2.5 DELETE /api/v1/users/{user_id}/addresses/{address_id}

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `user_id`: string (UUID)
  - `address_id`: string (UUID)
- **Resposta (204)** – sem corpo

---

## 3. Produtos (Product)

Prefixo backend: `/api/v1/products`

### 3.1 POST /api/v1/products/

- **Auth**: access token (roles: `admin`, `user`)
- **Body (JSON)** `ProductCreateDTO`:
  - `title`: string
  - `description`: string
  - `price`: number (> 0)
  - `stock`: number (>= 0)
  - `active`: boolean (default true)
  - `product_type`: string (enum `ProductType`, ex: "physical_book", "ebook", "kit", "magazine")
  - Campos opcionais (dependem do tipo):
    - `isbn?`: string
    - `author?`: string
    - `publisher?`: string
    - `pub_year?`: number
    - `edition?`: string
    - `num_pages?`: number
    - `weight?`: number
    - `dimensions?`: string
    - `language?`: string
    - `format?`: string (enum `EbookFormat`: "pdf", "epub", "mobi")
    - `size?`: number (MB)
    - `file_path?`: string
    - `discount_percent?`: number
- **Resposta (201)** – `ProductResponseDTO`:
  - `id`: number
  - todos os campos do payload (com defaults aplicados)

---

### 3.2 GET /api/v1/products/

- **Auth**: access token (roles: `admin`, `user`)
- **Resposta (200)** – lista de produtos (`ProductResponseDTO[]`)

---

### 3.3 GET /api/v1/products/{product_id}

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `product_id`: number
- **Resposta (200)** – `ProductResponseDTO`

---

### 3.4 PATCH /api/v1/products/{product_id}

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `product_id`: number
- **Body (JSON)** – todos opcionais, mesmos campos de `ProductCreateDTO`:
  - exemplo: `title?`, `price?`, `stock?`, etc.
- **Resposta (200)** – `ProductResponseDTO` atualizado

---

### 3.5 DELETE /api/v1/products/{product_id}

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `product_id`: number
- **Resposta (204)** – sem corpo

---

## 4. Pedidos (Order)

Prefixo backend: `/api/v1/users/{user_id}/orders`

### 4.1 POST /api/v1/users/{user_id}/orders/

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `user_id`: string (UUID do cliente)
- **Body (JSON)** `OrderCreateDTO`:
  - `address_uid`: string (UUID do endereço de entrega do usuário)
  - `items`: array de objetos:
    - `product_id`: number
    - `quantity`: number (> 0)
  - `shipping`: number (>= 0)
  - `discount`: number (>= 0, default 0)
  - `note`: string | null
- **Regra**: total = subtotal (somatório items) + shipping - discount > 0
- **Resposta (201)** – `OrderResponseDTO`:
  - `id`: number
  - `order_number`: string (ex: "ORD-XXXXXXXXXX")
  - `customer_uid`: string (UUID do usuário)
  - `status`: string (enum `OrderStatus`, ex: "awaiting_payment")
  - `subtotal`: number
  - `shipping`: number
  - `discount`: number
  - `total`: number
  - `address_uid`: string (UUID do endereço)
  - `note`: string | null
  - `created_at`: datetime ISO
  - `updated_at`: datetime ISO
  - `items`: array de objetos:
    - `id`: number
    - `product_id`: number
    - `quantity`: number
    - `unit_price`: number

---

### 4.2 GET /api/v1/users/{user_id}/orders/

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `user_id`: string (UUID)
- **Resposta (200)** – lista de `OrderResponseDTO` desse usuário

---

### 4.3 GET /api/v1/users/{user_id}/orders/{order_id}

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `user_id`: string (UUID)
  - `order_id`: number
- **Resposta (200)** – `OrderResponseDTO` do pedido

---

### 4.4 PATCH /api/v1/users/{user_id}/orders/{order_id}

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `user_id`: string (UUID)
  - `order_id`: number
- **Body (JSON)** `OrderUpdateDTO` – todos opcionais:
  - `status?`: string (enum `OrderStatus`, ex: "payment_confirmed", "shipped" etc.)
  - `shipping?`: number
  - `discount?`: number
  - `note?`: string
- **Resposta (200)** – `OrderResponseDTO` atualizado

---

### 4.5 DELETE /api/v1/users/{user_id}/orders/{order_id}

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `user_id`: string (UUID)
  - `order_id`: number
- **Resposta (204)** – sem corpo

---

## 5. Carrinho (Cart)

Prefixo backend: `/api/v1/users/{user_id}/cart`

### 5.1 GET /api/v1/users/{user_id}/cart/

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `user_id`: string (UUID)
- **Resposta (200)** – `CartResponseDTO`:
  - `id`: number (id do carrinho)
  - `user_uid`: string (UUID do usuário)
  - `created_at`: datetime ISO
  - `updated_at`: datetime ISO
  - `items`: array:
    - `id`: number
    - `product_id`: number
    - `quantity`: number

---

### 5.2 POST /api/v1/users/{user_id}/cart/items

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `user_id`: string (UUID)
- **Body (JSON)** `CartItemCreateDTO`:
  - `product_id`: number
  - `quantity`: number (> 0)
- **Comportamento**:
  - Se o produto já estiver no carrinho, soma a quantidade.
  - Caso contrário, cria novo item.
- **Resposta (201)** – `CartResponseDTO` atualizado (mesmo formato da 5.1)

---

### 5.3 PATCH /api/v1/users/{user_id}/cart/items/{item_id}

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `user_id`: string (UUID)
  - `item_id`: number (id do item no carrinho)
- **Body (JSON)** `CartItemUpdateDTO`:
  - `quantity`: number (> 0)
- **Resposta (200)** – `CartResponseDTO` atualizado

---

### 5.4 DELETE /api/v1/users/{user_id}/cart/items/{item_id}

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `user_id`: string (UUID)
  - `item_id`: number
- **Resposta (204)** – sem corpo

---

### 5.5 DELETE /api/v1/users/{user_id}/cart/items

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `user_id`: string (UUID)
- **Resposta (200)** – `CartResponseDTO` com lista de items vazia

---

## 6. Admin / Métricas (somente admin)

Prefixo backend: `/api/v1/admin`

### 6.1 GET /api/v1/admin/summary

- **Auth**: access token (**role obrigatória**: `admin`)
- **Resposta (200)** – resumo geral:
  - `total_revenue`: number (soma dos `total` dos pedidos com status finais/confirmados)
  - `total_orders`: number (quantidade total de pedidos na base)
  - `total_products`: number (quantidade total de produtos cadastrados)
  - `total_customers`: number (quantidade total de usuários)

---

### 6.2 GET /api/v1/admin/recent-orders?limit=30

- **Auth**: access token (**role obrigatória**: `admin`)
- **Query Params**:
  - `limit?`: number (opcional, default 30) – quantidade de pedidos recentes a retornar
- **Resposta (200)** – lista dos pedidos mais recentes, no formato `OrderResponseDTO[]` (mesmo formato das rotas de pedidos de usuário):
  - `id`: number
  - `order_number`: string
  - `customer_uid`: string (UUID do usuário)
  - `status`: string (enum `OrderStatus`)
  - `subtotal`: number
  - `shipping`: number
  - `discount`: number
  - `total`: number
  - `address_uid`: string (UUID)
  - `note`: string | null
  - `created_at`: datetime ISO
  - `updated_at`: datetime ISO
  - `items`: array de objetos:
    - `id`: number
    - `product_id`: number
    - `quantity`: number
    - `unit_price`: number

---
## 7. Frete / Correios (admin e user)

Prefixo backend: `/api/v1/shipping`

### 7.1 GET /api/v1/shipping/address/{cep}

- **Auth**: access token (roles: `admin`, `user`)
- **URL Params**:
  - `cep`: string (CEP, pode ter ou não máscara, ex: "01310-100" ou "01310100")
- **Resposta (200)** – `ViaCepAddressDTO`:
  - `postal_code`: string (CEP normalizado)
  - `street`: string
  - `neighborhood`: string
  - `city`: string
  - `state`: string (UF)

---

### 7.2 POST /api/v1/shipping/quotes

- **Auth**: access token (roles: `admin`, `user`)
- **Body (JSON)** `ShippingCalculateRequestDTO`:
  - `origin_postal_code`: string (CEP de origem)
  - `destination_postal_code`: string (CEP de destino)
  - `products`: array de objetos `ShippingProductDTO`:
    - `id`: string (identificador do produto, ex: SKU)
    - `width`: number
    - `height`: number
    - `length`: number
    - `weight`: number
    - `insurance_value`: number (valor segurado)
    - `quantity`: number
- **Resposta (200)** – lista de cotações `ShippingQuoteDTO[]`:
  - Estrutura flexível (vem direto do Melhor Envio), mas tipicamente inclui campos como:
    - `id?`: string
    - `name?`: string (nome do serviço, ex: "PAC", "SEDEX")
    - `price?`: number
    - `final_price?`: number
    - `custom_price?`: number
    - `company?`: objeto com dados da transportadora
    - `delivery_time?`: objeto com prazo estimado

## 8. Pagamentos Mercado Pago

Prefixo backend: `/api/v1/mercado-pago`

### 8.1 POST /api/v1/mercado-pago/create-checkout

- **Auth**: access token (roles: `admin`, `user`)
- **Body (JSON)**:
  - `testeId`: string (identificador do teste/pedido que o backend vai usar)
  - `userEmail?`: string (opcional, email do usuário para o Mercado Pago)
- **Resposta (200)**:
  - `preferenceId`: string (ID da preference criada no Mercado Pago)
  - `initPoint`: string (URL para onde o front deve redirecionar o usuário)

---

### 8.2 GET /api/v1/mercado-pago/pending

- **Auth**: pública (chamado pelo redirecionamento do Mercado Pago)
- **Query Params** (enviados pelo MP):
  - `payment_id`: string (ID do pagamento no Mercado Pago)
  - `external_reference`: string (testeId enviado na criação da preference)
- **Comportamento**:
  - Consulta o pagamento no MP; se estiver `approved`, redireciona para `FRONTEND_URL/?status=sucesso`.
  - Caso contrário, redireciona para `FRONTEND_URL/`.

---

### 8.3 POST /api/v1/mercado-pago/webhook

- **Auth**: pública, mas com **verificação de assinatura**:
  - Requer headers `x-signature` e `x-request-id` válidos, verificados via HMAC SHA256 com `MERCADO_PAGO_WEBHOOK_SECRET`.
- **Body (JSON)**: payload enviado pelo Mercado Pago (eventos de pagamento).
- **Comportamento**:
  - Ignora eventos cujo `type` não seja `"payment"`.
  - Para eventos de pagamento, busca os dados completos (`payment_id`) e, se aprovado, chama internamente `handle_mercadopago_payment` (onde você marca o pedido como pago, etc.).
- **Resposta (200)**:
  - `{ "received": true }`
## Observações para o Front

- Sempre envie `Authorization: Bearer <access_token>` nas rotas protegidas.
- Para pedidos e carrinho, use sempre o `user_id` (UUID) do usuário logado retornado em `/users/login` ou `/users/me`.
- Datas vêm em formato ISO (string) e podem ser tratadas diretamente em JS.
- Enums são enviados/esperados como strings (por exemplo, `status` do pedido, `product_type`, `format`, `address_type`).
