// elementos
let nomeTransacao = document.querySelector('#input-nome')
let valorInput = document.querySelector('#valor-transacao')
let botao = document.querySelector('.botao')
let historico = document.querySelector('.historico')

let saldoAtualEntrada = document.querySelector('.saldo-atual-entrada')
let saldoAtualAtualizado = document.querySelector('.saldo-atual')
let saldoAtualSaida = document.querySelector('.saldo-atual-saida')

let options = document.querySelector('#caixa-select')

let transacoes = JSON.parse(localStorage.getItem("transacoes")) || []

function formatar(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  })
}

function salvar() {
  localStorage.setItem("transacoes", JSON.stringify(transacoes))
}

function renderizar() {
  historico.innerHTML = ""

  let saldoEntrada = 0
  let saldoSaida = 0
  let saldoAtual = 0

  transacoes.forEach((t, index) => {

    let item = document.createElement('div')
    item.classList.add("item")

    if (t.tipo === "entrada") {
      saldoEntrada += t.valor
      saldoAtual += t.valor

      item.innerHTML = `
        <span class="nome">${t.nome}</span>
        <span class="valor">+ ${formatar(t.valor)}</span>
        <span class="excluir" data-id="${index}">
          <img class="imagem-excluir" src="imagens/icons8-delete-30.png">
        </span>
      `
    } else {
      saldoSaida += t.valor
      saldoAtual -= t.valor

      item.innerHTML = `
        <span class="nome">${t.nome}</span>
        <span class="valor-negativo">- ${formatar(t.valor)}</span>
        <span class="excluir" data-id="${index}">
          <img src="imagens/icons8-delete-30.png">
        </span>
      `
    }

    historico.appendChild(item)
  })

  saldoAtualEntrada.innerHTML = formatar(saldoEntrada)
  saldoAtualSaida.innerHTML = formatar(saldoSaida)
  saldoAtualAtualizado.innerHTML = formatar(saldoAtual)
}

function adicionar() {
  let nome = nomeTransacao.value
  let valor = parseFloat(valorInput.value.replace(",", "."))

  if (!nome || isNaN(valor)) {
    alert("Preencha corretamente!")
    return
  }

  transacoes.push({
    nome: nome,
    valor: valor,
    tipo: options.value
  })

  salvar()
  renderizar()

  nomeTransacao.value = ""
  valorInput.value = ""
}

historico.addEventListener('click', (e) => {
  const botaoExcluir = e.target.closest('.excluir')

  if (botaoExcluir) {
    const index = botaoExcluir.getAttribute("data-id")

    transacoes.splice(index, 1)

    salvar()
    renderizar()
  }
})

botao.addEventListener('click', adicionar)

renderizar()