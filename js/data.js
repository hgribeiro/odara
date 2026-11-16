/* =========================================================
   Odara Doces e Salgados — dados da loja e do cardápio
   Edite este arquivo para alterar preços, sabores e contatos.
   ========================================================= */

const CONFIG = {
  nome: "Odara Doces e Salgados",
  slogan: "Proporcionando momentos!",
  // Número que recebe os pedidos (somente dígitos, com DDI 55 + DDD)
  whatsapp: "5581999799995",
  whatsappExibicao: "(81) 99979-9995",
  instagram: "odara.docesgourmet",
  endereco: "Rua das Orquídeas, nº 59 — Rio Doce (2ª etapa), Olinda - PE",
  cep: "53050-180",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rua+das+Orqu%C3%ADdeas+59+Rio+Doce+Olinda+PE+53050-180",
  pix: {
    chave: "odara.docesgourmet@gmail.com",
    tipo: "E-mail",
    nome: "Lidiane Cavalcanti Moura",
    banco: "Nubank",
  },
  antecedenciaDias: 2,
};

/* ---------- Listas de sabores reutilizadas ---------- */
const MASSAS_KIT = ["Chocolate", "Baunilha"];
const RECHEIOS_KIT = ["Bem casado", "Chocolate", "Ninho", "Morango"];
const SALGADOS_KIT = ["Coxinha de Frango", "Bolinho de Queijo", "Pastelzinho de Queijo", "Pastelzinho de Carne"];
const BRIGADEIROS_KIT = ["Brigadeiro de Chocolate", "Ninho", "Surpresa de Uva", "Bem Casado", "Beijinho de Coco"];
const BARRAS = ["Blend", "Meio Amargo", "Chocolate Branco"];

const IMG = "assets/img/produtos/";
const GAL = "assets/img/galeria/";

/* Campos de configuração dos kits */
function camposKitFesta(qtdSalgados, qtdBrigadeiros) {
  return [
    { tipo: "radio", id: "massa", rotulo: "Massa do bolo", opcoes: MASSAS_KIT },
    { tipo: "multi", id: "recheio", rotulo: "Recheio do bolo", opcoes: RECHEIOS_KIT, min: 1, max: 2, dica: "Escolha até 2 recheios" },
    { tipo: "multi", id: "salgados", rotulo: `Salgados (${qtdSalgados} un.)`, opcoes: SALGADOS_KIT, min: 1, max: Math.min(4, qtdSalgados / 10), dica: "Mínimo de 10 unidades por sabor — dividimos igualmente" },
    { tipo: "multi", id: "brigadeiros", rotulo: `Brigadeiros (${qtdBrigadeiros} un.)`, opcoes: BRIGADEIROS_KIT, min: 1, max: Math.min(5, qtdBrigadeiros / 10), dica: "Mínimo de 10 unidades por sabor — dividimos igualmente" },
  ];
}
function camposMesversario(qtdBrigadeiros) {
  return [
    { tipo: "texto", id: "tema", rotulo: "Tema da comemoração", placeholder: "Ex.: Safari, Ursinho, 6 meses do Theo…", obrigatorio: true },
    { tipo: "radio", id: "massa", rotulo: "Massa do bolo", opcoes: MASSAS_KIT },
    { tipo: "multi", id: "recheio", rotulo: "Recheio do bolo", opcoes: RECHEIOS_KIT, min: 1, max: 2, dica: "Escolha até 2 recheios" },
    { tipo: "multi", id: "brigadeiros", rotulo: `Brigadeiros (${qtdBrigadeiros} un.)`, opcoes: BRIGADEIROS_KIT, min: 1, max: Math.min(5, qtdBrigadeiros / 10), dica: "Mínimo de 10 unidades por sabor" },
  ];
}
function camposDocesSalgados(qtdDoces, qtdSalgados) {
  return [
    { tipo: "multi", id: "doces", rotulo: `Doces tradicionais (${qtdDoces} un.)`, opcoes: BRIGADEIROS_KIT, min: 1, max: Math.min(5, qtdDoces / 10), dica: "Mínimo de 10 unidades por sabor" },
    { tipo: "multi", id: "salgados", rotulo: `Salgados fritos (${qtdSalgados} un.)`, opcoes: SALGADOS_KIT, min: 1, max: Math.min(4, qtdSalgados / 10), dica: "Mínimo de 10 unidades por sabor" },
  ];
}

