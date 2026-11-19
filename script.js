/* Massa de Teste: gerador e validador de CPF, CNPJ e EAN-13 para testes de software.
   JavaScript puro, sem bibliotecas e sem back-end.
   O código está dividido pelos incrementos do projeto. */

"use strict";

/* =====================================================================
   Incremento 1: JS básico
   Variáveis, tipos, operadores, condicionais, laços, funções, arrays e objetos.
   ===================================================================== */

// Região fiscal do CPF: o nono dígito indica onde ele foi emitido.
const REGIOES_CPF = [
    { digito: 0, ufs: "RS" },
    { digito: 1, ufs: "DF, GO, MS, MT e TO" },
    { digito: 2, ufs: "AC, AM, AP, PA, RO e RR" },
    { digito: 3, ufs: "CE, MA e PI" },
    { digito: 4, ufs: "AL, PB, PE e RN" },
    { digito: 5, ufs: "BA e SE" },
    { digito: 6, ufs: "MG" },
    { digito: 7, ufs: "ES e RJ" },
    { digito: 8, ufs: "SP" },
    { digito: 9, ufs: "PR e SC" }
];

const NOMES_TIPO = {
    cpf: "CPF",
    cnpj: "CNPJ",
    "cnpj-alfa": "CNPJ alfanumérico",
    ean13: "EAN-13"
};

const ALFANUMERICOS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function numeroAleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function digitosAleatorios(quantidade) {
    const digitos = [];
    for (let i = 0; i < quantidade; i++) {
        digitos.push(numeroAleatorio(0, 9));
    }
    return digitos;
}

// Resto da divisão por 11, regra usada por CPF e CNPJ.
function digitoModulo11(soma) {
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
}

function todosIguais(lista) {
    return lista.every(function (item) {
        return item === lista[0];
    });
}

/* ---------- CPF ---------- */

function calcularDigitosCpf(base) {
    // base: array com 9 números
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += base[i] * (10 - i);
    }
    const d1 = digitoModulo11(soma);

    soma = 0;
    const comD1 = base.concat(d1);
    for (let i = 0; i < 10; i++) {
        soma += comD1[i] * (11 - i);
    }
    const d2 = digitoModulo11(soma);

    return [d1, d2];
}

function gerarCpf(regiao) {
    let base;
    do {
        base = digitosAleatorios(9);
        if (regiao !== "" && regiao !== undefined) {
            base[8] = Number(regiao);
        }
    } while (todosIguais(base));
    return base.concat(calcularDigitosCpf(base)).join("");
}

function validarCpf(valor) {
    const limpo = String(valor).replace(/\D/g, "");
    if (limpo.length !== 11) {
        return { valido: false, motivo: "CPF precisa ter 11 dígitos" };
    }
    const numeros = limpo.split("").map(Number);
    if (todosIguais(numeros)) {
        return { valido: false, motivo: "todos os dígitos são iguais" };
    }
    const esperados = calcularDigitosCpf(numeros.slice(0, 9));
    if (numeros[9] !== esperados[0] || numeros[10] !== esperados[1]) {
        return { valido: false, motivo: "dígitos verificadores deveriam ser " + esperados.join("") };
    }
    const regiao = REGIOES_CPF[numeros[8]];
    return { valido: true, motivo: "emitido em " + regiao.ufs };
}

