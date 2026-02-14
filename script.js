const inputContainer = document.getElementById('input-container');
const previewOutput = document.getElementById('preview-output');

// --- MODAL DE AJUDA ---
function toggleHelp() {
    const modal = document.getElementById('help-modal');
    if (!modal) return;
    modal.style.display = (window.getComputedStyle(modal).display === "none") ? "flex" : "none";
}

window.onclick = function(event) {
    const modal = document.getElementById('help-modal');
    if (modal && event.target == modal) modal.style.display = "none";
}

// --- ADICIONAR BLOCOS ---
function addBlock(type) {
    const div = document.createElement('div');
    div.className = 'block-input';
    div.dataset.type = type;

    // Cabeçalho com Botões "Subir", "Descer", "Duplicar"
    let headerHtml = `<div class="block-header">
                        <strong>${type.toUpperCase()}</strong>
                        <div class="header-controls">
                            <button class="btn-control" onclick="moveBlock(this, -1)">Subir</button>
                            <button class="btn-control" onclick="moveBlock(this, 1)">Descer</button>
                            <button class="btn-control" onclick="duplicateBlock(this)" title="Duplicar">📄</button>
                            <button class="btn-remove" onclick="removeBlock(this)" title="Remover">X</button>
                        </div>
                      </div>`;
    
    let toolsHtml = '';
    
    // Ferramentas
    if (['texto', 'lista'].includes(type)) {
        toolsHtml = `<div class="tools">
                        <button class="btn-tool" onmousedown="applyFormat('bold', event)" title="Negrito (Shift+B)"><b>B</b></button>
                        <button class="btn-tool" onmousedown="applyFormat('italic', event)" title="Itálico (Shift+I)"><i>I</i></button>
                        <button class="btn-tool" onmousedown="applyFormat('kbd', event)" title="Tecla (Shift+K)">⌨</button>
                        <button class="btn-tool" onmousedown="applyFormat('emphasis', event)" title="Ênfase (Shift+E)">📝</button>
                        <button class="btn-tool" onmousedown="applyFormat('link', event)" title="Link (Shift+L)">🔗</button>
                        <span style="margin-left:5px; margin-right:5px; color:#ddd">|</span>
                        <button class="btn-tool" onmousedown="insertSymbol('←', event)">←</button>
                        <button class="btn-tool" onmousedown="insertSymbol('↑', event)">↑</button>
                        <button class="btn-tool" onmousedown="insertSymbol('↓', event)">↓</button>
                        <button class="btn-tool" onmousedown="insertSymbol('→', event)">→</button>
                     </div>`;
    } else if (type === 'comando') {
        toolsHtml = `<div class="tools">
                        <button class="btn-tool" onmousedown="applyFormat('link', event)" title="Link (Shift+L)">🔗 Link</button>
                     </div>`;
    }

    let inputHtml = '';
    let contentStyle = "";
    let placeholder = "";
    let extraClass = "";

    if (type === 'comando') {
        contentStyle = "font-family: monospace; background-color: #f8f8f8;";
        placeholder = "Digite o comando aqui...";
        inputHtml = `<div class="editable-box" contenteditable="true" style="${contentStyle}" oninput="updatePreview()" data-placeholder="${placeholder}"></div>`;
    
    } else if (type === 'saida-comando') {
        contentStyle = "font-family: monospace; background-color: #f8f8f8;";
        placeholder = "Cole a saída do terminal aqui...";
        inputHtml = `<div class="editable-box" contenteditable="true" style="${contentStyle}" oninput="updatePreview()" data-placeholder="${placeholder}"></div>`;
    
    } else if (type === 'configuracao') {
        // NOVO BLOCO DE CONFIGURAÇÃO
        extraClass = "code-block-style";
        // Estilo visual levemente diferente do código normal (mais claro)
        contentStyle = "background-color: #f4f4f4; color: #333; border: 1px solid #ccc;"; 
        placeholder = "Cole o conteúdo do arquivo de configuração (.conf, .ini, etc)...";
        inputHtml = `<div class="editable-box ${extraClass}" contenteditable="true" style="${contentStyle}" oninput="updatePreview()" data-placeholder="${placeholder}"></div>`;
    
    } else if (type === 'codigo') {
        extraClass = "code-block-style";
        placeholder = "Cole seu código fonte aqui (scripts, C, Python, etc)...";
        inputHtml = `<div class="editable-box ${extraClass}" contenteditable="true" style="${contentStyle}" oninput="updatePreview()" data-placeholder="${placeholder}"></div>`;
    
    } else if (type === 'lista') {
        placeholder = "Digite o item 1\nDigite o item 2...";
        inputHtml = `<div class="editable-box" contenteditable="true" oninput="updatePreview()" data-placeholder="${placeholder}"></div>`;
    
    } else if (type === 'texto') {
        placeholder = "Escreva seus parágrafos aqui. Use Shift+B para negrito, etc.";
        inputHtml = `<div class="editable-box" contenteditable="true" oninput="updatePreview()" data-placeholder="${placeholder}"></div>`;
    
    } else if (type === 'youtube') {
        inputHtml = `<input type="text" class="simple-input" style="width:100%; padding:8px;" oninput="updatePreview()" placeholder="Cole o link do YouTube...">`;
    
    } else if (type === 'imagem') {
        inputHtml = `<input type="text" class="simple-input" style="width:100%; padding:8px;" oninput="updatePreview()" placeholder="Nome do arquivo da imagem...">`;
    
    } else if (type === 'titulo') {
        inputHtml = `<input type="text" class="simple-input" style="width:100%; padding:8px; font-size:1.2em; font-weight:bold" oninput="updatePreview()" placeholder="Digite o título...">`;
    }

    div.innerHTML = headerHtml + toolsHtml + inputHtml;
    setupEvents(div);
    inputContainer.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// --- EVENTOS (PASTE E ATALHOS) ---
function setupEvents(blockElement) {
    const editable = blockElement.querySelector('.editable-box');
    if (editable) {
        // Paste Text Only
        editable.addEventListener('paste', function(e) {
            e.preventDefault();
            const text = (e.originalEvent || e).clipboardData.getData('text/plain');
            document.execCommand("insertText", false, text);
        });

        // Shortcuts
        editable.addEventListener('keydown', function(e) {
            if (e.shiftKey && !e.ctrlKey && !e.altKey) {
                const key = e.key.toLowerCase();
                const shortcutMap = {
                    'b': 'bold', 'i': 'italic', 'k': 'kbd', 'e': 'emphasis', 'l': 'link'
                };
                if (shortcutMap[key]) {
                    const selection = window.getSelection();
                    if (selection.toString().length > 0) {
                        e.preventDefault(); 
                        applyFormat(shortcutMap[key], e);
                    }
                }
            }
        });
    }
}

// --- CONTROLES DE BLOCO ---
function removeBlock(btn) {
    const shouldConfirm = document.getElementById('confirm-delete').checked;
    if (shouldConfirm) {
        if(confirm("Tem certeza que deseja remover este bloco?")) {
            btn.closest('.block-input').remove();
            updatePreview();
        }
    } else {
        btn.closest('.block-input').remove();
        updatePreview();
    }
}

function moveBlock(btn, direction) {
    const currentBlock = btn.closest('.block-input');
    const parent = currentBlock.parentNode;
    if (direction === -1) { 
        const prevBlock = currentBlock.previousElementSibling;
        if (prevBlock) {
            parent.insertBefore(currentBlock, prevBlock);
            updatePreview();
            currentBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else { 
        const nextBlock = currentBlock.nextElementSibling;
        if (nextBlock) {
            parent.insertBefore(nextBlock, currentBlock);
            updatePreview();
            currentBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function duplicateBlock(btn) {
    const originalBlock = btn.closest('.block-input');
    const clone = originalBlock.cloneNode(true);
    const origInput = originalBlock.querySelector('.simple-input');
    const cloneInput = clone.querySelector('.simple-input');
    if (origInput && cloneInput) cloneInput.value = origInput.value;
    setupEvents(clone);
    originalBlock.parentNode.insertBefore(clone, originalBlock.nextSibling);
    updatePreview();
}

// --- UTILITÁRIOS ---
function getYoutubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function insertSymbol(symbol, event) {
    event.preventDefault(); event.stopPropagation();
    const btn = event.currentTarget;
    const block = btn.closest('.block-input');
    const editableBox = block.querySelector('.editable-box');
    if (!editableBox) return;

    editableBox.focus();
    const selection = window.getSelection();
    let range;
    if (selection.rangeCount > 0 && editableBox.contains(selection.anchorNode)) {
        range = selection.getRangeAt(0);
    } else {
        range = document.createRange();
        range.selectNodeContents(editableBox);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    const textNode = document.createTextNode(symbol);
    range.deleteContents();
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    updatePreview();
}

function applyFormat(formatType, event) {
    if (event.type === 'mousedown') event.preventDefault();
    const selection = window.getSelection();
    if (selection.rangeCount === 0 || selection.toString().length === 0) { 
        if (event.type === 'mousedown') alert("Selecione o texto primeiro."); 
        return; 
    }
    const text = selection.toString();
    if (/^\s|\s$/.test(text)) { alert("A seleção não pode começar nem terminar com espaços."); return; }

    const range = selection.getRangeAt(0);
    let nodeToInsert;

    if (formatType === 'link') {
        const url = prompt("Insira a URL:");
        if (!url) return;
        nodeToInsert = document.createElement('a');
        nodeToInsert.href = url;
        nodeToInsert.textContent = text;
    } else if (formatType === 'emphasis') {
        const code = document.createElement('code');
        const em = document.createElement('em');
        em.textContent = text;
        code.appendChild(em);
        nodeToInsert = code;
    } else if (formatType === 'bold') {
        nodeToInsert = document.createElement('strong');
        nodeToInsert.textContent = text;
    } else if (formatType === 'italic') {
        nodeToInsert = document.createElement('em');
        nodeToInsert.textContent = text;
    } else if (formatType === 'kbd') {
        nodeToInsert = document.createElement('kbd');
        nodeToInsert.textContent = text;
    }

    if (nodeToInsert) {
        range.deleteContents();
        range.insertNode(nodeToInsert);
        const zeroWidthSpace = document.createTextNode('\u200B');
        range.setStartAfter(nodeToInsert);
        range.insertNode(zeroWidthSpace);
        range.setStartAfter(zeroWidthSpace);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    updatePreview();
}

// --- LIMPEZA DE HTML ---
function cleanContent(html) {
    let clean = html;
    clean = clean.replace(/\u200B/g, ''); 
    clean = clean.replace(/ style="[^"]*"/gi, '');
    clean = clean.replace(/ class="[^"]*"/gi, '');
    clean = clean.replace(/<\/?span[^>]*>/gi, '');
    
    // Normaliza DIVs para BRs e evita triplos
    clean = clean.replace(/<div[^>]*>\s*<br\s*\/?>\s*<\/div>/gi, '<br>');
    clean = clean.replace(/<div[^>]*>/gi, '<br>');
    clean = clean.replace(/<\/div>/gi, '');
    clean = clean.replace(/(<br\s*\/?>){3,}/gi, '<br><br>');
    
    clean = clean.replace(/^<br\s*\/?>/i, ''); 
    clean = clean.replace(/[\u201C\u201D]/g, '"');
    return clean;
}

// --- GERADOR DE HTML ---
function generateHtml(isExport) {
    let html = "";
    const blocks = document.querySelectorAll('.block-input');

    blocks.forEach((block, index) => {
        const type = block.dataset.type;
        const simpleInput = block.querySelector('.simple-input');
        const editableBox = block.querySelector('.editable-box');
        
        let content = simpleInput ? simpleInput.value : (editableBox ? editableBox.innerHTML : "");
        content = cleanContent(content);

        if (isExport) {
            content = content.replace(/←/g, '&larr;')
                             .replace(/↑/g, '&uarr;')
                             .replace(/→/g, '&rarr;')
                             .replace(/↓/g, '&darr;');
        }

        if (content.trim() !== "" && content !== "<br>") {
            if (type === 'titulo') {
                html += `<h1>${content}</h1>\n`;
            } else if (type === 'texto') {
                const nextBlock = blocks[index + 1];
                const isNextList = nextBlock && nextBlock.dataset.type === 'lista';
                if (isNextList) {
                    html += `${content}\n`; 
                } else {
                    html += `${content}<br/><br/>\n`; 
                }
            } else if (type === 'comando') {
                html += `<div class="destaque" style="background-color: #f0f8ff; padding: 10px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; border: 1px solid #ddd; margin: 5px 0; font-weight: bold;">${content}</div><br/>\n`;
            } else if (type === 'saida-comando') {
                html += `<div style="background-color: #ffffff; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: Consolas, 'Courier New', monospace; font-size: 13px; white-space: pre-wrap; margin: 5px 0;"><samp>${content}</samp></div><br/>\n`;
            
            // --- BLOCO CONFIGURAÇÃO (EXPORTAÇÃO) ---
            } else if (type === 'configuracao') {
                html += `<div class='codigo'>${content}</div><br/>\n`;
            
            } else if (type === 'codigo') {
                let cleanCode = content.replace(/<br\s*\/?>/gi, '\n');
                html += `<pre class="prettyprint">${cleanCode}</pre><br/>\n`;
            } else if (type === 'lista') {
                let listContent = content.replace(/<br\s*\/?>/gi, '\n'); 
                const items = listContent.split('\n');
                let listItemsHtml = "";
                items.forEach(item => {
                    let cleanItem = item.trim();
                    if (cleanItem !== "") listItemsHtml += `<li>${cleanItem}</li>`;
                });
                if (listItemsHtml) html += `<ul>${listItemsHtml}</ul><br/>\n`;
            } else if (type === 'youtube') {
                const videoId = getYoutubeId(content);
                if (videoId) {
                    if (isExport) {
                        html += `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe><br/><br/>\n`;
                    } else {
                        html += `<div class="youtube-placeholder">VIDEO ID: ${videoId}<br>Se inseriu um link válido, o vídeo ficará aqui após a publicação.</div>\n`;
                    }
                } else {
                    if (!isExport) {
                        html += `<div class="youtube-placeholder" style="background-color: #ffe6e6; border: 2px dashed #ff4d4d; color: #d8000c;">⚠️ <b>Link Inválido</b><br>Cole a URL completa do YouTube.</div>\n`;
                    }
                }
            } else if (type === 'imagem') {
                if (isExport) {
                    html += `<p style="color: red; font-weight: bold; border: 1px dashed red; padding: 10px;">[AVISO AO MODERADOR: ADICIONAR IMAGEM "${content}" AQUI]</p><br/><br/>\n`;
                } else {
                    html += `<div class="image-placeholder">Caro moderador, por favor adicione a imagem <strong>${content}</strong> aqui.</div>\n`;
                }
            }
        }
    });

    if (isExport) {
        return `<div>\n${html}</div>`;
    }
    return html;
}

function updatePreview() {
    previewOutput.innerHTML = generateHtml(false);
}

function exportHtml() {
    const content = generateHtml(true);
    navigator.clipboard.writeText(content).then(() => {
        alert("Código HTML copiado para a área de transferência!");
    }).catch(err => {
        alert("Erro ao copiar.");
    });
}