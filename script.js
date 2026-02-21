const inputContainer = document.getElementById('input-container');
const previewOutput = document.getElementById('preview-output');

window.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('editorVolBlocks');
    if (saved) {
        try {
            const blocks = JSON.parse(saved);
            if (blocks.length > 0) {
                blocks.forEach(b => addBlock(b.type, b.content));
                updatePreview();
                return;
            }
        } catch (e) { console.error("Erro ao carregar cache", e); }
    }
});

function saveToLocal() {
    const blocks = [];
    document.querySelectorAll('.block-input').forEach(block => {
        const type = block.dataset.type;
        const simpleInput = block.querySelector('.simple-input');
        const editableBox = block.querySelector('.editable-box');
        const content = simpleInput ? simpleInput.value : (editableBox ? editableBox.innerHTML : "");
        blocks.push({ type, content });
    });
    localStorage.setItem('editorVolBlocks', JSON.stringify(blocks));
}

function changeView(mode) {
    const editorSide = document.querySelector('.editor-side');
    const previewSide = document.querySelector('.preview-side');
    const btns = document.querySelectorAll('.btn-view');

    editorSide.classList.remove('hidden', 'full-width');
    previewSide.classList.remove('hidden', 'full-width');

    btns.forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${mode}`).classList.add('active');

    if (mode === 'editor') {
        previewSide.classList.add('hidden');
        editorSide.classList.add('full-width');
    } else if (mode === 'preview') {
        editorSide.classList.add('hidden');
        previewSide.classList.add('full-width');
    }
}

function toggleHelp() {
    const modal = document.getElementById('help-modal');
    if (!modal) return;
    modal.style.display = (window.getComputedStyle(modal).display === "none") ? "flex" : "none";
}

window.onclick = function(event) {
    const modal = document.getElementById('help-modal');
    if (modal && event.target == modal) modal.style.display = "none";
}

function addBlock(type, initialContent = "") {
    const div = document.createElement('div');
    div.className = 'block-input';
    div.dataset.type = type;

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

    if (['texto', 'lista', 'citacao'].includes(type)) {
        toolsHtml = `<div class="tools">
        <button class="btn-tool" onmousedown="applyFormat('bold', event)" title="Negrito (Ctrl+B)"><b>B</b></button>
        <button class="btn-tool" onmousedown="applyFormat('italic', event)" title="Itálico (Ctrl+I)"><i>I</i></button>
        <button class="btn-tool" onmousedown="applyFormat('strikeThrough', event)" title="Tachado (Ctrl+D)"><s>S</s></button>
        <button class="btn-tool" onmousedown="applyFormat('kbd', event)" title="Tecla (Ctrl+K)">⌨</button>
        <button class="btn-tool" onmousedown="applyFormat('emphasis', event)" title="Ênfase (Ctrl+E)">📝</button>
        <button class="btn-tool" onmousedown="applyFormat('link', event)" title="Link (Ctrl+L)">🔗</button>
        <button class="btn-tool" onmousedown="applyFormat('clear', event)" title="Limpar Formatação">🧹</button>
        <span style="margin-left:5px; margin-right:5px; color:#ddd">|</span>
        <button class="btn-tool" onmousedown="insertSymbol('&larr;', event)" title="Seta para Esquerda">←</button>
        <button class="btn-tool" onmousedown="insertSymbol('&uarr;', event)" title="Seta para Cima">↑</button>
        <button class="btn-tool" onmousedown="insertSymbol('&darr;', event)" title="Seta para Baixo">↓</button>
        <button class="btn-tool" onmousedown="insertSymbol('&rarr;', event)" title="Seta para Direita">→</button>
        </div>`;
    } else if (type === 'comando') {
        toolsHtml = `<div class="tools">
        <button class="btn-tool" onmousedown="applyFormat('link', event)" title="Link (Ctrl+L)">🔗 Link</button>
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
        extraClass = "code-block-style";
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
        placeholder = "Escreva seus parágrafos aqui. Use Ctrl+B para negrito, etc.";
        inputHtml = `<div class="editable-box" contenteditable="true" oninput="updatePreview()" data-placeholder="${placeholder}"></div>`;
    } else if (type === 'citacao') {
        contentStyle = "border-left: 4px solid #ccc; padding-left: 10px; font-style: italic; color: #555; background-color: #fcfcfc;";
        placeholder = "Digite a citação aqui. Use Ctrl+B para negrito, etc.";
        inputHtml = `<div class="editable-box" contenteditable="true" style="${contentStyle}" oninput="updatePreview()" data-placeholder="${placeholder}"></div>`;
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

    if (initialContent) {
        const simpleInput = div.querySelector('.simple-input');
        const editableBox = div.querySelector('.editable-box');
        if (simpleInput) simpleInput.value = initialContent;
        if (editableBox) editableBox.innerHTML = initialContent;
    }
}