function formatarCpf(cpf) {
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

/* ---------- CNPJ (numérico e alfanumérico) ---------- */

// No CNPJ alfanumérico cada caractere vale o código ASCII menos 48:
// "0" a "9" continuam valendo 0 a 9, "A" vale 17, "B" vale 18 e assim por diante.
function valorCaractereCnpj(caractere) {
    return caractere.charCodeAt(0) - 48;
}

function calcularDigitosCnpj(base) {
    // base: string com 12 caracteres
    const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let soma = 0;
    for (let i = 0; i < 12; i++) {
        soma += valorCaractereCnpj(base[i]) * pesos1[i];
    }
    const d1 = digitoModulo11(soma);

    soma = 0;
    const comD1 = base + d1;
    for (let i = 0; i < 13; i++) {
        soma += valorCaractereCnpj(comD1[i]) * pesos2[i];
    }
    const d2 = digitoModulo11(soma);

    return "" + d1 + d2;
}

function gerarCnpj(alfanumerico) {
    let raiz = "";
    do {
        raiz = "";
        for (let i = 0; i < 8; i++) {
            if (alfanumerico) {
                raiz += ALFANUMERICOS[numeroAleatorio(0, ALFANUMERICOS.length - 1)];
            } else {
                raiz += numeroAleatorio(0, 9);
            }
        }
        // Garante pelo menos uma letra no alfanumérico, senão ele seria igual a um CNPJ comum
    } while (todosIguais(raiz.split("")) || (alfanumerico && !/[A-Z]/.test(raiz)));

    const base = raiz + "0001"; // 0001 = matriz
    return base + calcularDigitosCnpj(base);
}

function validarCnpj(valor) {
    const limpo = String(valor).toUpperCase().replace(/[^0-9A-Z]/g, "");
    if (limpo.length !== 14) {
        return { valido: false, motivo: "CNPJ precisa ter 14 caracteres" };
    }
    if (!/^[0-9A-Z]{12}\d{2}$/.test(limpo)) {
        return { valido: false, motivo: "os 2 últimos caracteres precisam ser números" };
    }
    if (todosIguais(limpo.split(""))) {
        return { valido: false, motivo: "todos os caracteres são iguais" };
    }
    const esperados = calcularDigitosCnpj(limpo.slice(0, 12));
    if (limpo.slice(12) !== esperados) {
        return { valido: false, motivo: "dígitos verificadores deveriam ser " + esperados };
    }
    const alfa = /[A-Z]/.test(limpo);
    const filial = limpo.slice(8, 12) === "0001" ? "matriz" : "filial " + limpo.slice(8, 12);
    return { valido: true, motivo: (alfa ? "formato alfanumérico, " : "") + filial };
}

function formatarCnpj(cnpj) {
    return cnpj.replace(/^(.{2})(.{3})(.{3})(.{4})(.{2})$/, "$1.$2.$3/$4-$5");
}

/* ---------- EAN-13 ---------- */

function calcularDigitoEan(base) {
    // base: array com 12 números; pesos alternados 1 e 3
    let soma = 0;
    for (let i = 0; i < 12; i++) {
        soma += base[i] * (i % 2 === 0 ? 1 : 3);
    }
    return (10 - (soma % 10)) % 10;
}

function gerarEan13() {
    const base = [7, 8, 9].concat(digitosAleatorios(9)); // 789 = prefixo do Brasil
    return base.join("") + calcularDigitoEan(base);
}

function validarEan13(valor) {
    const limpo = String(valor).replace(/\D/g, "");
    if (limpo.length !== 13) {
        return { valido: false, motivo: "EAN-13 precisa ter 13 dígitos" };
    }
    const numeros = limpo.split("").map(Number);
    const esperado = calcularDigitoEan(numeros.slice(0, 12));
    if (numeros[12] !== esperado) {
        return { valido: false, motivo: "dígito verificador deveria ser " + esperado };
    }
    const pais = limpo.startsWith("789") || limpo.startsWith("790") ? "prefixo do Brasil" : "prefixo " + limpo.slice(0, 3);
    return { valido: true, motivo: pais };
}

/* ---------- Funções gerais ---------- */

function gerar(tipo, opcoes) {
    if (tipo === "cpf") {
        return gerarCpf(opcoes.regiao);
    }
    if (tipo === "cnpj") {
        return gerarCnpj(false);
    }
    if (tipo === "cnpj-alfa") {
        return gerarCnpj(true);
    }
    return gerarEan13();
}

function formatar(tipo, valor, comMascara) {
    if (!comMascara) {
        return valor;
    }
    if (tipo === "cpf") {
        return formatarCpf(valor);
    }
    if (tipo === "cnpj" || tipo === "cnpj-alfa") {
        return formatarCnpj(valor);
    }
    return valor; // EAN-13 não tem pontuação
}

// Descobre o tipo pelo tamanho e valida.
function validarQualquer(valor) {
    const texto = valor.trim();
    const soDigitos = texto.replace(/\D/g, "");
    const alfanumerico = texto.toUpperCase().replace(/[^0-9A-Z]/g, "");

    if (/[A-Za-z]/.test(texto) && alfanumerico.length === 14) {
        return Object.assign({ tipo: "CNPJ" }, validarCnpj(texto));
    }
    if (soDigitos.length === 11) {
        return Object.assign({ tipo: "CPF" }, validarCpf(soDigitos));
    }
    if (soDigitos.length === 14) {
        return Object.assign({ tipo: "CNPJ" }, validarCnpj(soDigitos));
    }
    if (soDigitos.length === 13) {
        return Object.assign({ tipo: "EAN-13" }, validarEan13(soDigitos));
    }
    return { tipo: "?", valido: false, motivo: "tamanho não corresponde a CPF (11), CNPJ (14) ou EAN-13 (13)" };
}

/* =====================================================================
   Incremento 2: DOM e eventos
   Formulários e interação sem recarregar a página.
   ===================================================================== */

const el = {
    formGerar: document.getElementById("form-gerar"),
    quantidade: document.getElementById("quantidade"),
    uf: document.getElementById("uf"),
    opcaoUf: document.getElementById("opcao-uf"),
    mascara: document.getElementById("mascara"),
    resultado: document.getElementById("resultado"),
    acoesResultado: document.getElementById("acoes-resultado"),
    formValidar: document.getElementById("form-validar"),
    entradaValidar: document.getElementById("entrada-validar"),
    arquivoValidar: document.getElementById("arquivo-validar"),
    resultadoValidar: document.getElementById("resultado-validar"),
    formCliente: document.getElementById("form-cliente"),
    cep: document.getElementById("cep"),
    tipoCliente: document.getElementById("tipo-cliente"),
    botaoCliente: document.getElementById("botao-cliente"),
    resultadoCliente: document.getElementById("resultado-cliente"),
    acoesCliente: document.getElementById("acoes-cliente"),
    listaHistorico: document.getElementById("lista-historico"),
    botaoTema: document.getElementById("botao-tema"),
    avisoRapido: document.getElementById("aviso-rapido")
};

let ultimosGerados = []; // { tipo, valor }
let ultimoCliente = null;

function tipoSelecionado() {
    return el.formGerar.querySelector("input[name=tipo]:checked").value;
}

function preencherRegioes() {
    REGIOES_CPF.forEach(function (regiao) {
        const opcao = document.createElement("option");
        opcao.value = regiao.digito;
        opcao.textContent = regiao.ufs;
        el.uf.appendChild(opcao);
    });
}

function atualizarOpcoes() {
    const tipo = tipoSelecionado();
    el.opcaoUf.hidden = tipo !== "cpf";
    el.mascara.disabled = tipo === "ean13";
}

let temporizadorAviso;
function avisar(mensagem) {
    el.avisoRapido.textContent = mensagem;
    el.avisoRapido.classList.add("visivel");
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(function () {
        el.avisoRapido.classList.remove("visivel");
    }, 2200);
}

function criarBotaoCopiar(texto) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "copiar";
    botao.textContent = "Copiar";
    botao.setAttribute("aria-label", "Copiar " + texto);
    botao.addEventListener("click", function () {
        copiarTexto(texto);
    });
    return botao;
}

