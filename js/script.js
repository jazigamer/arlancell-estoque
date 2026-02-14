// Elementos
const modelInput = document.getElementById("modelInput");
const searchBtn = document.getElementById("searchBtn");
const tableBody = document.getElementById("tableBody");
const resultSection = document.getElementById("resultSection");
const noResultMessage = document.getElementById("noResultMessage");

// ============================
// FUNÇÃO DE BUSCA (CORRIGIDA)
// ============================
function buscar(termo) {
  termo = termo.toLowerCase();

  return estoqueCompleto.filter(modelo => {
    // Verifica se modelo existe
    if (!modelo) return false;

    // Marca - com verificação
    if (modelo.marca && modelo.marca.toLowerCase().includes(termo)) return true;

    // Modelo - com verificação
    if (modelo.modelo && modelo.modelo.toLowerCase().includes(termo)) return true;

    // Apelidos - com verificação
    if (modelo.apelidos && Array.isArray(modelo.apelidos)) {
      if (modelo.apelidos.some(a => 
        a && a.toLowerCase && a.toLowerCase().includes(termo)
      )) return true;
    }

    // Peças - com verificação
    if (modelo.pecas && Array.isArray(modelo.pecas)) {
      if (modelo.pecas.some(p => 
        p && p.peca && p.peca.toLowerCase && p.peca.toLowerCase().includes(termo)
      )) return true;
    }

    return false;
  });
}

// ============================
// RENDERIZA MODELO (CORRIGIDA)
// ============================
function renderizarModelo(modelo) {
  // Verifica se modelo e peças existem
  if (!modelo || !modelo.pecas || !Array.isArray(modelo.pecas)) return;

  modelo.pecas.forEach(item => {
    // Verifica se o item existe
    if (!item) return;

    const tr = document.createElement("tr");

    const quantidadeTexto =
      item.quantidade === 0
        ? "EM FALTA"
        : item.quantidade + " UNID.";

    const quantidadeClasse =
      item.quantidade === 0
        ? "quantity-out"
        : "quantity-available";

    // Verifica se peca e modelo existem antes de usar
    const pecaNome = item.peca || "Peça não especificada";
    const modeloNome = modelo.modelo || "Modelo não especificado";

    tr.innerHTML = `
      <td><strong>${pecaNome}</strong></td>
      <td>${modeloNome}</td>
      <td>
        <span class="quantity-badge ${quantidadeClasse}">
          ${quantidadeTexto}
        </span>
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

// ============================
// PESQUISAR
// ============================
function pesquisar() {
  const termo = modelInput.value.trim();
  if (!termo) return;

  // Verifica se estoqueCompleto existe
  if (!estoqueCompleto || !Array.isArray(estoqueCompleto)) {
    console.error("estoqueCompleto não está definido ou não é um array");
    return;
  }

  const resultados = buscar(termo);

  tableBody.innerHTML = "";

  if (resultados.length === 0) {
    resultSection.style.display = "none";
    noResultMessage.classList.add("active");
    return;
  }

  noResultMessage.classList.remove("active");
  resultSection.style.display = "block";

  resultados.forEach(modelo => {
    renderizarModelo(modelo);
  });
}

// ============================
// EVENTOS
// ============================
if (searchBtn) {
  searchBtn.addEventListener("click", pesquisar);
}

if (modelInput) {
  modelInput.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      pesquisar();
    }
  });
}