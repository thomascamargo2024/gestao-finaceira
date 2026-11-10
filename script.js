
// ======================================
// 1. ELEMENTOS
// ======================================

const nomeTransacao = document.querySelector('#input-nome')
const valorInput = document.querySelector('#valor-transacao')
const tipoInput = document.querySelector('#caixa-select')
const categoriaInput = document.querySelector('#categoria')
const dataInput = document.querySelector('#data-transacao')
const botao = document.querySelector('#botao-adicionar')

const mesReferencia = document.querySelector('#mes-referencia')
const filtroMes = document.querySelector('#filtro-mes')
const filtroTipo = document.querySelector('#filtro-tipo')
const filtroBusca = document.querySelector('#filtro-busca')

const saldoMensal = document.querySelector('#saldo-mensal')
const entradaMensal = document.querySelector('#entrada-mensal')
const saidaMensal = document.querySelector('#saida-mensal')

const listaRecentes = document.querySelector('#transacoes-recentes')
const listaHistorico = document.querySelector('#lista-historico')

const graficoComparacao = document.querySelector('#grafico-comparacao')
const graficoEvolucao = document.querySelector('#grafico-evolucao')
const graficoCategorias = document.querySelector('#grafico-categorias')
const legendaCategorias = document.querySelector('#legenda-categorias')


// ======================================
// 2. CONFIGURAÇÕES INICIAIS
// ======================================

function dataHoje() {
    const data = new Date()

    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')

    return `${ano}-${mes}-${dia}`
}

const mesAtual = dataHoje().slice(0, 7)

mesReferencia.value = mesAtual
filtroMes.value = mesAtual
dataInput.value = dataHoje()

// Recupera os dados antigos
let transacoes = JSON.parse(
    localStorage.getItem('transacoes')
) || []

// Migração dos registros antigos
// Registros sem data recebem a data de hoje.

transacoes = transacoes.map(t => ({
    ...t,
    id: t.id || (
        Date.now().toString() +
        Math.random().toString(36).slice(2)
    ),
    data: t.data || dataHoje(),
    categoria: t.categoria || 'Outros',
    valor: Number(t.valor)
}))

salvar()


// ======================================
// 3. FUNÇÕES AUXILIARES
// ======================================

function formatar(valor) {
    return Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })
}

function formatarData(data) {
    if (!data) return ''

    const [ano, mes, dia] = data.split('-')

    return `${dia}/${mes}/${ano}`
}

function salvar() {
    localStorage.setItem(
        'transacoes',
        JSON.stringify(transacoes)
    )
}

function obterTransacoesDoMes(mes) {
    return transacoes.filter(t => t.data.startsWith(mes))
}

function somar(lista, tipo) {
    return lista
        .filter(t => t.tipo === tipo)
        .reduce((total, t) => total + t.valor, 0)
}


// ======================================
// 4. ADICIONAR TRANSAÇÃO
// ======================================

function adicionar() {

    const nome = nomeTransacao.value.trim()

    // Aceita valores como 150,50 ou 1.500,50
    const valor = Number(
        valorInput.value
            .replace(/\./g, '')
            .replace(',', '.')
    )

    const tipo = tipoInput.value
    const categoria = categoriaInput.value
    const data = dataInput.value

    if (!nome || !Number.isFinite(valor) || valor <= 0 || !data) {
        alert('Preencha todos os campos corretamente!')
        return
    }

    const novaTransacao = {
        id: Date.now().toString() +
            Math.random().toString(36).slice(2),
        nome,
        valor,
        tipo,
        categoria,
        data
    }

    transacoes.push(novaTransacao)

    salvar()
    atualizarAplicacao()

    nomeTransacao.value = ''
    valorInput.value = ''

    dataInput.value = dataHoje()

    nomeTransacao.focus()
}


// ======================================
// 5. EXCLUIR TRANSAÇÃO
// ======================================

function excluirTransacao(id) {

    const confirmar = confirm(
        'Deseja realmente excluir esta movimentação?'
    )

    if (!confirmar) return

    transacoes = transacoes.filter(t => t.id !== id)

    salvar()
    atualizarAplicacao()
}


// ======================================
// 6. CRIAR ITEM DE TRANSAÇÃO
// ======================================