function mostrarResultados(tipo, valores) {
    el.resultado.innerHTML = "";
    const lista = document.createElement("ul");
    lista.className = "lista-resultados";

    valores.forEach(function (valor) {
        const item = document.createElement("li");
        const codigo = document.createElement("code");
        codigo.textContent = valor;
        item.appendChild(codigo);
        item.appendChild(criarBotaoCopiar(valor));
        if (tipo === "ean13") {
            const quebra = document.createElement("span");
            quebra.className = "quebra";
            item.append(quebra, desenharCodigoBarras(valor));
        }
        lista.appendChild(item);
    });

    el.resultado.appendChild(lista);
    el.acoesResultado.hidden = false;
}

el.formGerar.addEventListener("submit", function (evento) {
    evento.preventDefault(); // não recarrega a página

    const tipo = tipoSelecionado();
    let quantidade = parseInt(el.quantidade.value, 10);
    if (isNaN(quantidade) || quantidade < 1) {
        quantidade = 1;
    } else if (quantidade > 100) {
        quantidade = 100;
    }
    el.quantidade.value = quantidade;

    const valores = [];
    for (let i = 0; i < quantidade; i++) {
        const bruto = gerar(tipo, { regiao: el.uf.value });
        valores.push(formatar(tipo, bruto, el.mascara.checked));
    }

    ultimosGerados = valores.map(function (valor) {
        return { tipo: NOMES_TIPO[tipo], valor: valor };
    });
    mostrarResultados(tipo, valores);
    adicionarAoHistorico(ultimosGerados);
    salvarPreferencias();
});