function setupEvents(blockElement) {
    const editable = blockElement.querySelector('.editable-box');
    if (!editable) return;

    editable.addEventListener('paste', function(e) {
        e.preventDefault();
        const text = (e.originalEvent || e).clipboardData.getData('text/plain');
        document.execCommand("insertText", false, text);
    });

    editable.addEventListener('keydown', function(e) {
        if (e.ctrlKey && !e.shiftKey && !e.altKey) {
            const key = e.key.toLowerCase();
            const map = {
                'b': 'bold',
                'i': 'italic',
                'd': 'strikeThrough',
                'k': 'kbd',
                'e': 'emphasis',
                'l': 'link'
            };
            if (map[key]) {
                e.preventDefault();
                applyFormat(map[key], e);
            }
        }
    });
}

function insertSymbol(symbol, event) {
    if (event) event.preventDefault();
    document.execCommand('insertHTML', false, symbol);
    updatePreview();
}

function applyFormat(formatType, event) {

    if (event && event.type === 'mousedown') {
        event.preventDefault();
    }

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();

    if (selectedText.length === 0 && formatType !== 'clear') return;

    if (selectedText && /^\s|\s$/.test(selectedText)) {
        alert("A seleção não pode começar nem terminar com espaços.");
        return;
    }

    if (formatType === 'clear') {
        document.execCommand('removeFormat', false, null);
        document.execCommand('unlink', false, null);
        updatePreview();
        return;
    }

    const nativeFormats = {
        bold: 'bold',
        italic: 'italic',
        strikeThrough: 'strikeThrough'
    };

    if (nativeFormats[formatType]) {

        document.execCommand(nativeFormats[formatType], false, null);

        const newRange = selection.getRangeAt(0);
        newRange.collapse(false);
        selection.removeAllRanges();
        selection.addRange(newRange);

        document.execCommand(nativeFormats[formatType], false, null);

        updatePreview();
        return;
    }

    if (formatType === 'link') {
        const url = prompt("Insira a URL:");
        if (url) {
            document.execCommand('createLink', false, url);

            const newRange = selection.getRangeAt(0);
            newRange.collapse(false);
            selection.removeAllRanges();
            selection.addRange(newRange);

            document.execCommand('unlink', false, null);
        }

        updatePreview();
        return;
    }

    if (formatType === 'kbd') {
        document.execCommand('insertHTML', false, `<kbd>${selectedText}</kbd>`);
    }

    if (formatType === 'emphasis') {
        document.execCommand('insertHTML', false, `<code><em>${selectedText}</em></code>`);
    }

    updatePreview();
}

function removeBlock(btn) {
    btn.closest('.block-input').remove();
    updatePreview();
}

function moveBlock(btn, direction) {
    const block = btn.closest('.block-input');
    const parent = block.parentNode;
    if (direction === -1 && block.previousElementSibling)
        parent.insertBefore(block, block.previousElementSibling);
    if (direction === 1 && block.nextElementSibling)
        parent.insertBefore(block.nextElementSibling, block);
    updatePreview();
}

function duplicateBlock(btn) {
    const block = btn.closest('.block-input');
    const clone = block.cloneNode(true);
    setupEvents(clone);
    block.parentNode.insertBefore(clone, block.nextSibling);
    updatePreview();
}

