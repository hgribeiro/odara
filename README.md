# Odara Doces e Salgados — site de pedidos

Site da **Odara Doces e Salgados** (Rio Doce, Olinda - PE) com cardápio completo e pedidos online.
Visão do cliente apenas (sem login): o cliente monta o pedido no site e ele é enviado pronto para o WhatsApp da loja.

## Funcionalidades

- **Cardápio por categorias**: Kit Festa, Kit Mesversário, Kit Doces & Salgados, Bolos Personalizados,
  Brigadeiros (tradicionais, especiais e premium), Personalizados, Doces Finos e Salgados de Festa.
- **Montagem de kits e bolos**: escolha de massa, recheios, sabores de salgados/brigadeiros e tema,
  respeitando os limites do cardápio (mín. 10 un. por sabor, 2 recheios, etc.).
- **Bolo personalizado** com cálculo automático do preço (tamanho + acréscimo de Red Velvet/recheio especial).
- **Quantidades mínimas** por produto (10, 15, 30 ou 4 unidades, conforme o cardápio).
- **Carrinho** salvo no navegador.
- **Checkout**: nome, WhatsApp, retirada ou entrega, data (mín. 2 dias de antecedência), horário, pagamento e observações.
- **Envio pelo WhatsApp** com a mensagem do pedido formatada + número do pedido.
- **Tela de confirmação** com a chave Pix (botão copiar) e valor do sinal (50% para itens com bolo).
- **Meus pedidos**: histórico no aparelho, com "Reenviar" e "Pedir novamente".
- Galeria de fotos do Instagram, informações de endereço, prazos e pagamento. Layout responsivo (celular primeiro).

## Como rodar

É um site estático (HTML + CSS + JS puro, sem build). Basta abrir o `index.html` ou servir a pasta:

```bash
python3 -m http.server 8000
# acesse http://localhost:8000
```

Pode ser publicado de graça no GitHub Pages, Netlify ou Vercel.

## Como editar

Tudo que muda com frequência está em **`js/data.js`**:

- `CONFIG` — número do WhatsApp que recebe os pedidos, Instagram, endereço, dados do Pix, dias de antecedência.
- `CATEGORIAS` — produtos, preços, mínimos, sabores e fotos.
- `GALERIA` — fotos da galeria.

Fotos ficam em `assets/img/produtos` e `assets/img/galeria`.

## Estrutura

```
index.html          página
css/styles.css      estilos (paleta do cardápio: rosé, cacau e dourado)
js/data.js          dados da loja e do cardápio
js/app.js           carrinho, montagem de itens, checkout e WhatsApp
assets/img/         fotos
```