/* ---------- Bolos personalizados ---------- */
const TAMANHOS_BOLO = [
  { id: "PP", rotulo: "PP — até 8 fatias", preco: 70, kg: 0.8 },
  { id: "P", rotulo: "P — até 12 fatias", preco: 90, kg: 1.2 },
  { id: "M1", rotulo: "M1 — até 16 fatias", preco: 135, kg: 1.5 },
  { id: "M2", rotulo: "M2 — 20 fatias", preco: 170, kg: 2 },
  { id: "M3", rotulo: "M3 — 25 fatias", preco: 210, kg: 2.5 },
  { id: "G1", rotulo: "G1 — 30 fatias", preco: 250, kg: 3 },
  { id: "G2", rotulo: "G2 — 35 fatias", preco: 280, kg: 3.5 },
  { id: "G3", rotulo: "G3 — 40 fatias", preco: 320, kg: 4 },
];
const RECHEIOS_BOLO_TRAD = ["Beijinho", "Chocolate Preto", "Ninho", "Morango"];
const RECHEIOS_BOLO_ESP = ["Romeu e Julieta", "Crocante", "Ninho com Morango", "Ninho com Nutella", "Ninho com Abacaxi"];

/* ---------- Catálogo ---------- */
const CATEGORIAS = [
  {
    id: "kit-festa",
    nome: "Kit Festa",
    resumo: "Bolo + salgados + brigadeiros, prontos para a festa.",
    nota: "Você escolhe a massa, o recheio, os salgados e os brigadeiros. Mínimo de 10 unidades por sabor.",
    itens: [
      { id: "kit1", tipo: "kit", bolo3d: { kg: 0.8 }, nome: "Kit 1", pessoas: "Ideal para até 8 pessoas", preco: 90, img: GAL + "romeu-confete-sensacao.jpg", inclui: ["Bolo PP (6 a 8 fatias)", "10 salgados", "10 brigadeiros"], campos: camposKitFesta(10, 10), temBolo: true },
      { id: "kit2", tipo: "kit", bolo3d: { kg: 1.2 }, nome: "Kit 2", pessoas: "Ideal para 10 pessoas", preco: 130, img: GAL + "doce-de-leite-grid.jpg", inclui: ["Bolo P (até 12 fatias)", "20 salgados", "20 brigadeiros"], campos: camposKitFesta(20, 20), temBolo: true },
      { id: "kit3", tipo: "kit", bolo3d: { kg: 1.5 }, nome: "Kit 3", pessoas: "Ideal para 15 pessoas", preco: 205, img: GAL + "flores-margaridas.jpg", inclui: ["Bolo M (16 fatias)", "30 salgados", "30 brigadeiros"], campos: camposKitFesta(30, 30), temBolo: true, destaque: "Mais pedido" },
      { id: "kit4", tipo: "kit", bolo3d: { kg: 2 }, nome: "Kit 4", pessoas: "Ideal para 20 pessoas", preco: 260, img: GAL + "rosas-douradas-50.jpg", inclui: ["Bolo 2 kg (20 fatias)", "40 salgados", "40 brigadeiros"], campos: camposKitFesta(40, 40), temBolo: true },
      { id: "kit5", tipo: "kit", bolo3d: { kg: 3 }, nome: "Kit 5", pessoas: "Ideal para 30 pessoas", preco: 390, img: GAL + "flores-15-anos.jpg", inclui: ["Bolo 3 kg (30 fatias)", "60 salgados", "60 brigadeiros"], campos: camposKitFesta(60, 60), temBolo: true },
    ],
  },
  {
    id: "mesversario",
    nome: "Kit Mesversário",
    resumo: "Para comemorações pequenas, com doces personalizados no tema.",
    nota: "Os personalizados de papelaria são cobrados à parte e não estão inclusos no valor do kit.",
    itens: [
      { id: "kit6", tipo: "kit", bolo3d: { kg: 1.2 }, extras3d: ["pirulito","pirulito","pirulito","pirulito"], nome: "Kit 6", preco: 125, img: GAL + "fundo-do-mar.jpg", inclui: ["Bolo P (12 fatias)", "10 brigadeiros", "4 pirulitos"], campos: camposMesversario(10), temBolo: true },
      { id: "kit7", tipo: "kit", bolo3d: { kg: 1.5 }, extras3d: ["cupcake","pirulito","cupcake","pirulito","cupcake","pirulito","cupcake","pirulito"], nome: "Kit 7", preco: 210, img: GAL + "copa-brasil.jpg", inclui: ["Bolo 1,5 kg (até 16 fatias)", "20 brigadeiros", "4 cupcakes", "4 pirulitos"], campos: camposMesversario(20), temBolo: true },
      { id: "kit8", tipo: "kit", bolo3d: { kg: 2 }, extras3d: ["cupcake","pirulito","cupcake","pirulito","cupcake","pirulito","cupcake","pirulito","cupcake","pirulito","cupcake","pirulito"], nome: "Kit 8", preco: 275, img: GAL + "flores-pink.jpg", inclui: ["Bolo 2 kg (20 fatias)", "30 brigadeiros", "6 cupcakes", "6 pirulitos"], campos: camposMesversario(30), temBolo: true },
    ],
  },
  {
    id: "doces-salgados",
    nome: "Kit Doces & Salgados",
    resumo: "Doces tradicionais e salgados fritos, sem bolo.",
    nota: "As opções de doces e salgados são as mesmas do Kit Festa. Mínimo de 10 unidades por sabor.",
    itens: [
      { id: "kit9", tipo: "kit", nome: "Kit 9", preco: 100, img: GAL + "coloridos-carimbados.jpg", inclui: ["30 doces tradicionais", "60 salgados fritos"], campos: camposDocesSalgados(30, 60) },
      { id: "kit10", tipo: "kit", nome: "Kit 10", preco: 170, img: IMG + "pastelzinho.jpg", inclui: ["50 doces tradicionais", "100 salgados fritos"], campos: camposDocesSalgados(50, 100) },
      { id: "kit11", tipo: "kit", nome: "Kit 11", preco: 340, img: IMG + "coxinha.jpg", inclui: ["100 doces", "200 salgados"], campos: camposDocesSalgados(100, 200) },
      { id: "kit12", tipo: "kit", nome: "Kit 12", preco: 580, img: GAL + "oreo.jpg", inclui: ["200 doces", "300 salgados"], campos: camposDocesSalgados(200, 300) },
    ],
  },
  {
    id: "bolos",
    nome: "Bolos Personalizados",
    resumo: "Escolha o tamanho, 1 massa e 2 recheios.",
    nota: "Trabalhamos com 50% de entrada no ato da encomenda e o restante antes da entrega. Em caso de desistência 24 horas antes da entrega, não há devolução dos 50% pagos.",
    itens: [
      {
        id: "bolo",
        tipo: "bolo",
        nome: "Bolo Personalizado",
        descricao: "Monte o seu bolo: tamanho de 8 a 40 fatias, massa de baunilha, chocolate ou red velvet e dois recheios.",
        precoAPartir: 70,
        temBolo: true,
        campos: [
          { tipo: "radio", id: "tamanho", rotulo: "Tamanho", opcoes: TAMANHOS_BOLO.map((t) => t.rotulo), precos: TAMANHOS_BOLO.map((t) => t.preco) },
          { tipo: "radio", id: "massa", rotulo: "Massa", opcoes: ["Baunilha", "Chocolate", "Red Velvet"], extras: { "Red Velvet": "+R$ 10/kg" } },
          { tipo: "multi", id: "recheio", rotulo: "Recheios", grupos: [{ nome: "Tradicionais", opcoes: RECHEIOS_BOLO_TRAD }, { nome: "Especiais (+R$ 10/kg)", opcoes: RECHEIOS_BOLO_ESP }], opcoes: [...RECHEIOS_BOLO_TRAD, ...RECHEIOS_BOLO_ESP], min: 2, max: 2, dica: "Escolha 2 recheios" },
          { tipo: "texto", id: "tema", rotulo: "Tema / decoração (opcional)", placeholder: "Ex.: Aniversário de 30 anos, tons de rosa" },
        ],
        calcularPreco(sel) {
          const t = TAMANHOS_BOLO.find((x) => x.rotulo === sel.tamanho);
          if (!t) return 70;
          let preco = t.preco;
          if (sel.massa === "Red Velvet") preco += 10 * t.kg;
          if ((sel.recheio || []).some((r) => RECHEIOS_BOLO_ESP.includes(r))) preco += 10 * t.kg;
          return Math.round(preco * 100) / 100;
        },
      },
    ],
  },
  {
    id: "brigadeiros",
    nome: "Brigadeiros",
    resumo: "18 gramas cada. Pedido mínimo de 10 unidades por sabor.",
    nota: "Tradicionais R$ 1,60 · Especiais R$ 1,80 e R$ 2,00 a unidade.",
    grupos: true,
    itens: [
      { id: "b-cacau", tipo: "unidade", grupo: "Tradicionais", nome: "Brigadeiro Cacau 50%", descricao: "Cacau 50%, envolto do granulado miçanga ou vermicelli.", preco: 1.6, min: 10, passo: 5, img: IMG + "cacau-50.jpg" },
      { id: "b-bemcasado", tipo: "unidade", grupo: "Tradicionais", nome: "Bem Casado", descricao: "Brigadeiro preto e brigadeiro branco, envolto do açúcar refinado.", preco: 1.6, min: 10, passo: 5, img: IMG + "bem-casado.jpg" },
      { id: "b-ninho", tipo: "unidade", grupo: "Tradicionais", nome: "Ninho", descricao: "Brigadeiro de leite em pó.", preco: 1.6, min: 10, passo: 5, img: IMG + "ninho.jpg" },
      { id: "b-beijinho", tipo: "unidade", grupo: "Tradicionais", nome: "Beijinho", descricao: "Brigadeiro de coco, granulado com coco desidratado.", preco: 1.6, min: 10, passo: 5, img: IMG + "beijinho.jpg" },
      { id: "b-moranguinho", tipo: "unidade", grupo: "Tradicionais", nome: "Moranguinho", descricao: "Brigadeiro sabor morango, envolto do açúcar refinado.", preco: 1.6, min: 10, passo: 5, img: IMG + "moranguinho.jpg" },
      { id: "b-uva", tipo: "unidade", grupo: "Tradicionais", nome: "Surpresa de Uva", descricao: "Brigadeiro branco colorido com uva Thompson (sem semente).", preco: 1.6, min: 10, passo: 5, img: IMG + "surpresa-uva.jpg" },

      { id: "b-napolitano", tipo: "unidade", grupo: "Especiais", nome: "Napolitano", descricao: "Brigadeiro preto, branco e moranguinho, envolto do açúcar refinado.", preco: 1.8, min: 10, passo: 5, img: IMG + "napolitano.jpg" },
      { id: "b-cajuzinho", tipo: "unidade", grupo: "Especiais", nome: "Cajuzinho", descricao: "Brigadeiro cajuzinho regional, granulado no açúcar.", preco: 1.8, min: 10, passo: 5, img: IMG + "cajuzinho.jpg" },
      { id: "b-docedeleite", tipo: "unidade", grupo: "Especiais", nome: "Doce de Leite", descricao: "Envolto do açúcar refinado e finalizado com pitanga de doce de leite.", preco: 1.8, min: 10, passo: 5, img: IMG + "doce-de-leite.jpg" },
      { id: "b-amendoim", tipo: "unidade", grupo: "Especiais", nome: "Amendoim (Ouriço)", descricao: "Brigadeiro de amendoim, envolto do xerém de amendoim.", preco: 1.8, min: 10, passo: 5, img: IMG + "amendoim.jpg" },
      { id: "b-prestigio", tipo: "unidade", grupo: "Especiais", nome: "Prestígio", descricao: "Brigadeiro de coco dentro, brigadeiro preto por fora, envolto do coco desidratado.", preco: 1.8, min: 10, passo: 5, img: IMG + "prestigio.jpg" },
      { id: "b-romeu", tipo: "unidade", grupo: "Especiais", nome: "Romeu e Julieta", descricao: "Brigadeiro de queijo com goiabada.", preco: 1.8, min: 10, passo: 5, img: IMG + "romeu-julieta.jpg" },
      { id: "b-meioamargo", tipo: "unidade", grupo: "Especiais", nome: "Meio Amargo", descricao: "70% cacau, com chocolate nobre meio amargo, envolto do cacau em pó.", preco: 1.8, min: 10, passo: 5, img: IMG + "meio-amargo.jpg" },

      { id: "b-charge", tipo: "unidade", grupo: "Especiais Premium", nome: "Charge", descricao: "Brigadeiro preto com doce de leite dentro, envolto do xerém de amendoim, finalizado com doce de leite.", preco: 2, min: 10, passo: 5, img: IMG + "charge.jpg" },
      { id: "b-ferrero", tipo: "unidade", grupo: "Especiais Premium", nome: "Ferrero Rocher", descricao: "Brigadeiro de Nutella, envolto do xerém de amendoim, finalizado com Nutella.", preco: 2, min: 10, passo: 5, img: IMG + "ferrero.jpg" },
      { id: "b-oreo", tipo: "unidade", grupo: "Especiais Premium", nome: "Oreo", descricao: "Brigadeiro de Oreo, envolto no leite em pó e finalizado com Oreo em cima.", preco: 2, min: 10, passo: 5, img: IMG + "oreo.jpg" },
      { id: "b-ninhonutella", tipo: "unidade", grupo: "Especiais Premium", nome: "Ninho com Nutella", descricao: "Brigadeiro branco envolto do leite Ninho em pó, com Nutella por fora.", preco: 2, min: 10, passo: 5, img: IMG + "ninho-nutella.jpg" },
      { id: "b-churros", tipo: "unidade", grupo: "Especiais Premium", nome: "Churros", descricao: "Brigadeiro de churros, finalizado no doce de leite.", preco: 2, min: 10, passo: 5, img: IMG + "churros.jpg" },
      { id: "b-sensacao", tipo: "unidade", grupo: "Especiais Premium", nome: "Sensação", descricao: "Brigadeiro preto com moranguinho, finalizado na Nutella.", preco: 2, min: 10, passo: 5, img: IMG + "sensacao.jpg" },
      { id: "b-kitkat", tipo: "unidade", grupo: "Especiais Premium", nome: "Kit Kat", descricao: "Brigadeiro de chocolate preto, granulado crocante chocoball, finalizado com Kit Kat.", preco: 2, min: 10, passo: 5, img: IMG + "kitkat.jpg" },
      { id: "b-pacoca", tipo: "unidade", grupo: "Especiais Premium", nome: "Paçoca", descricao: "Brigadeiro de paçoca, finalizado na paçoca.", preco: 2, min: 10, passo: 5, img: IMG + "pacoca.jpg" },
      { id: "b-confete", tipo: "unidade", grupo: "Especiais Premium", nome: "Confete", descricao: "Brigadeiro preto, granulado no confete.", preco: 2, min: 10, passo: 5, img: IMG + "confete.jpg" },
      { id: "b-limao", tipo: "unidade", grupo: "Especiais Premium", nome: "Limão", descricao: "Brigadeiro cremoso de limão.", preco: 2, min: 10, passo: 5, img: IMG + "limao.jpg" },
    ],
  },
  {
    id: "personalizados",
    nome: "Personalizados",
    resumo: "Doces no tema da sua festa.",
    nota: "Conferimos a disponibilidade do tema e do molde pelo WhatsApp após o pedido.",
    itens: [
      { id: "p-carimbado", tipo: "unidade", nome: "Brigadeiros Carimbados", descricao: "No sabor Ninho, pode ser colorido. 18 g.", preco: 2, min: 10, passo: 5, img: IMG + "carimbados.jpg", campos: [{ tipo: "texto", id: "tema", rotulo: "Tema / cores", placeholder: "Ex.: Chá revelação, azul e rosa", obrigatorio: true }] },
      { id: "p-personalizado", tipo: "unidade", nome: "Brigadeiros Personalizados", descricao: "Aplicação em pasta americana, no formato do tema. Sabores tradicionais. 18 g.", preco: 2.4, min: 30, passo: 5, img: IMG + "personalizados.jpg", campos: [{ tipo: "texto", id: "tema", rotulo: "Tema", placeholder: "Ex.: Fazendinha, Futebol…", obrigatorio: true }, { tipo: "radio", id: "sabor", rotulo: "Sabor", opcoes: ["Chocolate (Cacau 50%)", "Ninho", "Bem Casado", "Beijinho", "Moranguinho", "Surpresa de Uva"] }] },
      { id: "p-pirulito", tipo: "unidade", nome: "Pirulito de Chocolate", descricao: "Cobertura de chocolate blend ou ao leite. Acompanha papelaria.", preco: 7, min: 4, passo: 1, img: IMG + "pirulito.jpg", campos: [{ tipo: "radio", id: "chocolate", rotulo: "Chocolate", opcoes: ["Blend", "Ao leite"] }, { tipo: "texto", id: "tema", rotulo: "Tema da papelaria", placeholder: "Ex.: Mickey — Lucca 1 ano", obrigatorio: true }] },
      { id: "p-cupcake", tipo: "unidade", nome: "Cupcakes", descricao: "Massa de baunilha ou chocolate, recheio de chocolate ou Ninho. Acompanha papelaria.", preco: 8, min: 4, passo: 1, img: IMG + "cupcake.jpg", campos: [{ tipo: "radio", id: "massa", rotulo: "Massa", opcoes: ["Baunilha", "Chocolate"] }, { tipo: "radio", id: "recheio", rotulo: "Recheio", opcoes: ["Chocolate", "Ninho"] }, { tipo: "texto", id: "tema", rotulo: "Tema da papelaria", placeholder: "Ex.: Barbie", obrigatorio: true }] },
      { id: "p-brownie", tipo: "unidade", nome: "Mini Brownie", descricao: "Massa de brownie com recheio à escolha.", preco: 2.5, min: 15, passo: 5, img: IMG + "mini-brownie.jpg", campos: [{ tipo: "radio", id: "recheio", rotulo: "Recheio", opcoes: ["Ninho", "Chocolate", "Doce de Leite", "Morango"] }] },
    ],
  },
  {
    id: "finos",
    nome: "Doces Finos",
    resumo: "Para casamentos, aniversários e eventos especiais.",
    nota: "Mínimo de 30 unidades por sabor. Escolha o sabor da barra: Blend, Meio Amargo ou Chocolate Branco.",
    grupos: true,
    itens: [
      { id: "f-brigadeiro", tipo: "unidade", grupo: "Clássicos", nome: "Brigadeiro", preco: 3, min: 30, passo: 5, ilustracao: "fino", cor: "#5b3428", campos: [{ tipo: "radio", id: "barra", rotulo: "Sabor da barra", opcoes: BARRAS }] },
      { id: "f-ninho", tipo: "unidade", grupo: "Clássicos", nome: "Ninho", preco: 3, min: 30, passo: 5, ilustracao: "fino", cor: "#f1e3c8", campos: [{ tipo: "radio", id: "barra", rotulo: "Sabor da barra", opcoes: BARRAS }] },
      { id: "f-morango", tipo: "unidade", grupo: "Clássicos", nome: "Saborizado de Morango", preco: 3, min: 30, passo: 5, ilustracao: "fino", cor: "#e9a2a8", campos: [{ tipo: "radio", id: "barra", rotulo: "Sabor da barra", opcoes: BARRAS }] },
      { id: "f-prestigio", tipo: "unidade", grupo: "Clássicos", nome: "Prestígio", preco: 3.4, min: 30, passo: 5, ilustracao: "fino", cor: "#f6f1ea", campos: [{ tipo: "radio", id: "barra", rotulo: "Sabor da barra", opcoes: BARRAS }] },
      { id: "f-crocante", tipo: "unidade", grupo: "Clássicos", nome: "Crocante", preco: 3.4, min: 30, passo: 5, ilustracao: "fino", cor: "#b98552", campos: [{ tipo: "radio", id: "barra", rotulo: "Sabor da barra", opcoes: BARRAS }] },

      { id: "f-coracao", tipo: "unidade", grupo: "Finos", nome: "Formato Coração", preco: 3.4, min: 30, passo: 5, img: IMG + "fino-coracao.jpg", campos: [{ tipo: "radio", id: "barra", rotulo: "Sabor da barra", opcoes: BARRAS }] },
      { id: "f-limao", tipo: "unidade", grupo: "Finos", nome: "Limão", preco: 3.4, min: 30, passo: 5, ilustracao: "fino", cor: "#e8efb4", campos: [{ tipo: "radio", id: "barra", rotulo: "Sabor da barra", opcoes: BARRAS }] },
      { id: "f-maracuja", tipo: "unidade", grupo: "Finos", nome: "Maracujá", preco: 3.4, min: 30, passo: 5, ilustracao: "fino", cor: "#f4cf5d", campos: [{ tipo: "radio", id: "barra", rotulo: "Sabor da barra", opcoes: BARRAS }] },

      { id: "f-morangoesp", tipo: "unidade", grupo: "Especiais", nome: "Morango", preco: 3.6, min: 30, passo: 5, ilustracao: "fino", cor: "#d9434f", campos: [{ tipo: "radio", id: "barra", rotulo: "Sabor da barra", opcoes: BARRAS }] },
      { id: "f-cereja", tipo: "unidade", grupo: "Especiais", nome: "Cereja", preco: 3.6, min: 30, passo: 5, img: IMG + "fino-cereja.jpg", campos: [{ tipo: "radio", id: "barra", rotulo: "Sabor da barra", opcoes: BARRAS }] },
      { id: "f-camafeu", tipo: "unidade", grupo: "Especiais", nome: "Camafeu", preco: 3.6, min: 30, passo: 5, ilustracao: "fino", cor: "#f3ead9", campos: [{ tipo: "radio", id: "barra", rotulo: "Sabor da barra", opcoes: BARRAS }] },
      { id: "f-florais", tipo: "unidade", grupo: "Especiais", nome: "Florais", preco: 3.8, min: 30, passo: 5, img: GAL + "rosas-borboletas.jpg", campos: [{ tipo: "radio", id: "barra", rotulo: "Sabor da barra", opcoes: BARRAS }] },
      { id: "f-metalizados", tipo: "unidade", grupo: "Especiais", nome: "Metalizados", preco: 3.6, min: 30, passo: 5, img: IMG + "fino-metalizado.jpg", campos: [{ tipo: "radio", id: "barra", rotulo: "Sabor da barra", opcoes: BARRAS }] },
    ],
  },
  {
    id: "salgados",
    nome: "Salgados de Festa",
    resumo: "Fritos, especiais e assados.",
    nota: "Mínimo de 10 unidades por sabor.",
    grupos: true,
    itens: [
      { id: "s-coxinha", tipo: "unidade", grupo: "Fritos", nome: "Coxinha de Frango", preco: 1, min: 10, passo: 10, img: IMG + "coxinha.jpg" },
      { id: "s-bolinha", tipo: "unidade", grupo: "Fritos", nome: "Bolinha de Queijo", preco: 1, min: 10, passo: 10, img: IMG + "bolinha-queijo.jpg" },
      { id: "s-risolepizza", tipo: "unidade", grupo: "Fritos", nome: "Risole de Pizza", preco: 1, min: 10, passo: 10, ilustracao: "salgado", cor: "#d99a4e" },
      { id: "s-risolecarne", tipo: "unidade", grupo: "Fritos", nome: "Risole de Carne", preco: 1, min: 10, passo: 10, ilustracao: "salgado", cor: "#c98a3e" },
      { id: "s-pastelcarne", tipo: "unidade", grupo: "Fritos", nome: "Pastelzinho de Carne", preco: 1, min: 10, passo: 10, img: IMG + "pastelzinho.jpg" },
      { id: "s-pastelqueijo", tipo: "unidade", grupo: "Fritos", nome: "Pastelzinho de Queijo", preco: 1, min: 10, passo: 10, img: IMG + "pastelzinho.jpg" },

      { id: "s-charque", tipo: "unidade", grupo: "Especiais", nome: "Bolinho de Charque", preco: 1.2, min: 10, passo: 10, ilustracao: "salgado", cor: "#c0803a" },
      { id: "s-pastelromeu", tipo: "unidade", grupo: "Especiais", nome: "Pastelzinho Romeu e Julieta", preco: 1.2, min: 10, passo: 10, ilustracao: "salgado", cor: "#e0a95c" },
      { id: "s-camarao", tipo: "unidade", grupo: "Especiais", nome: "Camarão Empanado", preco: 1.6, min: 10, passo: 10, ilustracao: "salgado", cor: "#e3964a" },

      { id: "s-quichequeijo", tipo: "unidade", grupo: "Assados", nome: "Quiche de Queijos", preco: 1.4, min: 10, passo: 10, ilustracao: "quiche", cor: "#f0c35a" },
      { id: "s-quichefrango", tipo: "unidade", grupo: "Assados", nome: "Quiche de Frango", preco: 1.4, min: 10, passo: 10, ilustracao: "quiche", cor: "#e9b44c" },
    ],
  },
];