el.formGerar.addEventListener("change", function () {
    atualizarOpcoes();
    salvarPreferencias();
});

function mostrarValidacao(linhas) {
    el.resultadoValidar.innerHTML = "";
    const valores = linhas
        .map(function (linha) { return linha.trim(); })
        .filter(function (linha) { return linha !== ""; });

    if (valores.length === 0) {
        el.resultadoValidar.innerHTML = '<p class="dica">Digite ao menos um valor.</p>';
        return;
    }

    let validos = 0;
    const tabela = document.createElement("table");
    tabela.className = "tabela-validacao";
    tabela.innerHTML = "<thead><tr><th>Valor</th><th>Tipo</th><th>Resultado</th></tr></thead>";
    const corpo = document.createElement("tbody");

    valores.forEach(function (valor) {
        const r = validarQualquer(valor);
        if (r.valido) {
            validos++;
        }
        const linha = document.createElement("tr");
        linha.className = r.valido ? "valido" : "invalido";

        const celulaValor = document.createElement("td");
        celulaValor.innerHTML = "<code></code>";
        celulaValor.firstChild.textContent = valor;
        const celulaTipo = document.createElement("td");
        celulaTipo.textContent = r.tipo;
        const celulaResultado = document.createElement("td");
        celulaResultado.textContent = (r.valido ? "Válido: " : "Inválido: ") + r.motivo;

        linha.append(celulaValor, celulaTipo, celulaResultado);
        corpo.appendChild(linha);
    });

    tabela.appendChild(corpo);
    const resumo = document.createElement("p");
    resumo.className = "resumo";
    resumo.textContent = validos + " de " + valores.length + (valores.length === 1 ? " valor válido." : " valores válidos.");
    el.resultadoValidar.append(resumo, tabela);
}

el.formValidar.addEventListener("submit", function (evento) {
    evento.preventDefault();
    mostrarValidacao(el.entradaValidar.value.split(/\r?\n/));
});

// Máscara do CEP enquanto digita
el.cep.addEventListener("input", function () {
    const digitos = el.cep.value.replace(/\D/g, "").slice(0, 8);
    el.cep.value = digitos.length > 5 ? digitos.slice(0, 5) + "-" + digitos.slice(5) : digitos;
});

/* =====================================================================
   Incremento 3: Persistência com localStorage
   Preferências (tipo, quantidade, região, máscara, tema) e histórico.
   ===================================================================== */

const CHAVE_PREFERENCIAS = "massaDeTeste.preferencias";
const CHAVE_HISTORICO = "massaDeTeste.historico";
const LIMITE_HISTORICO = 30;

function lerJson(chave, padrao) {
    try {
        const texto = localStorage.getItem(chave);
        return texto ? JSON.parse(texto) : padrao;
    } catch (erro) {
        return padrao; // localStorage bloqueado ou conteúdo corrompido
    }
}

