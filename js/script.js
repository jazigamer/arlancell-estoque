// [file name]: app.js

// ============================
// CONFIGURAÇÕES
// ============================
const CONFIG = {
    MENSAGENS: {
        SEM_RESULTADOS: 'Nenhum resultado encontrado para "',
        CARREGANDO: 'Pesquisando...',
        ERRO: 'Erro ao realizar a busca'
    }
};

// ============================
// ELEMENTOS DO DOM
// ============================
const elementos = {
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    tableBody: document.getElementById('tableBody'),
    resultSection: document.getElementById('resultSection'),
    noResultMessage: document.getElementById('noResultMessage'),
    modelNameDisplay: document.getElementById('modelNameDisplay')
};

// ============================
// VALIDADORES
// ============================
const validadores = {
    modelo(modelo) {
        return modelo && typeof modelo === 'object';
    },
    
    pecas(pecas) {
        return Array.isArray(pecas);
    },
    
    peca(peca) {
        return peca && typeof peca === 'object' && peca.peca;
    }
};

// ============================
// FUNÇÕES DE UTILIDADE
// ============================
const utils = {
    escapeHTML(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    formatarPreco(preco) {
        if (preco === undefined || preco === null || preco === '') return '—';
        
        try {
            // Se for string, tenta converter para número
            const precoNumerico = parseFloat(preco);
            if (!isNaN(precoNumerico) && precoNumerico > 0) {
                return precoNumerico.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                });
            }
            return '—';
        } catch (error) {
            console.error('Erro ao formatar preço:', error);
            return '—';
        }
    },
    
    normalizarTexto(texto) {
        if (!texto) return '';
        return texto.toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^a-z0-9]/g, ''); // Remove caracteres especiais
    },
    
    criarElementoTr(pecaNome, modeloNome, preco, quantidade) {
        const tr = document.createElement("tr");
        const quantidadeTexto = quantidade === 0 ? "EM FALTA" : `${quantidade} UNID.`;
        const quantidadeClasse = quantidade === 0 ? "quantity-out" : "quantity-available";
        const precoFormatado = this.formatarPreco(preco);
        
        tr.innerHTML = `
            <td><strong>${this.escapeHTML(pecaNome)}</strong></td>
            <td>${this.escapeHTML(modeloNome)}</td>
            <td class="price-column">${precoFormatado}</td>
            <td>
                <span class="quantity-badge ${quantidadeClasse}">
                    ${quantidadeTexto}
                </span>
            </td>
        `;
        
        return tr;
    },
    
    mostrarErro(mensagem) {
        elementos.noResultMessage.classList.add("active");
        elementos.noResultMessage.textContent = mensagem;
        elementos.resultSection.style.display = "none";
    }
};

// ============================
// FUNÇÃO DE BUSCA
// ============================
function buscarModelos(termo) {
    if (!termo || termo.trim() === '') {
        elementos.resultSection.style.display = "none";
        elementos.noResultMessage.classList.remove("active");
        return [];
    }
    
    const termoNormalizado = utils.normalizarTexto(termo);
    
    const resultados = estoqueCompleto.filter(modelo => {
        // Verifica no nome do modelo
        if (utils.normalizarTexto(modelo.modelo).includes(termoNormalizado)) {
            return true;
        }
        
        // Verifica nos apelidos
        if (modelo.apelidos && Array.isArray(modelo.apelidos)) {
            return modelo.apelidos.some(apelido => 
                utils.normalizarTexto(apelido).includes(termoNormalizado)
            );
        }
        
        return false;
    });
    
    return resultados;
}