/* ---------- Cores do visualizador 3D ---------- */
const CORES_3D = {
  massas: { Chocolate: "#5a3326", Baunilha: "#f1d79f", "Red Velvet": "#9e2330" },
  massaPadrao: "#f1d79f",
  recheios: {
    "Bem casado": "#c49a6c", Chocolate: "#3f231a", "Chocolate Preto": "#3f231a", Ninho: "#f6edd8",
    Morango: "#ee8fa0", Beijinho: "#fffaf2", "Romeu e Julieta": "#e9c08f", Crocante: "#a8703e",
    "Ninho com Morango": "#f4c6cc", "Ninho com Nutella": "#7b4a30", "Ninho com Abacaxi": "#f3df86",
  },
  recheioPadrao: "#f3e6d6",
  // decoração do topo de acordo com o recheio
  topos: {
    Morango: { tipo: "morango" }, "Ninho com Morango": { tipo: "morango" }, "Ninho com Abacaxi": { tipo: "abacaxi" },
    "Romeu e Julieta": { tipo: "goiabada" }, Crocante: { tipo: "crocante" }, Beijinho: { tipo: "coco" },
    "Ninho com Nutella": { tipo: "bolinha", cor: "#4a2a1c" }, Chocolate: { tipo: "bolinha", cor: "#3b2018" },
    "Chocolate Preto": { tipo: "bolinha", cor: "#3b2018" }, Ninho: { tipo: "bolinha", cor: "#f3e8cd" },
    "Bem casado": { tipo: "bolinha", cor: "#3b2018" },
  },
  doces: {
    "Brigadeiro de Chocolate": { forma: "brigadeiro", cor: "#3b2018", granulado: true },
    Ninho: { forma: "brigadeiro", cor: "#f3e8cd" },
    "Surpresa de Uva": { forma: "brigadeiro", cor: "#a5d68f" },
    "Bem Casado": { forma: "bemcasado", cor: "#3b2018", cor2: "#f3e8cd" },
    "Beijinho de Coco": { forma: "beijinho", cor: "#fffaf2" },
  },
  salgados: {
    "Coxinha de Frango": { forma: "coxinha", cor: "#d48f3c" },
    "Bolinho de Queijo": { forma: "bolinha", cor: "#dda04a" },
    "Pastelzinho de Queijo": { forma: "pastel", cor: "#e5b35a" },
    "Pastelzinho de Carne": { forma: "pastel", cor: "#d9a24c" },
  },
  extras: {
    cupcake: { forma: "cupcake", cor: "#f4b6c2", cor2: "#e0a2ae" },
    pirulito: { forma: "pirulito", cor: "#4a2a1c", cor2: "#f5d7a1" },
  },
};