function gravarJson(chave, valor) {
    try {
        localStorage.setItem(chave, JSON.stringify(valor));
    } catch (erro) {
        // Navegação privada pode bloquear; a ferramenta continua funcionando sem salvar.
    }
}

function salvarPreferencias() {
    gravarJson(CHAVE_PREFERENCIAS, {
        tipo: tipoSelecionado(),
        quantidade: el.quantidade.value,
        regiao: el.uf.value,
        mascara: el.mascara.checked,
        tipoCliente: el.tipoCliente.value,
        tema: document.documentElement.dataset.tema || ""
    });
}

function carregarPreferencias() {
    const p = lerJson(CHAVE_PREFERENCIAS, null);
    if (!p) {
        return;
    }
    const radio = el.formGerar.querySelector("input[name=tipo][value='" + p.tipo + "']");
    if (radio) {
        radio.checked = true;
    }
    el.quantidade.value = p.quantidade || 1;
    el.uf.value = p.regiao || "";
    el.mascara.checked = p.mascara !== false;
    el.tipoCliente.value = p.tipoCliente || "pf";
    if (p.tema) {
        aplicarTema(p.tema);
    }
}

function adicionarAoHistorico(itens) {
    const agora = new Date().toISOString();
    const novos = itens.map(function (item) {
        return { tipo: item.tipo, valor: item.valor, data: agora };
    });
    const historico = novos.reverse().concat(lerJson(CHAVE_HISTORICO, []));
    gravarJson(CHAVE_HISTORICO, historico.slice(0, LIMITE_HISTORICO));
    mostrarHistorico();
}