// ============================
// RENDERIZAÇÃO DOS RESULTADOS
// ============================
function renderizarResultados(resultados, termo) {
    const { tableBody, resultSection, noResultMessage } = elementos;
    
    tableBody.innerHTML = "";
    
    if (!resultados || resultados.length === 0) {
        resultSection.style.display = "none";
        noResultMessage.classList.add("active");
        noResultMessage.innerHTML = `
            <div class="no-result-content">
                <span class="no-result-icon">🔍</span>
                <h3>Nenhum resultado encontrado</h3>
                <p>Não encontramos nenhum item para "${termo}"</p>
                <p style="font-size: 0.9rem; margin-top: 1rem;">Tente: a01, iphone 11, g8 play, etc.</p>
            </div>
        `;
        return;
    }
    
    noResultMessage.classList.remove("active");
    resultSection.style.display = "block";
    
    const fragment = document.createDocumentFragment();
    let totalItens = 0;
    let temEstoque = false;
    
    resultados.forEach(modelo => {
        if (!validadores.modelo(modelo) || !validadores.pecas(modelo.pecas)) return;
        
        modelo.pecas.forEach(peca => {
            if (!validadores.peca(peca)) return;
            
            // Só mostra peças que têm quantidade > 0 OU preço definido
            if (peca.quantidade > 0 || (peca.preco && peca.preco !== '')) {
                const tr = utils.criarElementoTr(
                    peca.peca,
                    modelo.modelo || 'Modelo não especificado',
                    peca.preco,
                    peca.quantidade || 0
                );
                
                fragment.appendChild(tr);
                totalItens++;
                if (peca.quantidade > 0) temEstoque = true;
            }
        });
    });
    
    if (totalItens === 0) {
        resultSection.style.display = "none";
        noResultMessage.classList.add("active");
        noResultMessage.innerHTML = `
            <div class="no-result-content">
                <span class="no-result-icon">📦</span>
                <h3>Modelo encontrado mas sem estoque</h3>
                <p>O modelo "${termo}" existe mas não tem peças disponíveis no momento</p>
            </div>
        `;
        return;
    }
    
    tableBody.appendChild(fragment);
    
    // Atualiza o header com o nome do primeiro modelo encontrado
    if (elementos.modelNameDisplay && resultados.length > 0) {
        elementos.modelNameDisplay.textContent = resultados[0].modelo;
    }
}

// ============================
// FUNÇÃO PRINCIPAL DE PESQUISA
// ============================
function realizarPesquisa() {
    const termo = elementos.searchInput.value.trim();
    
    if (termo === '') {
        elementos.searchInput.style.borderColor = '#dc3545';
        setTimeout(() => {
            elementos.searchInput.style.borderColor = '#e2e8f0';
        }, 1000);
        return;
    }
    
    // Mostra estado de carregamento
    elementos.searchBtn.classList.add('search-loading');
    elementos.searchBtn.innerHTML = '<span class="btn-icon">⏳</span> Buscando...';
    
    // Simula um pequeno delay para feedback visual
    setTimeout(() => {
        const resultados = buscarModelos(termo);
        renderizarResultados(resultados, termo);
        
        // Restaura o botão
        elementos.searchBtn.classList.remove('search-loading');
        elementos.searchBtn.innerHTML = '<span class="btn-icon">🔍</span> Verificar Estoque';
    }, 300);
}

// ============================
// INICIALIZAÇÃO E EVENTOS
// ============================
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se todos os elementos existem
    const elementosNecessarios = ['searchInput', 'searchBtn', 'tableBody', 'resultSection', 'noResultMessage'];
    const elementosFaltando = elementosNecessarios.filter(id => !document.getElementById(id));
    
    if (elementosFaltando.length > 0) {
        console.error('Elementos faltando no HTML:', elementosFaltando);
        utils.mostrarErro('Erro de configuração: elementos não encontrados');
        return;
    }
    
    // Verifica se o estoque está disponível
    if (typeof estoqueCompleto === 'undefined') {
        console.error('Estoque não encontrado. Verifique se o data.js foi carregado.');
        utils.mostrarErro('Erro: Dados de estoque não carregados');
        return;
    }
    
    console.log('Sistema inicializado com sucesso!');
    console.log(`Total de modelos: ${estoqueCompleto.length}`);
    
    // Event listeners
    elementos.searchBtn.addEventListener('click', realizarPesquisa);
    
    elementos.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            realizarPesquisa();
        }
    });
    
    elementos.searchInput.addEventListener('input', () => {
        elementos.searchInput.style.borderColor = '#e2e8f0';
    });
    
    // Adiciona sugestões rápidas de busca
    const exemplos = ['a01', 'iphone 11', 'g8 play', 'j5', 'redmi'];
    let exemploIndex = 0;
    
    setInterval(() => {
        if (elementos.searchInput === document.activeElement) return;
        elementos.searchInput.placeholder = `Buscar... ex: ${exemplos[exemploIndex]}`;
        exemploIndex = (exemploIndex + 1) % exemplos.length;
    }, 3000);
});

// ============================
// EXPORTAÇÃO PARA DEBUG
// ============================
window.debug = {
    buscarModelos,
    renderizarResultados,
    estoque: estoqueCompleto
};