function cleanContent(html) {
    let clean = html;
    clean = clean.replace(/\u200B/g, '');
    clean = clean.replace(/ style="[^"]*"/gi, '');
    clean = clean.replace(/ class="[^"]*"/gi, '');
    clean = clean.replace(/<\/?span[^>]*>/gi, '');

    clean = clean.replace(/<div[^>]*>\s*<br\s*\/?>\s*<\/div>/gi, '<br>');
    clean = clean.replace(/<div[^>]*>/gi, '<br>');
    clean = clean.replace(/<\/div>/gi, '');
    clean = clean.replace(/(<br\s*\/?>){3,}/gi, '<br><br>');

    clean = clean.replace(/^<br\s*\/?>/i, '');
    clean = clean.replace(/[\u201C\u201D]/g, '"');
    return clean;
}

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
            const codeBreak = isExport ? "\n\n" : "\n";

            if (type === 'titulo') {
                html += `<h1>${content}</h1>${codeBreak}`;
            } else if (type === 'texto') {
                const nextBlock = blocks[index + 1];
                const isNextList = nextBlock && nextBlock.dataset.type === 'lista';
                if (isNextList) {
                    html += `${content}${codeBreak}`;
                } else {
                    html += `${content}<br/><br/>${codeBreak}`;
                }
            } else if (type === 'citacao') {
                html += `<blockquote>${content}</blockquote><br/>${codeBreak}`;
            } else if (type === 'comando') {
                html += `<div class="destaque" style="background-color: #f0f8ff; padding: 10px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; border: 1px solid #ddd; margin: 5px 0; font-weight: bold;">${content}</div><br/>${codeBreak}`;
            } else if (type === 'saida-comando') {
                html += `<div style="background-color: #ffffff; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: Consolas, 'Courier New', monospace; font-size: 13px; white-space: pre-wrap; margin: 5px 0;"><samp>${content}</samp></div><br/>${codeBreak}`;
            } else if (type === 'configuracao') {
                html += `<div class='codigo'>${content}</div><br/>${codeBreak}`;
            } else if (type === 'codigo') {
                let cleanCode = content.replace(/<br\s*\/?>/gi, '\n');
                html += `<pre class="prettyprint">${cleanCode}</pre><br/>${codeBreak}`;
            } else if (type === 'lista') {
                let listContent = content.replace(/<br\s*\/?>/gi, '\n');
                const items = listContent.split('\n');
                let listItemsHtml = "";
                items.forEach(item => {
                    let cleanItem = item.trim();
                    if (cleanItem !== "") listItemsHtml += `<li>${cleanItem}</li>`;
                });
                if (listItemsHtml) html += `<ul>${listItemsHtml}</ul><br/>${codeBreak}`;
            } else if (type === 'youtube') {
                const videoId = getYoutubeId(content);
                if (videoId) {
                    if (isExport) {
                        html += `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe><br/><br/>${codeBreak}`;
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
                    html += `<p style="color: red; font-weight: bold; border: 1px dashed red; padding: 10px;">[AVISO AO MODERADOR: ADICIONAR IMAGEM "${content}" AQUI]</p><br/><br/>${codeBreak}`;
                } else {
                    html += `<div class="image-placeholder">Caro moderador, por favor adicione a imagem <strong>${content}</strong> aqui.</div>\n`;
                }
            }
        }
    });

    if (isExport) {
        return `<div>${isExport ? "\n\n" : "\n"}${html}</div>`;
    }
    return html;
}

function updatePreview() {
    previewOutput.innerHTML = generateHtml(false);
    saveToLocal();
}

function exportHtml() {
    const content = generateHtml(true);
    navigator.clipboard.writeText(content).then(() => {
        alert("Código HTML copiado para a área de transferência!");
    }).catch(err => {
        alert("Erro ao copiar.");
    });
}

function clearAllBlocks() {
    if (!confirm("Tem certeza que deseja apagar TODOS os blocos? Isso não pode ser desfeito.")) {
        return;
    }
    document.getElementById('input-container').innerHTML = '';
    updatePreview();
}