function mostrarHistorico() {
    const historico = lerJson(CHAVE_HISTORICO, []);
    el.listaHistorico.innerHTML = "";

    if (historico.length === 0) {
        const vazio = document.createElement("li");
        vazio.className = "vazio";
        vazio.textContent = "Nada gerado ainda.";
        el.listaHistorico.appendChild(vazio);
        return;
    }

    historico.forEach(function (item) {
        const li = document.createElement("li");
        const tipo = document.createElement("span");
        tipo.className = "tipo";
        tipo.textContent = item.tipo;
        const codigo = document.createElement("code");
        codigo.textContent = item.valor;
        const hora = document.createElement("time");
        hora.dateTime = item.data;
        hora.textContent = new Date(item.data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
        li.append(tipo, codigo, hora, criarBotaoCopiar(item.valor));
        el.listaHistorico.appendChild(li);
    });
}

function apagarJson(chave) {
    try {
        localStorage.removeItem(chave);
    } catch (erro) {
        // Mesmo motivo de gravarJson: sem localStorage, só não há o que apagar.
    }
}

document.getElementById("limpar-historico").addEventListener("click", function () {
    apagarJson(CHAVE_HISTORICO);
    mostrarHistorico();
    avisar("Histórico apagado");
});

// Tema claro/escuro: segue o sistema até o usuário escolher, e a escolha fica salva.
function temaAtual() {
    if (document.documentElement.dataset.tema) {
        return document.documentElement.dataset.tema;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
}

function aplicarTema(tema) {
    document.documentElement.dataset.tema = tema;
    atualizarBotaoTema();
}

function atualizarBotaoTema() {
    const escuro = temaAtual() === "escuro";
    el.botaoTema.textContent = escuro ? "Claro" : "Escuro";
    el.botaoTema.setAttribute("aria-pressed", String(escuro));
    el.botaoTema.title = escuro ? "Mudar para o tema claro" : "Mudar para o tema escuro";
}

el.botaoTema.addEventListener("click", function () {
    aplicarTema(temaAtual() === "escuro" ? "claro" : "escuro");
    salvarPreferencias();
});

/* =====================================================================
   Incremento 4: APIs com fetch, HTTP e JSON
   Random User (pessoa fictícia brasileira) e ViaCEP (endereço real).
   ===================================================================== */

// CEPs reais de pontos conhecidos, usados quando o usuário não informa um.
const CEPS_EXEMPLO = [
    "01001000", // Praça da Sé, São Paulo
    "01310100", // Avenida Paulista, São Paulo
    "20040002", // Centro, Rio de Janeiro
    "70040010", // Brasília
    "80020310", // Centro, Curitiba
    "30130010", // Centro, Belo Horizonte
    "88010400", // Centro, Florianópolis
    "40020000", // Comércio, Salvador
    "85660000"  // Dois Vizinhos, PR
];

const PESSOA_RESERVA = {
    nome: "Maria Teste da Silva",
    email: "maria.teste@exemplo.com",
    telefone: "(46) 99999-0000",
    nascimento: "1995-05-15"
};

async function buscarJson(url) {
    const resposta = await fetch(url);
    if (!resposta.ok) {
        throw new Error("HTTP " + resposta.status);
    }
    return resposta.json();
}

async function buscarPessoa() {
    const dados = await buscarJson("https://randomuser.me/api/?nat=br&inc=name,email,cell,dob&noinfo");
    const p = dados.results[0];
    return {
        nome: p.name.first + " " + p.name.last,
        email: p.email.replace("@example.com", "@exemplo.com"),
        telefone: p.cell,
        nascimento: p.dob.date.slice(0, 10)
    };
}

async function buscarEndereco(cep) {
    const dados = await buscarJson("https://viacep.com.br/ws/" + cep + "/json/");
    if (dados.erro) {
        throw new Error("CEP não encontrado");
    }
    return {
        cep: dados.cep,
        logradouro: dados.logradouro || "Rua de Teste",
        numero: String(numeroAleatorio(1, 2000)),
        bairro: dados.bairro || "Centro",
        cidade: dados.localidade,
        uf: dados.uf
    };
}

/* =====================================================================
   Incremento 5: Assincronismo e concorrência
   async/await e Promise.all: pessoa e endereço são buscados ao mesmo tempo.
   ===================================================================== */

async function gerarCliente(cepInformado, tipoCliente) {
    const cep = cepInformado || CEPS_EXEMPLO[numeroAleatorio(0, CEPS_EXEMPLO.length - 1)];
    const avisos = [];

    // Cada promessa trata o próprio erro, assim uma API fora do ar não derruba a outra.
    const [pessoa, endereco] = await Promise.all([
        buscarPessoa().catch(function () {
            avisos.push("Random User indisponível: usei um nome de reserva.");
            return PESSOA_RESERVA;
        }),
        buscarEndereco(cep).catch(function (erro) {
            avisos.push(cepInformado
                ? "Não encontrei o CEP " + cepInformado + " (" + erro.message + ")."
                : "ViaCEP indisponível: endereço não preenchido.");
            return null;
        })
    ]);

    const cliente = {
        tipo: tipoCliente === "pj" ? "Pessoa jurídica" : "Pessoa física",
        nome: tipoCliente === "pj" ? pessoa.nome.split(" ")[1] + " Comércio de Testes Ltda" : pessoa.nome,
        documento: tipoCliente === "pj" ? formatarCnpj(gerarCnpj(false)) : formatarCpf(gerarCpf("")),
        email: pessoa.email,
        telefone: pessoa.telefone,
        endereco: endereco
    };
    if (tipoCliente === "pj") {
        cliente.responsavel = pessoa.nome;
    } else {
        cliente.nascimento = pessoa.nascimento;
    }
    return { cliente: cliente, avisos: avisos };
}

function linhaDado(rotulo, valor) {
    const dt = document.createElement("dt");
    dt.textContent = rotulo;
    const dd = document.createElement("dd");
    const codigo = document.createElement("code");
    codigo.textContent = valor;
    dd.append(codigo, criarBotaoCopiar(valor));
    return [dt, dd];
}

function mostrarCliente(resultado) {
    const c = resultado.cliente;
    el.resultadoCliente.innerHTML = "";

    const dl = document.createElement("dl");
    dl.className = "dados-cliente";
    const linhas = [
        [c.tipo === "Pessoa jurídica" ? "Razão social" : "Nome", c.nome],
        [c.tipo === "Pessoa jurídica" ? "CNPJ" : "CPF", c.documento],
        ["E-mail", c.email],
        ["Telefone", c.telefone]
    ];
    if (c.nascimento) {
        linhas.push(["Nascimento", c.nascimento.split("-").reverse().join("/")]);
    }
    if (c.responsavel) {
        linhas.push(["Responsável", c.responsavel]);
    }
    if (c.endereco) {
        const e = c.endereco;
        linhas.push(["Endereço", e.logradouro + ", " + e.numero + " - " + e.bairro]);
        linhas.push(["Cidade", e.cidade + " - " + e.uf]);
        linhas.push(["CEP", e.cep]);
    }
    linhas.forEach(function (par) {
        dl.append.apply(dl, linhaDado(par[0], par[1]));
    });

    resultado.avisos.forEach(function (aviso) {
        const p = document.createElement("p");
        p.className = "alerta";
        p.textContent = aviso;
        el.resultadoCliente.appendChild(p);
    });
    el.resultadoCliente.appendChild(dl);
    el.acoesCliente.hidden = false;
}

el.formCliente.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    const cep = el.cep.value.replace(/\D/g, "");
    if (cep !== "" && cep.length !== 8) {
        avisar("O CEP precisa ter 8 dígitos");
        el.cep.focus();
        return;
    }

    el.botaoCliente.disabled = true;
    el.botaoCliente.textContent = "Buscando...";
    el.resultadoCliente.setAttribute("aria-busy", "true");
    try {
        const resultado = await gerarCliente(cep, el.tipoCliente.value);
        ultimoCliente = resultado.cliente;
        mostrarCliente(resultado);
        adicionarAoHistorico([{ tipo: resultado.cliente.tipo === "Pessoa jurídica" ? "CNPJ" : "CPF", valor: resultado.cliente.documento }]);
        salvarPreferencias();
    } finally {
        el.botaoCliente.disabled = false;
        el.botaoCliente.textContent = "Gerar cliente";
        el.resultadoCliente.removeAttribute("aria-busy");
    }
});