function criarItem(t) {

    const item = document.createElement('div')
    item.classList.add('transacao-item')

    const informacoes = document.createElement('div')
    informacoes.classList.add('transacao-info')

    const nome = document.createElement('strong')
    nome.textContent = t.nome

    const detalhes = document.createElement('small')
    detalhes.textContent =
        `${t.categoria} • ${formatarData(t.data)}`

    const valor = document.createElement('span')
    valor.classList.add('transacao-valor')
    valor.classList.add(t.tipo)

    valor.textContent =
        `${t.tipo === 'entrada' ? '+' : '-'} ${formatar(t.valor)}`

    const excluir = document.createElement('button')
    excluir.classList.add('excluir')
    excluir.textContent = '×'
    excluir.title = 'Excluir movimentação'

    excluir.addEventListener('click', () => {
        excluirTransacao(t.id)
    })

    informacoes.append(nome, detalhes)
    item.append(informacoes, valor, excluir)

    return item
}


// ======================================
// 7. RESUMO MENSAL
// ======================================

function renderizarResumo() {

    const mes = mesReferencia.value

    const movimentacoes = obterTransacoesDoMes(mes)

    const entradas = somar(movimentacoes, 'entrada')
    const saidas = somar(movimentacoes, 'saida')
    const saldo = entradas - saidas

    saldoMensal.textContent = formatar(saldo)
    entradaMensal.textContent = formatar(entradas)
    saidaMensal.textContent = formatar(saidas)

    saldoMensal.classList.toggle('positivo', saldo >= 0)
    saldoMensal.classList.toggle('negativo', saldo < 0)

    // Últimas cinco movimentações
    listaRecentes.innerHTML = ''

    const recentes = [...movimentacoes]
        .sort((a, b) => b.data.localeCompare(a.data))
        .slice(0, 5)

    if (recentes.length === 0) {
        listaRecentes.innerHTML =
            '<p class="vazio">Nenhuma movimentação neste mês.</p>'
        return
    }

    recentes.forEach(t => {
        listaRecentes.appendChild(criarItem(t))
    })
}


// ======================================
// 8. HISTÓRICO
// ======================================

function renderizarHistorico() {

    const mes = filtroMes.value
    const tipo = filtroTipo.value

    const busca = filtroBusca.value.toLowerCase().trim()

    let filtradas = [...transacoes]

    if (mes) {
        filtradas = filtradas.filter(
            t => t.data.startsWith(mes)
        )
    }

    if (tipo !== 'todos') {
        filtradas = filtradas.filter(
            t => t.tipo === tipo
        )
    }

    if (busca) {
        filtradas = filtradas.filter(t =>
            t.nome.toLowerCase().includes(busca) ||
            t.categoria.toLowerCase().includes(busca)
        )
    }

    filtradas.sort((a, b) => b.data.localeCompare(a.data))

    listaHistorico.innerHTML = ''

    if (filtradas.length === 0) {
        listaHistorico.innerHTML =
            '<p class="vazio">Nenhuma movimentação encontrada.</p>'
        return
    }

    filtradas.forEach(t => {
        listaHistorico.appendChild(criarItem(t))
    })
}


// ======================================
// 9. GRÁFICO DE ENTRADAS X SAÍDAS
// ======================================

function renderizarComparacao() {

    const mes = mesReferencia.value

    const movimentacoes = obterTransacoesDoMes(mes)

    const entradas = somar(movimentacoes, 'entrada')
    const saidas = somar(movimentacoes, 'saida')

    const maior = Math.max(entradas, saidas, 1)

    const dados = [
        {
            nome: 'Entradas',
            valor: entradas,
            tipo: 'entrada'
        },
        {
            nome: 'Saídas',
            valor: saidas,
            tipo: 'saida'
        }
    ]

    graficoComparacao.innerHTML = ''

    dados.forEach(d => {

        const porcentagem = (d.valor / maior) * 100

        const item = document.createElement('div')
        item.classList.add('barra-item')

        item.innerHTML = `
            <div class="barra-cabecalho">
                <span>${d.nome}</span>
                <strong>${formatar(d.valor)}</strong>
            </div>

            <div class="barra-fundo">
                <div class="barra-preenchimento ${d.tipo}"
                     style="width: ${porcentagem}%">
                </div>
            </div>
        `

        graficoComparacao.appendChild(item)
    })
}


// ======================================
// 10. GRÁFICO DE EVOLUÇÃO MENSAL
// ======================================

