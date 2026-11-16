/* =========================================================
   Odara Doces e Salgados — lógica da loja (visão do cliente)
   Carrinho e histórico ficam no navegador (localStorage).
   O pedido é finalizado enviando a mensagem para o WhatsApp.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Utilidades ---------- */
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const armazem = {
    ler(chave, padrao) {
      try { const v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; } catch { return padrao; }
    },
    gravar(chave, valor) {
      try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* armazenamento indisponível */ }
    },
  };
  const CHAVES = { carrinho: "odara.carrinho.v1", pedidos: "odara.pedidos.v1", cliente: "odara.cliente.v1" };

  const ITENS = {};
  const CATEGORIA_DO_ITEM = {};
  CATEGORIAS.forEach((c) => c.itens.forEach((i) => { ITENS[i.id] = i; CATEGORIA_DO_ITEM[i.id] = c; }));

  const whatsUrl = (texto) => `https://wa.me/${CONFIG.whatsapp}${texto ? "?text=" + encodeURIComponent(texto) : ""}`;

  /* ---------- Ilustrações (para itens sem foto) ---------- */
  const ILUS = {
    fino: (cor = "#6b443b") => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 36h40l-5 18H17z" fill="#fff" stroke="#d9bdb5" stroke-width="1.5"/><path d="M16 36l3 18M24 36l1.5 18M32 36v18M40 36l-1.5 18M48 36l-3 18" stroke="#ead8d2" stroke-width="1.2"/><circle cx="32" cy="27" r="14" fill="${cor}"/><path d="M22 23c3-5 9-7 14-5" stroke="#fff" stroke-opacity=".45" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="32" cy="13" r="3" fill="#b99158"/></svg>`,
    salgado: (cor = "#d99a4e") => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 40c0-12 10-22 22-22s22 10 22 22c0 4-3 6-7 6H17c-4 0-7-2-7-6z" fill="${cor}"/><g fill="#fff" fill-opacity=".35"><circle cx="22" cy="32" r="1.6"/><circle cx="30" cy="27" r="1.4"/><circle cx="38" cy="31" r="1.6"/><circle cx="44" cy="37" r="1.3"/><circle cx="26" cy="38" r="1.3"/><circle cx="35" cy="38" r="1.5"/></g><path d="M14 44c6 2 30 2 36 0" stroke="#8a5a2b" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
    quiche: (cor = "#f0c35a") => `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="40" rx="24" ry="10" fill="#c98a3e"/><ellipse cx="32" cy="36" rx="24" ry="10" fill="#e3a957"/><ellipse cx="32" cy="35" rx="19" ry="7" fill="${cor}"/><g fill="#9c6a2a" fill-opacity=".35"><circle cx="26" cy="34" r="1.5"/><circle cx="34" cy="33" r="1.8"/><circle cx="39" cy="36" r="1.3"/><circle cx="30" cy="37" r="1.2"/></g><path d="M8 36c2 2 4-1 6 1s4-1 6 1 4-1 6 1 4-1 6 1 4-1 6 1 4-1 6 1 4-1 6 1" stroke="#c98a3e" stroke-width="2" fill="none"/></svg>`,
    bolo: () => `<svg viewBox="0 0 220 200" aria-hidden="true"><ellipse cx="110" cy="182" rx="92" ry="12" fill="#a0706a" opacity=".18"/><rect x="30" y="112" width="160" height="64" rx="12" fill="#6b443b"/><rect x="30" y="134" width="160" height="10" fill="#f0cdbf"/><rect x="52" y="62" width="116" height="56" rx="12" fill="#efd9d2"/><rect x="52" y="82" width="116" height="8" fill="#a0706a" opacity=".55"/><path d="M52 74c10 10 20 10 29 0s19-10 29 0 19 10 29 0 19-10 29 0" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M30 122c10 12 22 12 32 0s22-12 32 0 22 12 32 0 22-12 32 0 22 12 32 0" fill="none" stroke="#efd9d2" stroke-width="7" stroke-linecap="round"/><rect x="106" y="30" width="8" height="32" rx="3" fill="#b99158"/><path d="M110 12c6 7 6 13 0 16-6-3-6-9 0-16z" fill="#f4b740"/><g fill="#b99158"><circle cx="70" cy="155" r="3"/><circle cx="96" cy="160" r="3"/><circle cx="124" cy="155" r="3"/><circle cx="150" cy="160" r="3"/><circle cx="172" cy="154" r="3"/><circle cx="48" cy="159" r="3"/></g></svg>`,
    sacola: () => `<svg viewBox="0 0 96 96" aria-hidden="true"><path d="M20 34h56l-4 46a6 6 0 0 1-6 5H30a6 6 0 0 1-6-5z" fill="#efd9d2"/><path d="M34 40V28a14 14 0 0 1 28 0v12" fill="none" stroke="#a0706a" stroke-width="4" stroke-linecap="round"/><path d="M48 70s-12-7-12-15a6 6 0 0 1 12-2 6 6 0 0 1 12 2c0 8-12 15-12 15z" fill="#a0706a"/></svg>`,
  };
  const ICONE_INFO = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 11v6M12 7.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const ICONE_WHATS = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z"/></svg>`;

  function midia(item, classeImg, classeIlus) {
    if (item.img) return `<img class="${classeImg}" src="${item.img}" alt="${esc(item.nome)}" loading="lazy" />`;
    const tipo = item.tipo === "bolo" ? "bolo" : item.ilustracao || "fino";
    return `<span class="${classeIlus}">${ILUS[tipo](item.cor)}</span>`;
  }

  /* ---------- Estado ---------- */
  let carrinho = armazem.ler(CHAVES.carrinho, []).filter((l) => ITENS[l.itemId]);
  let pedidos = armazem.ler(CHAVES.pedidos, []);
  const salvarCarrinho = () => { armazem.gravar(CHAVES.carrinho, carrinho); atualizarResumoCarrinho(); };

  const limitesQtd = (item) => (item.tipo === "unidade" ? { min: item.min, passo: item.passo } : { min: 1, passo: 1 });
  const ajustarQtd = (item, q) => {
    const { min, passo } = limitesQtd(item);
    q = Math.max(min, Math.round(Number(q) || min));
    // alinha ao passo a partir do mínimo
    const resto = (q - min) % passo;
    if (resto) q += passo - resto;
    return Math.min(q, 5000);
  };
  const totalCarrinho = () => carrinho.reduce((s, l) => s + l.precoUnit * l.qtd, 0);
  const temBolo = (linhas) => linhas.some((l) => ITENS[l.itemId]?.temBolo);
  // Itens com bolo: 50% de entrada. Demais itens: pagamento integral no ato da encomenda.
  const valorReserva = (linhas) => linhas.reduce((s, l) => s + l.precoUnit * l.qtd * (ITENS[l.itemId]?.temBolo ? 0.5 : 1), 0);

  function precoItem(item, sel) {
    if (typeof item.calcularPreco === "function") return item.calcularPreco(sel);
    return item.preco;
  }
  function detalhesSelecao(item, sel) {
    if (!item.campos) return [];
    return item.campos
      .filter((c) => sel[c.id] && (!Array.isArray(sel[c.id]) || sel[c.id].length))
      .map((c) => {
        const rot = c.rotulo.replace(/\s*\(.*\)$/, "");
        const v = Array.isArray(sel[c.id]) ? sel[c.id].join(", ") : sel[c.id];
        return `${rot}: ${v}`;
      });
  }
  function nomeLinha(item) {
    const cat = CATEGORIA_DO_ITEM[item.id];
    return item.tipo === "kit" ? `${item.nome} · ${cat.nome}` : item.nome;
  }

  function adicionarAoCarrinho(item, qtd, sel = {}) {
    const chave = item.id + "|" + JSON.stringify(sel);
    const existente = carrinho.find((l) => l.chave === chave);
    if (existente) existente.qtd = ajustarQtd(item, existente.qtd + qtd);
    else carrinho.push({ chave, itemId: item.id, nome: nomeLinha(item), qtd: ajustarQtd(item, qtd), precoUnit: precoItem(item, sel), selecao: sel, detalhes: detalhesSelecao(item, sel) });
    salvarCarrinho();
    toast(`${item.nome} adicionado ao carrinho`);
    const b = $("#badgeCarrinho");
    b.classList.remove("pulse"); void b.offsetWidth; b.classList.add("pulse");
  }

  /* ---------- Cardápio ---------- */
  let categoriaAtual = CATEGORIAS[0].id;

  function renderAbas() {
    $("#abas").innerHTML = CATEGORIAS.map((c) =>
      `<button class="aba" role="tab" type="button" id="aba-${c.id}" aria-controls="painelCategoria" aria-selected="${c.id === categoriaAtual}" data-cat="${c.id}">${esc(c.nome)}</button>`
    ).join("");
  }

  function renderCategoria(id) {
    categoriaAtual = id;
    const cat = CATEGORIAS.find((c) => c.id === id);
    $$(".aba").forEach((a) => a.setAttribute("aria-selected", a.dataset.cat === id));
    $("#painelCategoria").setAttribute("aria-labelledby", "aba-" + id);
    const ativa = $(`#aba-${id}`);
    const abas = $("#abas");
    if (ativa) abas.scrollTo({ left: ativa.offsetLeft - abas.clientWidth / 2 + ativa.clientWidth / 2, behavior: "smooth" });

    let html = `<div class="painel__cabeca"><div><h3>${esc(cat.nome)}</h3><p>${esc(cat.resumo)}</p></div></div>`;
    if (cat.nota) html += `<p class="nota">${ICONE_INFO}<span>${esc(cat.nota)}</span></p>`;

    const tipo = cat.itens[0].tipo;
    if (tipo === "kit") {
      html += `<div class="grade-kits">${cat.itens.map(cardKit).join("")}</div>`;
    } else if (tipo === "bolo") {
      html += cardBolo(cat.itens[0]);
    } else if (cat.grupos) {
      const grupos = [...new Set(cat.itens.map((i) => i.grupo))];
      grupos.forEach((g) => {
        const itens = cat.itens.filter((i) => i.grupo === g);
        const precos = [...new Set(itens.map((i) => i.preco))];
        const faixa = precos.length === 1 ? `${brl(precos[0])} un.` : `${brl(Math.min(...precos))} a ${brl(Math.max(...precos))}`;
        html += `<h4 class="grupo-titulo">${esc(g)} <small>${faixa}</small></h4><div class="grade-produtos">${itens.map(cardProduto).join("")}</div>`;
      });
    } else {
      html += `<div class="grade-produtos">${cat.itens.map(cardProduto).join("")}</div>`;
    }
    $("#painelCategoria").innerHTML = html;
  }

  function cardKit(item) {
    return `<article class="kit">
      ${item.destaque ? `<span class="kit__tag">${esc(item.destaque)}</span>` : ""}
      <img class="kit__foto" src="${item.img}" alt="" loading="lazy" />
      <span class="selo-3d" title="Monte e veja em 3D">3D</span>
      <div class="kit__corpo">
        <div class="kit__nome"><h4>${esc(item.nome)}</h4><span class="kit__preco">${brl(item.preco)}</span></div>
        <p class="kit__pessoas">${esc(item.pessoas || "Personalizado no tema")}</p>
        <ul class="kit__inclui">${item.inclui.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <button class="btn btn--primario btn--bloco" type="button" data-configurar="${item.id}">Montar em 3D</button>
      </div>
    </article>`;
  }

  function cardBolo(item) {
    return `<div class="bolo-card">
      <div class="bolo-card__arte">${ILUS.bolo()}<span class="selo-3d">Veja as camadas em 3D</span></div>
      <div class="bolo-card__corpo">
        <h4>${esc(item.nome)}</h4>
        <p class="produto__desc">${esc(item.descricao)}</p>
        <table class="tabela-tamanhos"><tbody>
          ${TAMANHOS_BOLO.map((t) => `<tr><td>${esc(t.rotulo)}</td><td>${brl(t.preco)}</td></tr>`).join("")}
        </tbody></table>
        <p class="dica">Massa Red Velvet e recheios especiais (Romeu e Julieta, Crocante, Ninho com Morango, Ninho com Nutella, Ninho com Abacaxi): acréscimo de R$ 10 por kg.</p>
        <button class="btn btn--primario btn--bloco" type="button" data-configurar="${item.id}">Montar meu bolo em 3D</button>
      </div>
    </div>`;
  }

  function cardProduto(item) {
    const temCampos = !!item.campos;
    return `<article class="produto">
      ${midia(item, "produto__foto", "produto__ilus")}
      <div class="produto__info">
        <h4>${esc(item.nome)}</h4>
        ${item.descricao ? `<p class="produto__desc">${esc(item.descricao)}</p>` : ""}
        <div class="produto__meta"><span class="produto__preco">${brl(item.preco)} <small>/un.</small></span><span class="produto__min">mín. ${item.min} un.</span></div>
        <div class="produto__acoes">
          ${stepperHtml(item.id, item.min, "Quantidade de " + item.nome)}
          <button class="btn-add" type="button" ${temCampos ? `data-configurar="${item.id}"` : `data-adicionar="${item.id}"`}>${temCampos ? "Personalizar" : "Adicionar"}</button>
        </div>
      </div>
    </article>`;
  }

  function stepperHtml(ref, valor, rotulo) {
    return `<div class="stepper" data-stepper="${ref}">
      <button type="button" data-delta="-1" aria-label="Diminuir">−</button>
      <input type="number" inputmode="numeric" value="${valor}" aria-label="${esc(rotulo)}" />
      <button type="button" data-delta="1" aria-label="Aumentar">+</button>
    </div>`;
  }

  /* ---------- Modal ---------- */
  let ultimoFoco = null;
  function abrirModal(html, largo = false) {
    ultimoFoco = document.activeElement;
    destruir3d();
    $("#modal .modal__caixa").classList.toggle("modal__caixa--largo", largo);
    $("#modalConteudo").innerHTML = html;
    $("#modal").hidden = false;
    document.body.classList.add("travado");
    setTimeout(() => ($("#modalConteudo [autofocus]") || $("#modal .modal__fechar")).focus(), 30);
  }
  function fecharModal() {
    $("#modal").hidden = true;
    destruir3d();
    if (!algumaGavetaAberta()) document.body.classList.remove("travado");
    ultimoFoco?.focus?.();
  }

  /* ---------- Visualizador 3D (carregado sob demanda) ---------- */
  let modulo3d = null;
  let visual3d = null;
  const carregar3d = () => (modulo3d ||= import(new URL("js/bolo3d.js", document.baseURI).href));
  function destruir3d() {
    if (visual3d) { visual3d.destruir(); visual3d = null; }
  }
  const tem3d = (item) => item.tipo === "bolo" || item.tipo === "kit";

  function spec3d(item, sel) {
    const C = CORES_3D;
    let bolo = null;
    if (item.tipo === "bolo" || item.bolo3d) {
      const kg = item.tipo === "bolo" ? TAMANHOS_BOLO.find((t) => t.rotulo === sel.tamanho)?.kg ?? 1.5 : item.bolo3d.kg;
      const rech = sel.recheio || [];
      const r1 = rech[0], r2 = rech[1] || rech[0];
      const calda = C.calda[r1] || C.calda[r2] || null;
      bolo = {
        kg,
        massa: C.massas[sel.massa] || C.massaPadrao,
        recheios: [C.recheios[r1] || C.recheioPadrao, C.recheios[r2] || C.recheioPadrao],
        pedacos: [C.pedacos[r1] || "", C.pedacos[r2] || ""],
        brilho: [C.brilho.includes(r1), C.brilho.includes(r2)],
        calda,
        decoracao: calda ? "#f6e6dc" : "#f2c4c3",
        topo: C.topos[r2] || C.topos[r1] || { tipo: "bolinha", cor: "#f1c9c6" },
      };
    }
    return {
      bolo,
      doces: (sel.brigadeiros || sel.doces || []).map((n) => C.doces[n]).filter(Boolean),
      salgados: (sel.salgados || []).map((n) => C.salgados[n]).filter(Boolean),
      extras: (item.extras3d || []).map((n) => C.extras[n]),
    };
  }

  function legenda3d(item, sel) {
    const C = CORES_3D;
    const itens = [];
    const ponto = (cor, rotulo, valor, vazio) => `<li class="${vazio ? "legenda__vazio" : ""}"><span class="legenda__cor" style="background:${cor}"></span><span><small>${esc(rotulo)}</small>${esc(valor)}</span></li>`;
    if (item.tipo === "bolo" || item.bolo3d) {
      const rech = sel.recheio || [];
      itens.push(ponto(C.massas[sel.massa] || C.massaPadrao, "Massa", sel.massa || "escolha a massa", !sel.massa));
      itens.push(ponto(C.recheios[rech[0]] || C.recheioPadrao, rech.length > 1 ? "Recheio 1" : "Recheio", rech[0] || "escolha o recheio", !rech[0]));
      if (rech[1]) itens.push(ponto(C.recheios[rech[1]], "Recheio 2", rech[1]));
      else if (item.tipo === "bolo") itens.push(ponto(C.recheioPadrao, "Recheio 2", "escolha o 2º recheio", true));
    }
    (sel.brigadeiros || sel.doces || []).forEach((n) => itens.push(ponto(C.doces[n]?.cor || "#ccc", "Doce", n)));
    (sel.salgados || []).forEach((n) => itens.push(ponto(C.salgados[n]?.cor || "#ccc", "Salgado", n)));
    return itens.join("");
  }

  function painel3dHtml(item) {
    const temFatia = item.tipo === "bolo" || item.bolo3d;
    return `<div class="config3d__visual">
      <div class="visual3d" id="visual3d">
        <div class="visual3d__carregando"><span class="visual3d__spinner"></span>Montando em 3D…</div>
        <span class="visual3d__selo">3D</span>
      </div>
      <div class="visual3d__barra">
        <span class="visual3d__dica"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9l-4 3 4 3M17 9l4 3-4 3M3 12h18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>Arraste para girar</span>
        ${temFatia ? `<button type="button" class="visual3d__btn" id="btnFatia" aria-pressed="true">Fechar a fatia</button>` : ""}
      </div>
      <ul class="legenda" id="legenda3d" aria-live="polite"></ul>
    </div>`;
  }

  function iniciar3d(item, obterSelecao) {
    const caixa = $("#visual3d");
    carregar3d()
      .then((mod) => {
        if (!caixa.isConnected) return;
        visual3d = mod.criarVisualizador(caixa);
        $(".visual3d__carregando", caixa)?.remove();
        visual3d.atualizar(spec3d(item, obterSelecao()));
      })
      .catch((erro) => {
        console.warn("3D indisponível:", erro);
        if (!caixa.isConnected) return;
        caixa.classList.add("visual3d--sem3d");
        caixa.innerHTML = ILUS.bolo();
        $("#btnFatia")?.remove();
        $(".visual3d__dica")?.remove();
      });
    $("#btnFatia")?.addEventListener("click", (e) => {
      if (!visual3d) return;
      const aberta = visual3d.alternarFatia();
      e.currentTarget.textContent = aberta ? "Fechar a fatia" : "Ver por dentro";
      e.currentTarget.setAttribute("aria-pressed", String(aberta));
    });
  }

  /* Configurador de item (kits, bolo e unitários com opções) */
  function abrirConfigurador(itemId, qtdInicial) {
    const item = ITENS[itemId];
    const cat = CATEGORIA_DO_ITEM[itemId];
    const ehUnidade = item.tipo === "unidade";
    const q = ajustarQtd(item, qtdInicial || (ehUnidade ? item.min : 1));
    const sub = item.tipo === "kit" ? item.inclui.join(" · ") : item.tipo === "bolo" ? "Escolha tamanho, massa e 2 recheios" : `${brl(item.preco)} a unidade · mínimo ${item.min} un.`;

    const campos = item.campos.map((c, idx) => campoHtml(c, idx)).join("");
    const com3d = tem3d(item);
    abrirModal(`
      <form id="formConfig" class="${com3d ? "config3d" : ""}" novalidate>
        <div class="modal__cabeca">
          ${midia(item, "", "produto__ilus")}
          <div><h2 id="modalTitulo">${esc(nomeLinha(item))}</h2><p>${esc(sub)}</p></div>
        </div>
        ${com3d ? `<div class="config3d__grade">${painel3dHtml(item)}` : ""}
        <div class="modal__corpo">
          ${campos}
          <fieldset><legend>${ehUnidade ? "Quantidade (unidades)" : "Quantidade"}</legend>${stepperHtml("modal:" + item.id, q, "Quantidade")}</fieldset>
          ${cat.id === "mesversario" ? `<p class="nota">${ICONE_INFO}<span>${esc(cat.nota)}</span></p>` : ""}
        </div>
        ${com3d ? "</div>" : ""}
        <div class="modal__rodape">
          <div class="modal__total"><span>Total do item</span><strong id="configTotal">—</strong></div>
          <button class="btn btn--primario" type="submit">Adicionar ao carrinho</button>
        </div>
      </form>`, com3d);

    const form = $("#formConfig");
    const lerSelecao = () => {
      const sel = {};
      item.campos.forEach((c) => {
        if (c.tipo === "multi") sel[c.id] = $$(`input[name="${c.id}"]:checked`, form).map((i) => i.value);
        else if (c.tipo === "radio") sel[c.id] = $(`input[name="${c.id}"]:checked`, form)?.value || "";
        else sel[c.id] = $(`[name="${c.id}"]`, form).value.trim();
      });
      return sel;
    };
    const lerQtd = () => ajustarQtd(item, $(".stepper input", form).value);
    const atualizar = () => {
      const sel = lerSelecao();
      // limita múltipla escolha ao máximo
      item.campos.filter((c) => c.tipo === "multi").forEach((c) => {
        const marcados = sel[c.id].length;
        $$(`input[name="${c.id}"]`, form).forEach((i) => { i.disabled = !i.checked && marcados >= c.max; });
      });
      $("#configTotal").textContent = brl(precoItem(item, sel) * lerQtd());
      if (com3d) {
        $("#legenda3d").innerHTML = legenda3d(item, sel);
        visual3d?.atualizar(spec3d(item, sel));
      }
    };
    const limparErro = (e) => {
      const bloco = e.target.closest("fieldset, .campo");
      const msg = bloco && $(".dica.erro", bloco);
      if (msg) msg.hidden = true;
    };
    form.addEventListener("change", (e) => { limparErro(e); atualizar(); });
    form.addEventListener("input", (e) => { limparErro(e); atualizar(); });
    form.addEventListener("click", (e) => { if (e.target.closest("[data-delta]")) setTimeout(atualizar); });
    atualizar();
    if (com3d) iniciar3d(item, lerSelecao);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const sel = lerSelecao();
      let primeiroErro = null;
      item.campos.forEach((c, idx) => {
        const v = sel[c.id];
        let erro = "";
        if (c.tipo === "multi" && v.length < c.min) erro = c.min === c.max ? `Escolha ${c.min} opções.` : `Escolha pelo menos ${c.min} opção.`;
        if (c.tipo === "radio" && !v) erro = "Escolha uma opção.";
        if (c.tipo === "texto" && c.obrigatorio && !v) erro = "Conte pra gente o tema.";
        const msg = $(`#erro-${idx}`, form);
        msg.textContent = erro;
        msg.hidden = !erro;
        if (erro && !primeiroErro) primeiroErro = $(`[name="${c.id}"]`, form);
      });
      if (primeiroErro) { primeiroErro.focus(); primeiroErro.scrollIntoView({ block: "center", behavior: "smooth" }); return; }
      // remove campos vazios opcionais
      Object.keys(sel).forEach((k) => { if (sel[k] === "" || (Array.isArray(sel[k]) && !sel[k].length)) delete sel[k]; });
      adicionarAoCarrinho(item, lerQtd(), sel);
      fecharModal();
    });
  }

  function campoHtml(c, idx) {
    const erro = `<p class="dica erro" id="erro-${idx}" role="alert" hidden></p>`;
    if (c.tipo === "texto") {
      return `<div class="campo"><label for="cfg-${c.id}">${esc(c.rotulo)}${c.obrigatorio ? " *" : ""}</label>
        <input id="cfg-${c.id}" name="${c.id}" type="text" maxlength="120" placeholder="${esc(c.placeholder || "")}" />${erro}</div>`;
    }
    const tipoInput = c.tipo === "multi" ? "checkbox" : "radio";
    const chip = (op, i) => {
      const preco = c.precos ? ` <small>${brl(c.precos[i])}</small>` : c.extras?.[op] ? ` <small>${esc(c.extras[op])}</small>` : "";
      return `<label class="chip"><input type="${tipoInput}" name="${c.id}" value="${esc(op)}" /><span>${esc(op)}${preco}</span></label>`;
    };
    let chips;
    if (c.grupos) {
      chips = c.grupos.map((g) => `<p class="chips__grupo">${esc(g.nome)}</p>${g.opcoes.map((op) => chip(op, c.opcoes.indexOf(op))).join("")}`).join("");
    } else chips = c.opcoes.map(chip).join("");
    const dica = c.dica || (c.tipo === "multi" ? `Escolha até ${c.max}` : "");
    const dicaMax = c.tipo === "multi" && !c.dica?.includes("até") && c.max < c.opcoes.length && c.min !== c.max ? ` · até ${c.max} sabor${c.max > 1 ? "es" : ""}` : "";
    return `<fieldset><legend>${esc(c.rotulo)}</legend>${dica ? `<p class="dica">${esc(dica + dicaMax)}</p>` : ""}<div class="chips">${chips}</div>${erro}</fieldset>`;
  }

  /* ---------- Gavetas ---------- */
  const algumaGavetaAberta = () => $$(".gaveta.aberta").length > 0;
  function abrirGaveta(id) {
    ultimoFoco = document.activeElement;
    $$(".gaveta.aberta").forEach((g) => fecharGaveta(g.id, true));
    const g = $("#" + id);
    g.classList.add("aberta");
    g.setAttribute("aria-hidden", "false");
    $("#sobreposicao").hidden = false;
    document.body.classList.add("travado");
    setTimeout(() => $(".btn-fechar", g).focus(), 50);
  }
  function fecharGaveta(id, silencioso) {
    const g = $("#" + id);
    g.classList.remove("aberta");
    g.setAttribute("aria-hidden", "true");
    if (silencioso) return;
    $("#sobreposicao").hidden = true;
    if ($("#modal").hidden) document.body.classList.remove("travado");
    ultimoFoco?.focus?.();
  }

  /* ---------- Carrinho ---------- */
  function atualizarResumoCarrinho() {
    const qtdLinhas = carrinho.length;
    const badge = $("#badgeCarrinho");
    badge.hidden = !qtdLinhas;
    badge.textContent = qtdLinhas;
    const flut = $("#carrinhoFlutuante");
    flut.hidden = !qtdLinhas;
    $("#flutuanteQtd").textContent = `${qtdLinhas} ${qtdLinhas === 1 ? "item" : "itens"}`;
    $("#flutuanteTotal").textContent = brl(totalCarrinho());
    renderCarrinho();
  }

  function renderCarrinho() {
    const corpo = $("#carrinhoCorpo");
    const rodape = $("#carrinhoRodape");
    if (!carrinho.length) {
      corpo.innerHTML = `<div class="vazio">${ILUS.sacola()}<p><strong>Seu carrinho está vazio.</strong></p><p>Que tal começar por um Kit Festa ou pelos brigadeiros?</p><button class="btn btn--linha btn--pequeno" type="button" data-ir-cardapio>Ver cardápio</button></div>`;
      rodape.hidden = true;
      return;
    }
    rodape.hidden = false;
    corpo.innerHTML = carrinho.map((l, idx) => {
      const item = ITENS[l.itemId];
      const foto = item.img ? `<img class="linha-carrinho__foto" src="${item.img}" alt="" />` : `<span class="linha-carrinho__foto">${ILUS[item.tipo === "bolo" ? "bolo" : item.ilustracao || "fino"](item.cor)}</span>`;
      return `<div class="linha-carrinho">
        ${foto}
        <div>
          <h4>${esc(l.nome)}</h4>
          <p class="linha-carrinho__det">${brl(l.precoUnit)} ${item.tipo === "unidade" ? "/un." : ""}</p>
          ${l.detalhes.map((d) => `<p class="linha-carrinho__det">${esc(d)}</p>`).join("")}
          <div class="linha-carrinho__acoes">
            ${stepperHtml("linha:" + idx, l.qtd, "Quantidade de " + l.nome)}
            <button class="btn-remover" type="button" data-remover="${idx}">Remover</button>
          </div>
        </div>
        <div class="linha-carrinho__preco">${brl(l.precoUnit * l.qtd)}</div>
      </div>`;
    }).join("");
    const total = totalCarrinho();
    rodape.innerHTML = `
      <div class="total-linha"><span>Total estimado</span><strong>${brl(total)}</strong></div>
      <p class="total-obs">Valores do cardápio. Taxa de entrega e acréscimo no cartão são combinados pelo WhatsApp.</p>
      <button class="btn btn--primario btn--bloco" type="button" data-finalizar>Finalizar pedido</button>
      <button class="btn btn--suave btn--bloco" type="button" data-ir-cardapio style="margin-top:8px">Continuar comprando</button>`;
  }

  /* ---------- Checkout ---------- */
  const hojeISO = (somaDias = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + somaDias);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const formatarData = (iso) => {
    const [a, m, d] = iso.split("-").map(Number);
    const dt = new Date(a, m - 1, d);
    return dt.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const mascaraTelefone = (v) => {
    const n = v.replace(/\D/g, "").slice(0, 11);
    if (n.length <= 2) return n.length ? `(${n}` : "";
    if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
    return `(${n.slice(0, 2)}) ${n.slice(2, n.length - 4)}-${n.slice(-4)}`;
  };

  function abrirCheckout() {
    if (!carrinho.length) return;
    fecharGaveta("gavetaCarrinho", true);
    $("#sobreposicao").hidden = true;
    const cli = armazem.ler(CHAVES.cliente, {});
    const total = totalCarrinho();
    const minData = hojeISO(CONFIG.antecedenciaDias);
    const bolo = temBolo(carrinho);

    abrirModal(`
      <form id="formCheckout" novalidate>
        <div class="modal__cabeca"><div><h2 id="modalTitulo">Finalizar pedido</h2><p>Preencha seus dados — o pedido será enviado para o nosso WhatsApp.</p></div></div>
        <div class="modal__corpo">
          <div class="resumo-checkout">
            <ul>${carrinho.map((l) => `<li><span>${l.qtd}× ${esc(l.nome)}</span><span>${brl(l.precoUnit * l.qtd)}</span></li>`).join("")}</ul>
            <div class="total-linha"><span>Total estimado</span><strong>${brl(total)}</strong></div>
          </div>

          <div class="campo"><label for="ckNome">Seu nome *</label><input id="ckNome" name="nome" autocomplete="name" required value="${esc(cli.nome || "")}" autofocus /><small class="erro-msg" hidden></small></div>
          <div class="campo"><label for="ckTel">WhatsApp *</label><input id="ckTel" name="telefone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="(81) 99999-9999" required value="${esc(cli.telefone || "")}" /><small class="erro-msg" hidden></small></div>

          <fieldset><legend>Como prefere receber?</legend>
            <div class="segmento">
              <label><input type="radio" name="recebimento" value="Retirada" ${cli.recebimento !== "Entrega" ? "checked" : ""} /><span>Retirar no local<small>Rio Doce, Olinda</small></span></label>
              <label><input type="radio" name="recebimento" value="Entrega" ${cli.recebimento === "Entrega" ? "checked" : ""} /><span>Entrega<small>Taxa a combinar</small></span></label>
            </div>
          </fieldset>
          <div class="campo" id="campoEndereco" ${cli.recebimento === "Entrega" ? "" : "hidden"}><label for="ckEnd">Endereço de entrega *</label><input id="ckEnd" name="endereco" autocomplete="street-address" placeholder="Rua, número, bairro e ponto de referência" value="${esc(cli.endereco || "")}" /><small class="erro-msg" hidden></small></div>

          <div class="campos-2">
            <div class="campo"><label for="ckData">Data *</label><input id="ckData" name="data" type="date" min="${minData}" required /><small>Pedidos com no mínimo ${CONFIG.antecedenciaDias} dias de antecedência.</small><small class="erro-msg" hidden></small></div>
            <div class="campo"><label for="ckHora">Horário *</label><input id="ckHora" name="hora" type="time" min="08:00" max="21:00" required /><small class="erro-msg" hidden></small></div>
          </div>

          <fieldset><legend>Forma de pagamento</legend>
            <div class="segmento">
              <label><input type="radio" name="pagamento" value="Pix" checked /><span>Pix<small>No ato da encomenda</small></span></label>
              <label><input type="radio" name="pagamento" value="Cartão" /><span>Cartão<small>Com acréscimo no total</small></span></label>
            </div>
          </fieldset>
          ${bolo ? `<p class="nota">${ICONE_INFO}<span>Seu pedido tem bolo: os itens com bolo têm <strong>50% de entrada</strong> e o restante é pago antes da entrega. Para reservar a data: <strong>${brl(valorReserva(carrinho))}</strong>.</span></p>` : ""}

          <div class="campo"><label for="ckObs">Observações</label><textarea id="ckObs" name="obs" maxlength="500" placeholder="Ex.: nome do aniversariante, cores da festa, alergias…"></textarea></div>
        </div>
        <div class="modal__rodape">
          <div class="modal__total"><span>Total estimado</span><strong>${brl(total)}</strong></div>
          <button class="btn btn--whats" type="submit">${ICONE_WHATS} Enviar pelo WhatsApp</button>
        </div>
      </form>`);

    const form = $("#formCheckout");
    const tel = $("#ckTel", form);
    tel.addEventListener("input", () => { tel.value = mascaraTelefone(tel.value); });
    form.addEventListener("change", (e) => {
      if (e.target.name === "recebimento") $("#campoEndereco", form).hidden = e.target.value !== "Entrega";
    });
    form.addEventListener("submit", (e) => { e.preventDefault(); enviarPedido(form); });
  }

  function validarCheckout(form) {
    const dados = Object.fromEntries(new FormData(form));
    Object.keys(dados).forEach((k) => (dados[k] = String(dados[k]).trim()));
    const erros = {};
    if (dados.nome.length < 2) erros.nome = "Informe seu nome.";
    if (dados.telefone.replace(/\D/g, "").length < 10) erros.telefone = "Informe um WhatsApp com DDD.";
    if (dados.recebimento === "Entrega" && dados.endereco.length < 6) erros.endereco = "Informe o endereço completo.";
    if (!dados.data) erros.data = "Escolha a data.";
    else if (dados.data < hojeISO(CONFIG.antecedenciaDias)) erros.data = `Para datas com menos de ${CONFIG.antecedenciaDias} dias, fale com a gente no WhatsApp.`;
    if (!dados.hora) erros.hora = "Escolha o horário.";

    $$(".campo", form).forEach((c) => {
      const inp = $("input, textarea", c);
      const msg = $(".erro-msg", c);
      if (!inp || !msg) return;
      const erro = erros[inp.name];
      inp.classList.toggle("invalido", !!erro);
      inp.setAttribute("aria-invalid", erro ? "true" : "false");
      msg.textContent = erro || "";
      msg.hidden = !erro;
    });
    const primeiro = Object.keys(erros)[0];
    if (primeiro) { $(`[name="${primeiro}"]`, form).focus(); return null; }
    return dados;
  }

  function gerarNumeroPedido() {
    const d = new Date();
    return `OD${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  function montarMensagem(p) {
    const linhas = [];
    linhas.push(`*Novo pedido - ${CONFIG.nome}*`);
    linhas.push(`Pedido: *${p.numero}*`);
    linhas.push("");
    linhas.push("*Itens*");
    p.itens.forEach((l) => {
      const un = ITENS[l.itemId]?.tipo === "unidade" ? " un." : "x";
      linhas.push(`- ${l.qtd}${un} ${l.nome} — ${brl(l.precoUnit * l.qtd)}`);
      l.detalhes.forEach((d) => linhas.push(`   ${d}`));
    });
    linhas.push("");
    linhas.push(`*Total estimado:* ${brl(p.total)}`);
    if (p.temBolo) linhas.push(`Sinal para reserva: ${brl(p.reserva)} (50% dos itens com bolo)`);
    linhas.push("");
    linhas.push(`*Cliente:* ${p.cliente.nome}`);
    linhas.push(`*WhatsApp:* ${p.cliente.telefone}`);
    linhas.push(`*Recebimento:* ${p.cliente.recebimento}${p.cliente.recebimento === "Entrega" ? ` — ${p.cliente.endereco}` : ""}`);
    linhas.push(`*Data:* ${formatarData(p.data)} às ${p.hora}`);
    linhas.push(`*Pagamento:* ${p.pagamento}`);
    if (p.obs) linhas.push(`*Observações:* ${p.obs}`);
    linhas.push("");
    linhas.push("Pedido feito pelo site. Aguardo a confirmação!");
    return linhas.join("\n");
  }

  function abrirWhats(texto) {
    const url = whatsUrl(texto);
    const janela = window.open(url, "_blank");
    if (janela) janela.opener = null;
    else window.location.href = url;
  }

  function enviarPedido(form) {
    const dados = validarCheckout(form);
    if (!dados) return;
    armazem.gravar(CHAVES.cliente, { nome: dados.nome, telefone: dados.telefone, recebimento: dados.recebimento, endereco: dados.endereco || "" });

    const pedido = {
      numero: gerarNumeroPedido(),
      criadoEm: new Date().toISOString(),
      itens: carrinho.map((l) => ({ ...l })),
      total: totalCarrinho(),
      temBolo: temBolo(carrinho),
      reserva: valorReserva(carrinho),
      cliente: { nome: dados.nome, telefone: dados.telefone, recebimento: dados.recebimento, endereco: dados.endereco || "" },
      data: dados.data,
      hora: dados.hora,
      pagamento: dados.pagamento,
      obs: dados.obs,
    };
    pedido.mensagem = montarMensagem(pedido);
    pedidos.unshift(pedido);
    pedidos = pedidos.slice(0, 30);
    armazem.gravar(CHAVES.pedidos, pedidos);

    abrirWhats(pedido.mensagem);
    carrinho = [];
    salvarCarrinho();
    mostrarConfirmacao(pedido);
  }

  function blocoPix(pedido) {
    const valor = pedido.temBolo ? `Sinal para reservar: <strong>${brl(pedido.reserva ?? pedido.total / 2)}</strong>` : `Valor: <strong>${brl(pedido.total)}</strong>`;
    return `<div class="pix-box">
      <h3>Pagamento via Pix</h3>
      <div class="pix-box__chave"><code>${esc(CONFIG.pix.chave)}</code><button class="btn btn--pequeno btn--suave" type="button" data-copiar-pix>Copiar</button></div>
      <p>${esc(CONFIG.pix.nome)} · ${esc(CONFIG.pix.banco)}</p>
      <p>${valor} — envie o comprovante no WhatsApp para garantir a reserva da data. O valor final é confirmado pela nossa equipe.</p>
    </div>`;
  }

  function mostrarConfirmacao(pedido) {
    abrirModal(`
      <div class="confirmacao">
        <div class="confirmacao__icone"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <span class="confirmacao__num">Pedido ${esc(pedido.numero)}</span>
        <h2 id="modalTitulo">Pedido pronto, ${esc(pedido.cliente.nome.split(" ")[0])}!</h2>
        <p>Abrimos o WhatsApp com o seu pedido. É só <strong>tocar em enviar</strong> na conversa. Vamos confirmar a disponibilidade da data e os detalhes por lá.</p>
        ${pedido.pagamento === "Pix" ? blocoPix(pedido) : `<p class="nota">${ICONE_INFO}<span>Pagamento no cartão tem acréscimo no valor total — combinaremos o valor pelo WhatsApp.</span></p>`}
        <div class="confirmacao__acoes">
          <button class="btn btn--whats" type="button" data-reenviar="${esc(pedido.numero)}">${ICONE_WHATS} O WhatsApp não abriu? Toque aqui</button>
          <button class="btn btn--suave" type="button" data-fechar>Voltar ao site</button>
        </div>
      </div>`);
  }

  /* ---------- Meus pedidos ---------- */
  function renderPedidos() {
    const corpo = $("#pedidosCorpo");
    if (!pedidos.length) {
      corpo.innerHTML = `<div class="vazio">${ILUS.sacola()}<p><strong>Nenhum pedido ainda.</strong></p><p>Seus pedidos feitos neste aparelho aparecem aqui.</p></div>`;
      return;
    }
    corpo.innerHTML = pedidos.map((p) => `
      <article class="pedido-hist">
        <div class="pedido-hist__topo"><strong>${esc(p.numero)}</strong><span class="pedido-hist__status">Enviado</span></div>
        <p class="pedido-hist__meta">Para ${esc(formatarData(p.data))} às ${esc(p.hora)} · ${esc(p.cliente.recebimento)}</p>
        <ul>${p.itens.map((l) => `<li>${l.qtd}× ${esc(l.nome)}</li>`).join("")}</ul>
        <p class="pedido-hist__meta"><strong>${brl(p.total)}</strong> · ${esc(p.pagamento)}</p>
        <div class="pedido-hist__acoes">
          <button class="btn btn--pequeno btn--whats" type="button" data-reenviar="${esc(p.numero)}">Reenviar</button>
          <button class="btn btn--pequeno btn--suave" type="button" data-repetir="${esc(p.numero)}">Pedir novamente</button>
        </div>
      </article>`).join("") + `<p class="dica" style="text-align:center">Histórico salvo apenas neste navegador.</p>`;
  }

  function repetirPedido(numero) {
    const p = pedidos.find((x) => x.numero === numero);
    if (!p) return;
    p.itens.forEach((l) => {
      const item = ITENS[l.itemId];
      if (!item) return;
      const existente = carrinho.find((c) => c.chave === l.chave);
      const precoAtual = precoItem(item, l.selecao);
      if (existente) existente.qtd += l.qtd;
      else carrinho.push({ ...l, precoUnit: precoAtual, nome: nomeLinha(item), detalhes: detalhesSelecao(item, l.selecao) });
    });
    salvarCarrinho();
    abrirGaveta("gavetaCarrinho");
    toast("Itens adicionados ao carrinho");
  }

  /* ---------- Galeria e informações ---------- */
  function renderGaleria() {
    $("#galeriaGrade").innerHTML = GALERIA.map((g, i) =>
      `<button class="galeria__item" type="button" data-foto="${i}" aria-label="Ampliar: ${esc(g.alt)}"><img src="${g.src}" alt="${esc(g.alt)}" loading="lazy" /></button>`
    ).join("");
    $("#linkInstagram").href = `https://instagram.com/${CONFIG.instagram}`;
  }
  function preencherInfo() {
    $("#infoEndereco").textContent = `${CONFIG.endereco} · CEP ${CONFIG.cep}`;
    $("#infoMapa").href = CONFIG.mapsUrl;
    $("#infoPixChave").textContent = CONFIG.pix.chave;
    $("#infoPixNome").textContent = CONFIG.pix.nome;
    $("#infoPixBanco").textContent = CONFIG.pix.banco;
    $("#infoWhats").href = whatsUrl("Olá! Vim pelo site da Odara e gostaria de tirar uma dúvida.");
    $("#infoWhatsTxt").textContent = CONFIG.whatsappExibicao;
    $("#ano").textContent = new Date().getFullYear();
  }

  /* ---------- Toast e cópia ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("visivel");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("visivel"), 2200);
  }
  async function copiarPix() {
    try {
      await navigator.clipboard.writeText(CONFIG.pix.chave);
      toast("Chave Pix copiada!");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = CONFIG.pix.chave;
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); toast("Chave Pix copiada!"); } catch { toast(CONFIG.pix.chave); }
      ta.remove();
    }
  }

  /* ---------- Eventos ---------- */
  function irParaCardapio(catId) {
    if (catId) renderCategoria(catId);
    $("#cardapio").scrollIntoView({ behavior: "smooth" });
  }

  document.addEventListener("click", (e) => {
    const t = e.target;
    const el = (sel) => t.closest(sel);

    if (el(".aba")) { renderCategoria(el(".aba").dataset.cat); return; }

    const delta = el("[data-delta]");
    if (delta) {
      const st = delta.closest("[data-stepper]");
      const ref = st.dataset.stepper;
      const input = $("input", st);
      const itemId = ref.startsWith("linha:") ? carrinho[+ref.slice(6)].itemId : ref.replace(/^modal:/, "");
      const item = ITENS[itemId];
      const { min, passo } = limitesQtd(item);
      const atual = ajustarQtd(item, input.value);
      const novo = +delta.dataset.delta > 0 ? atual + passo : atual - passo;
      if (ref.startsWith("linha:") && novo < min) { toast(`Mínimo de ${min} ${item.tipo === "unidade" ? "unidades" : ""}`.trim()); return; }
      input.value = ajustarQtd(item, novo);
      if (ref.startsWith("linha:")) { carrinho[+ref.slice(6)].qtd = +input.value; salvarCarrinho(); }
      return;
    }

    const add = el("[data-adicionar]");
    if (add) {
      const item = ITENS[add.dataset.adicionar];
      const qtd = ajustarQtd(item, $(`[data-stepper="${item.id}"] input`).value);
      adicionarAoCarrinho(item, qtd);
      add.classList.add("ok"); add.textContent = "Adicionado ✓";
      setTimeout(() => { add.classList.remove("ok"); add.textContent = "Adicionar"; }, 1400);
      return;
    }

    const cfg = el("[data-configurar]");
    if (cfg) {
      const id = cfg.dataset.configurar;
      const inp = $(`[data-stepper="${id}"] input`);
      abrirConfigurador(id, inp ? inp.value : undefined);
      return;
    }

    if (el("[data-remover]")) {
      const idx = +el("[data-remover]").dataset.remover;
      const nome = carrinho[idx].nome;
      carrinho.splice(idx, 1);
      salvarCarrinho();
      toast(`${nome} removido`);
      return;
    }

    if (el("#btnCarrinho") || el("#carrinhoFlutuante")) { abrirGaveta("gavetaCarrinho"); return; }
    if (el("#btnPedidos")) { renderPedidos(); abrirGaveta("gavetaPedidos"); return; }
    if (el("[data-finalizar]")) { abrirCheckout(); return; }
    if (el("[data-ir-cardapio]")) { fecharGaveta("gavetaCarrinho"); irParaCardapio(); return; }
    if (el("[data-ir-categoria]")) { e.preventDefault(); irParaCardapio(el("[data-ir-categoria]").dataset.irCategoria); return; }
    if (el("[data-copiar-pix]")) { copiarPix(); return; }

    const reenviar = el("[data-reenviar]");
    if (reenviar) { const p = pedidos.find((x) => x.numero === reenviar.dataset.reenviar); if (p) abrirWhats(p.mensagem); return; }
    if (el("[data-repetir]")) { repetirPedido(el("[data-repetir]").dataset.repetir); return; }

    const foto = el("[data-foto]");
    if (foto) {
      const g = GALERIA[+foto.dataset.foto];
      $("#lightboxImg").src = g.src; $("#lightboxImg").alt = g.alt;
      $("#lightbox").hidden = false; document.body.classList.add("travado");
      $("#lightbox .btn-fechar").focus();
      return;
    }

    if (el("[data-fechar]") || t === $("#sobreposicao") || t === $("#modal") || t === $("#lightbox")) {
      if (!$("#lightbox").hidden) { $("#lightbox").hidden = true; document.body.classList.remove("travado"); return; }
      if (!$("#modal").hidden) { fecharModal(); return; }
      $$(".gaveta.aberta").forEach((g) => fecharGaveta(g.id));
    }
  });

  // Edição manual de quantidade
  document.addEventListener("change", (e) => {
    const st = e.target.closest("[data-stepper]");
    if (!st || e.target.tagName !== "INPUT") return;
    const ref = st.dataset.stepper;
    const itemId = ref.startsWith("linha:") ? carrinho[+ref.slice(6)].itemId : ref.replace(/^modal:/, "");
    const item = ITENS[itemId];
    e.target.value = ajustarQtd(item, e.target.value);
    if (ref.startsWith("linha:")) { carrinho[+ref.slice(6)].qtd = +e.target.value; salvarCarrinho(); }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!$("#lightbox").hidden) { $("#lightbox").hidden = true; document.body.classList.remove("travado"); }
    else if (!$("#modal").hidden) fecharModal();
    else $$(".gaveta.aberta").forEach((g) => fecharGaveta(g.id));
  });

  // Navegação por teclado nas abas
  $("#abas").addEventListener("keydown", (e) => {
    if (!["ArrowRight", "ArrowLeft"].includes(e.key)) return;
    const idx = CATEGORIAS.findIndex((c) => c.id === categoriaAtual);
    const novo = CATEGORIAS[(idx + (e.key === "ArrowRight" ? 1 : -1) + CATEGORIAS.length) % CATEGORIAS.length];
    renderCategoria(novo.id);
    $(`#aba-${novo.id}`).focus();
  });

  /* ---------- Início ---------- */
  renderAbas();
  renderCategoria(categoriaAtual);
  renderGaleria();
  preencherInfo();
  atualizarResumoCarrinho();
})();