/* =====================================================================
   Incremento 6: Web APIs do navegador
   Clipboard (copiar), Blob + download (exportar), File (importar para validar)
   e Web Share (compartilhar o cliente gerado).
   ===================================================================== */

async function copiarTexto(texto) {
    try {
        await navigator.clipboard.writeText(texto);
        avisar("Copiado!");
    } catch (erro) {
        // Reserva para navegadores sem Clipboard API ou página fora de HTTPS
        const area = document.createElement("textarea");
        area.value = texto;
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
        avisar("Copiado!");
    }
}

function baixarArquivo(nome, conteudo, tipoMime) {
    const blob = new Blob([conteudo], { type: tipoMime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nome;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

function nomeArquivo(extensao) {
    const data = new Date().toISOString().slice(0, 10);
    return "massa-de-teste-" + data + "." + extensao;
}

document.getElementById("copiar-todos").addEventListener("click", function () {
    copiarTexto(ultimosGerados.map(function (i) { return i.valor; }).join("\n"));
});

document.getElementById("baixar-txt").addEventListener("click", function () {
    const texto = ultimosGerados.map(function (i) { return i.valor; }).join("\r\n");
    baixarArquivo(nomeArquivo("txt"), texto, "text/plain;charset=utf-8");
});

document.getElementById("baixar-csv").addEventListener("click", function () {
    const linhas = ["tipo;valor"].concat(ultimosGerados.map(function (i) {
        return i.tipo + ";" + i.valor;
    }));
    // BOM no início para o Excel abrir os acentos corretamente
    baixarArquivo(nomeArquivo("csv"), "﻿" + linhas.join("\r\n"), "text/csv;charset=utf-8");
});

document.getElementById("baixar-json").addEventListener("click", function () {
    baixarArquivo(nomeArquivo("json"), JSON.stringify(ultimosGerados, null, 2), "application/json");
});

el.arquivoValidar.addEventListener("change", async function () {
    const arquivo = el.arquivoValidar.files[0];
    if (!arquivo) {
        return;
    }
    if (arquivo.size > 1024 * 1024) {
        avisar("Arquivo maior que 1 MB");
        return;
    }
    const texto = await arquivo.text(); // File API
    // Aceita um valor por linha ou separados por vírgula/ponto e vírgula (CSV).
    // Ignora o cabeçalho e a coluna "tipo" do próprio CSV exportado
    // (CPF, CNPJ, CNPJ alfanumérico, EAN-13), para não virarem linhas inválidas.
    const rotulos = ["tipo", "valor", "ean"].concat(Object.values(NOMES_TIPO)).map(function (r) {
        return r.toLowerCase();
    });
    const linhas = texto.split(/[\r\n;,]+/)
        .map(function (v) { return v.trim(); }) // trim também remove o BOM do Excel
        .filter(function (v) {
            return v !== "" && !rotulos.includes(v.toLowerCase());
        });
    el.entradaValidar.value = linhas.join("\n");
    mostrarValidacao(linhas);
    el.arquivoValidar.value = "";
});

document.getElementById("copiar-cliente").addEventListener("click", function () {
    if (ultimoCliente) {
        copiarTexto(JSON.stringify(ultimoCliente, null, 2));
    }
});

const botaoCompartilhar = document.getElementById("compartilhar-cliente");
if (!navigator.share) {
    botaoCompartilhar.hidden = true; // Web Share não existe em todo navegador de desktop
}
botaoCompartilhar.addEventListener("click", async function () {
    if (!ultimoCliente) {
        return;
    }
    try {
        await navigator.share({
            title: "Cliente fictício para teste",
            text: JSON.stringify(ultimoCliente, null, 2)
        });
    } catch (erro) {
        // Usuário cancelou o compartilhamento; nada a fazer.
    }
});

/* ---------- Desenho do código de barras EAN-13 em SVG ---------- */

const EAN_L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const EAN_G = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
const EAN_R = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"];
const EAN_PARIDADE = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];

function barrasEan13(codigo) {
    const d = codigo.split("").map(Number);
    const paridade = EAN_PARIDADE[d[0]];
    let bits = "101";
    for (let i = 1; i <= 6; i++) {
        bits += paridade[i - 1] === "L" ? EAN_L[d[i]] : EAN_G[d[i]];
    }
    bits += "01010";
    for (let i = 7; i <= 12; i++) {
        bits += EAN_R[d[i]];
    }
    return bits + "101";
}

function desenharCodigoBarras(codigo) {
    const ns = "http://www.w3.org/2000/svg";
    const bits = barrasEan13(codigo);
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 " + (bits.length + 18) + " 64");
    svg.setAttribute("class", "codigo-barras");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Código de barras " + codigo);

    const fundo = document.createElementNS(ns, "rect");
    fundo.setAttribute("width", "100%");
    fundo.setAttribute("height", "100%");
    fundo.setAttribute("fill", "#ffffff");
    svg.appendChild(fundo);

    for (let i = 0; i < bits.length; i++) {
        if (bits[i] === "1") {
            const barra = document.createElementNS(ns, "rect");
            const guarda = i < 3 || (i >= 45 && i < 50) || i >= 92;
            barra.setAttribute("x", 9 + i);
            barra.setAttribute("y", 4);
            barra.setAttribute("width", 1);
            barra.setAttribute("height", guarda ? 50 : 46);
            barra.setAttribute("fill", "#000000");
            svg.appendChild(barra);
        }
    }

    const texto = document.createElementNS(ns, "text");
    texto.setAttribute("x", (bits.length + 18) / 2);
    texto.setAttribute("y", 61);
    texto.setAttribute("text-anchor", "middle");
    texto.setAttribute("font-size", "7");
    texto.setAttribute("font-family", "monospace");
    texto.setAttribute("letter-spacing", "1.5");
    texto.textContent = codigo;
    svg.appendChild(texto);
    return svg;
}

/* =====================================================================
   Inicialização
   ===================================================================== */

preencherRegioes();
carregarPreferencias();
atualizarOpcoes();
atualizarBotaoTema();
mostrarHistorico();