const GALERIA = [
  { src: GAL + "copa-brasil.jpg", alt: "Caixa de brigadeiros personalizados com tema Brasil e futebol" },
  { src: GAL + "romeu-confete-sensacao.jpg", alt: "Brigadeiros Romeu e Julieta, Confete e Sensação" },
  { src: GAL + "flores-15-anos.jpg", alt: "Doces em formato de rosas e flores para 15 anos" },
  { src: GAL + "rosas-douradas-50.jpg", alt: "Doces dourados e rosas para bodas de 50 anos" },
  { src: GAL + "flores-margaridas.jpg", alt: "Doces decorados com margaridas e flores coloridas" },
  { src: GAL + "fundo-do-mar.jpg", alt: "Doces com tema fundo do mar: conchas e estrelas" },
  { src: GAL + "halloween.jpg", alt: "Doces de Halloween: abóboras, caveiras e fantasmas" },
  { src: GAL + "oreo.jpg", alt: "Brigadeiros de Oreo" },
  { src: GAL + "coloridos-carimbados.jpg", alt: "Brigadeiros carimbados coloridos" },
  { src: GAL + "rosas-borboletas.jpg", alt: "Doces com rosas, borboletas e glitter dourado" },
  { src: GAL + "flores-pink.jpg", alt: "Mesa de doces com flores pink e borboletas" },
  { src: GAL + "doce-de-leite-grid.jpg", alt: "Brigadeiros de doce de leite e chocolate" },
];