function renderizarEvolucao() {

    graficoEvolucao.innerHTML = ''

    const referencia = mesReferencia.value

    if (!referencia) return

    const [ano, mes] = referencia.split('-').map(Number)

    const meses = []

    for (let i = 5; i >= 0; i--) {

        const data = new Date(ano, mes - 1 - i, 1)

        const anoAtual = data.getFullYear()
        const mesAtual = String(
            data.getMonth() + 1
        ).padStart(2, '0')

        const chave = `${anoAtual}-${mesAtual}`

        const movimentacoes = obterTransacoesDoMes(chave)

        meses.push({
            nome: data.toLocaleDateString('pt-BR', {
                month: 'short'
            }),
            entrada: somar(movimentacoes, 'entrada'),
            saida: somar(movimentacoes, 'saida')
        })
    }

    const maior = Math.max(
        ...meses.map(m => Math.max(m.entrada, m.saida)),
        1
    )

    meses.forEach(m => {

        const coluna = document.createElement('div')
        coluna.classList.add('mes-coluna')

        const alturaEntrada = (m.entrada / maior) * 100
        const alturaSaida = (m.saida / maior) * 100

        coluna.innerHTML = `
            <div class="mes-barras">

                <div class="mes-barra entrada"
                     style="height: ${alturaEntrada}%"
                     title="Entradas: ${formatar(m.entrada)}">
                </div>

                <div class="mes-barra saida"
                     style="height: ${alturaSaida}%"
                     title="Saídas: ${formatar(m.saida)}">
                </div>

            </div>

            <small>${m.nome}</small>
        `

        graficoEvolucao.appendChild(coluna)
    })
}


// ======================================
// 11. GRÁFICO DE CATEGORIAS
// ======================================

function renderizarCategorias() {

    const mes = mesReferencia.value

    const movimentacoes = obterTransacoesDoMes(mes)
        .filter(t => t.tipo === 'saida')

    const totais = {}

    movimentacoes.forEach(t => {

        const categoria = t.categoria || 'Outros'

        totais[categoria] =
            (totais[categoria] || 0) + t.valor
    })

    const dados = Object.entries(totais)
        .sort((a, b) => b[1] - a[1])

    const cores = [
        '#3b82f6',
        '#22c55e',
        '#ef4444',
        '#eab308',
        '#a855f7',
        '#ec4899',
        '#14b8a6',
        '#f97316',
        '#8b5cf6',
        '#64748b'
    ]

    graficoCategorias.style.background = 'rgb(16, 16, 56)'
    legendaCategorias.innerHTML = ''

    if (dados.length === 0) {
        legendaCategorias.innerHTML =
            '<p class="vazio">Nenhuma despesa neste mês.</p>'
        return
    }

    const total = dados.reduce(
        (soma, item) => soma + item[1], 0
    )

    let inicio = 0

    const fatias = dados.map((item, index) => {

        const porcentagem = (item[1] / total) * 100

        const fim = inicio + porcentagem

        const fatia = `${cores[index % cores.length]} ${inicio}% ${fim}%`

        inicio = fim

        return fatia
    })

    graficoCategorias.style.background =
        `conic-gradient(${fatias.join(', ')})`

    dados.forEach((item, index) => {

        const porcentagem = (item[1] / total) * 100

        const legenda = document.createElement('div')
        legenda.classList.add('legenda-item')

        legenda.innerHTML = `
            <span class="legenda-cor"
                  style="background: ${cores[index % cores.length]}">
            </span>

            <span>
                ${item[0]} — ${porcentagem.toFixed(1)}%
                <br>
                <strong>${formatar(item[1])}</strong>
            </span>
        `

        legendaCategorias.appendChild(legenda)
    })
}


// ======================================
// 12. ATUALIZAR A APLICAÇÃO
// ======================================

function renderizarGraficos() {

    renderizarComparacao()
    renderizarEvolucao()
    renderizarCategorias()
}

function atualizarAplicacao() {

    renderizarResumo()
    renderizarHistorico()
    renderizarGraficos()
}


// ======================================
// 13. SISTEMA DE ABAS
// ======================================

const abas = document.querySelectorAll('.aba')
const conteudos = document.querySelectorAll('.conteudo')

function abrirAba(nome) {

    abas.forEach(aba => {
        aba.classList.toggle(
            'ativa',
            aba.dataset.aba === nome
        )
    })

    conteudos.forEach(conteudo => {
        conteudo.classList.toggle(
            'ativo',
            conteudo.id === nome
        )
    })

    if (nome === 'graficos') {
        renderizarGraficos()
    }
}

abas.forEach(aba => {

    aba.addEventListener('click', () => {
        abrirAba(aba.dataset.aba)
    })
})

document.querySelectorAll('[data-ir]').forEach(botao => {

    botao.addEventListener('click', () => {
        abrirAba(botao.dataset.ir)
    })
})


// ======================================
// 14. EVENTOS
// ======================================

botao.addEventListener('click', adicionar)

mesReferencia.addEventListener('change', atualizarAplicacao)

filtroMes.addEventListener('change', renderizarHistorico)

filtroTipo.addEventListener('change', renderizarHistorico)

filtroBusca.addEventListener('input', renderizarHistorico)


// ======================================
// 15. INICIAR
// ======================================

atualizarAplicacao()
