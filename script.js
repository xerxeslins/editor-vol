const inputContainer = document.getElementById('input-container');
const previewOutput = document.getElementById('preview-output');

function toggleHelp() {
    const modal = document.getElementById('help-modal');
    if (!modal) return;

    if (window.getComputedStyle(modal).display === "none") {
        modal.style.display = "flex";
    } else {
        modal.style.display = "none";
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('help-modal');
    if (modal && event.target == modal) {
        modal.style.display = "none";
    }
}

function addBlock(type) {
    const div = document.createElement('div');
    div.className = 'block-input';
    div.dataset.type = type;

    let headerHtml = `<div class="block-header">
    <strong>${type.toUpperCase()}</strong>
    <button class="btn-remove" onclick="removeBlock(this)">X</button>
    </div>`;

    let toolsHtml = '';

    if (['texto', 'lista'].includes(type)) {
        toolsHtml = `<div class="tools" style="margin-bottom:5px;">
        <button class="btn-tool" onmousedown="applyFormat('bold', event)" title="Negrito"><b>B</b></button>
        <button class="btn-tool" onmousedown="applyFormat('italic', event)" title="Itálico"><i>I</i></button>
        <button class="btn-tool" onmousedown="applyFormat('kbd', event)" title="Tecla (Kbd)">⌨</button>
        <button class="btn-tool" onmousedown="applyFormat('emphasis', event)" title="Ênfase">📝</button>
        <button class="btn-tool" onmousedown="applyFormat('link', event)" title="Link">🔗</button>
        <span style="margin-left:5px; margin-right:5px; color:#ddd">|</span>
        <button class="btn-tool" onmousedown="insertSymbol('←', event)">←</button>
        <button class="btn-tool" onmousedown="insertSymbol('↑', event)">↑</button>
        <button class="btn-tool" onmousedown="insertSymbol('↓', event)">↓</button>
        <button class="btn-tool" onmousedown="insertSymbol('→', event)">→</button>
        </div>`;
    } else if (type === 'comando') {
        toolsHtml = `<div class="tools" style="margin-bottom:5px;">
        <button class="btn-tool" onmousedown="applyFormat('link', event)">🔗 Link</button>
        </div>`;
    }

    let inputHtml = '';
    let contentStyle = "";
    let placeholder = ""; // Variável para o texto da dica
    let extraClass = "";

    // DEFINIÇÃO DOS TEXTOS DE DICA (PLACEHOLDERS)
    if (type === 'comando') {
        contentStyle = "font-family: monospace; background-color: #f8f8f8;";
        placeholder = "Digite o comando aqui (ex: sudo apt update)...";
        inputHtml = `<div class="editable-box" contenteditable="true" style="${contentStyle}" oninput="updatePreview()" onkeydown="handleEnter(event)" data-placeholder="${placeholder}"></div>`;

    } else if (type === 'saida-comando') {
        contentStyle = "font-family: monospace; background-color: #f8f8f8;";
        placeholder = "Cole a saída/resultado do terminal aqui...";
        inputHtml = `<div class="editable-box" contenteditable="true" style="${contentStyle}" oninput="updatePreview()" onkeydown="handleEnter(event)" data-placeholder="${placeholder}"></div>`;

    } else if (type === 'codigo') {
        extraClass = "code-block-style";
        placeholder = "Cole seu script, arquivo de configuração ou código fonte aqui...";
        inputHtml = `<div class="editable-box ${extraClass}" contenteditable="true" style="${contentStyle}" oninput="updatePreview()" onkeydown="handleEnter(event)" data-placeholder="${placeholder}"></div>`;

    } else if (type === 'lista') {
        placeholder = "Digite o item 1\nDigite o item 2...";
        inputHtml = `<div class="editable-box" contenteditable="true" oninput="updatePreview()" onkeydown="handleEnter(event)" data-placeholder="${placeholder}"></div>`;

    } else if (type === 'texto') {
        placeholder = "Escreva seus parágrafos aqui. Use as ferramentas acima para formatar.";
        inputHtml = `<div class="editable-box" contenteditable="true" oninput="updatePreview()" onkeydown="handleEnter(event)" data-placeholder="${placeholder}"></div>`;

    } else if (type === 'youtube') {
        inputHtml = `<input type="text" class="simple-input" style="width:100%; padding:8px;" oninput="updatePreview()" placeholder="Cole o link completo do vídeo (ex: https://www.youtube.com/watch?v=...)">`;

    } else if (type === 'imagem') {
        inputHtml = `<input type="text" class="simple-input" style="width:100%; padding:8px;" oninput="updatePreview()" placeholder="Digite o NOME DO ARQUIVO da imagem (ex: print_tela01.jpg)">`;

    } else if (type === 'titulo') {
        inputHtml = `<input type="text" class="simple-input" style="width:100%; padding:8px; font-size:1.2em; font-weight:bold" oninput="updatePreview()" placeholder="Digite o título da seção...">`;
    }

    div.innerHTML = headerHtml + toolsHtml + inputHtml;
    inputContainer.appendChild(div);
}

function removeBlock(btn) {
    btn.closest('.block-input').remove();
    updatePreview();
}

function handleEnter(e) {
    if (e.key === 'Enter') {
        setTimeout(() => { document.execCommand('removeFormat', false, null); }, 10);
    }
}

function getYoutubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function insertSymbol(symbol, event) {
    event.preventDefault();
    event.stopPropagation();

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
    event.preventDefault();
    const selection = window.getSelection();

    if (selection.rangeCount === 0 || selection.toString().length === 0) {
        alert("Selecione o texto primeiro.");
        return;
    }

    const text = selection.toString();
    if (/^\s|\s$/.test(text)) {
        alert("A seleção não pode começar nem terminar com espaços.");
        return;
    }

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

function generateHtml(isExport) {
    let html = "";
    const blocks = document.querySelectorAll('.block-input');

    blocks.forEach(block => {
        const type = block.dataset.type;
        const simpleInput = block.querySelector('.simple-input');
        const editableBox = block.querySelector('.editable-box');

        let content = simpleInput ? simpleInput.value : (editableBox ? editableBox.innerHTML : "");

        content = content.replace(/\u200B/g, '');
        content = content.replace(/[\u201C\u201D]/g, '"');

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
                html += `${content}<br/><br/>\n`;
            } else if (type === 'comando') {
                html += `<div class="destaque" style="background-color: #f0f8ff; padding: 10px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; border: 1px solid #ddd; margin: 5px 0; font-weight: bold;">${content}</div><br/>\n`;
            } else if (type === 'saida-comando') {
                html += `<div style="background-color: #ffffff; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: Consolas, 'Courier New', monospace; font-size: 13px; white-space: pre-wrap; margin: 5px 0;"><samp>${content}</samp></div><br/>\n`;
            } else if (type === 'codigo') {
                let cleanCode = content.replace(/<div>/gi, '\n').replace(/<\/div>/gi, '').replace(/<br>/gi, '\n');
                html += `<pre class="prettyprint">${cleanCode}</pre><br/>\n`;
            } else if (type === 'lista') {
                let listContent = content.replace(/<div>/gi, '<br>').replace(/<\/div>/gi, '');
                const items = listContent.split('<br>');
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

