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

    if (['texto', 'lista'].includes(type)) {
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

    if (type === 'titulo') {
        inputHtml = `<input type="text" class="simple-input" oninput="updatePreview()">`;
    } else {
        inputHtml = `<div class="editable-box" contenteditable="true" oninput="updatePreview()"></div>`;
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

    // Não permitir espaços nas extremidades
    if (selectedText && /^\s|\s$/.test(selectedText)) {
        alert("A seleção não pode começar nem terminar com espaços.");
        return;
    }

    // Limpar formatação
    if (formatType === 'clear') {
        document.execCommand('removeFormat', false, null);
        document.execCommand('unlink', false, null);
        updatePreview();
        return;
    }

    // Formatações nativas
    const nativeFormats = {
        bold: 'bold',
        italic: 'italic',
        strikeThrough: 'strikeThrough'
    };

    if (nativeFormats[formatType]) {

        // Aplica na seleção
        document.execCommand(nativeFormats[formatType], false, null);

        // Colapsa o cursor no final
        const newRange = selection.getRangeAt(0);
        newRange.collapse(false);
        selection.removeAllRanges();
        selection.addRange(newRange);

        // Desativa o modo de digitação
        document.execCommand(nativeFormats[formatType], false, null);

        updatePreview();
        return;
    }

    // Link
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

    // Formatos personalizados
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

function generateHtml() {
    let html = "";
    document.querySelectorAll('.block-input').forEach(block => {
        const type = block.dataset.type;
        const simpleInput = block.querySelector('.simple-input');
        const editableBox = block.querySelector('.editable-box');
        let content = simpleInput ? simpleInput.value : (editableBox ? editableBox.innerHTML : "");

        if (content.trim() !== "") {
            if (type === 'titulo') html += `<h1>${content}</h1>\n`;
            else html += `${content}<br><br>\n`;
        }
    });
    return html;
}

function updatePreview() {
    previewOutput.innerHTML = generateHtml();
    saveToLocal();
}
