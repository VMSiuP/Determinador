document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO GLOBAL Y REFERENCIAS UI ---
    let state = {};
    const ui = {
        themeToggle: document.getElementById('themeToggle'),
        body: document.body,
        minAnos: document.getElementById('minAnos'), minMeses: document.getElementById('minMeses'), minDias: document.getElementById('minDias'),
        maxAnos: document.getElementById('maxAnos'), maxMeses: document.getElementById('maxMeses'), maxDias: document.getElementById('maxDias'),
        circunstancias: document.getElementById('circunstancias'),
        submoduloIncremento: document.getElementById('submoduloIncremento'),
        submoduloDisminucion: document.getElementById('submoduloDisminucion'),
        submoduloAmbas: document.getElementById('submoduloAmbas'),
        module02: document.getElementById('module02'),
        module03: document.getElementById('module03'),
        module04: document.getElementById('module04'),
        module05: document.getElementById('module05'),
        module06: document.getElementById('module06'),
        btnCalcularIncremento: document.getElementById('btnCalcularIncremento'),
        btnCalcularDisminucion: document.getElementById('btnCalcularDisminucion'),
        btnCalcularAmbas: document.getElementById('btnCalcularAmbas'),
        btnDividirTercios: document.getElementById('btnDividirTercios'),
        btnCalcularEscalonado: document.getElementById('btnCalcularEscalonado'),
        btnCalcularReduccion: document.getElementById('btnCalcularReduccion'),
        btnConvertirJornadas: document.getElementById('btnConvertirJornadas'),
        btnNuevoCalculo: document.getElementById('btnNuevoCalculo'),
        resultadoModulo01: document.getElementById('resultadoModulo01'),
        textoResultadoModulo01: document.getElementById('textoResultadoModulo01'),
        sistemaDeterminacion: document.getElementById('sistemaDeterminacion'),
        terciosMinDisplay: document.getElementById('terciosMinDisplay'),
        terciosMaxDisplay: document.getElementById('terciosMaxDisplay'),
        contenidoResultadoModulo03: document.getElementById('contenidoResultadoModulo03'),
        escalonadoMinDisplay: document.getElementById('escalonadoMinDisplay'),
        escalonadoMaxDisplay: document.getElementById('escalonadoMaxDisplay'),
        agravantesTipo: document.getElementById('agravantesTipo'),
        agravantesCaso: document.getElementById('agravantesCaso'),
        contenidoResultadoModulo04: document.getElementById('contenidoResultadoModulo04'),
        contenidoResultadoModulo05: document.getElementById('contenidoResultadoModulo05'),
        contenidoResultadoModulo06: document.getElementById('contenidoResultadoModulo06'),
        finalSummary: document.getElementById('finalSummary'),
        summaryContent: document.getElementById('summaryContent'),
        btnCopiarResumen: document.getElementById('btnCopiarResumen'),
        btnCompartirResumen: document.getElementById('btnCompartirResumen'),
    };

    // --- FUNCIONES DE UTILIDAD ---
    const toDays = (a, m, d) => (a * 360) + (m * 30) + d;
    const fromDays = (totalDays) => {
        if (isNaN(totalDays) || totalDays < 0) return { anos: 0, meses: 0, dias: 0 };
        const anos = Math.floor(totalDays / 360);
        const rem = totalDays % 360;
        const meses = Math.floor(rem / 30);
        const dias = Math.round(rem % 30);
        return { anos, meses, dias };
    };
    const formatYMD = (ymd) => `${ymd.anos} Años, ${ymd.meses} Meses, ${ymd.dias} Días`;
    const parseFactor = (str) => str.includes('/') ? str.split('/').map(Number).reduce((n, d) => n / d) : Number(str);
    const show = (el) => el.classList.remove('hidden');
    const hide = (el) => el.classList.add('hidden');

    const copyToClipboard = (text) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        document.body.removeChild(textarea);
    };

    // --- LÓGICA DE LA APLICACIÓN ---
    const resetStateAndUI = () => {
        state = { summary: [] };
        document.querySelectorAll('section:not(#module01), .submodule, .result-box, #btnNuevoCalculo').forEach(hide);
    };
    
    const setupTheme = () => {
        const applyTheme = (theme) => {
            document.body.className = theme === 'dark-mode' ? 'dark-mode' : '';
            ui.themeToggle.checked = theme === 'dark-mode';
        };
        const savedTheme = localStorage.getItem('theme') || 'light-mode';
        applyTheme(savedTheme);
        ui.themeToggle.addEventListener('change', () => {
            const newTheme = ui.themeToggle.checked ? 'dark-mode' : 'light-mode';
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    };

    const getInitialPenalty = () => {
        resetStateAndUI();
        const [minA, minM, minD] = [ui.minAnos, ui.minMeses, ui.minDias].map(el => parseInt(el.value) || 0);
        const [maxA, maxM, maxD] = [ui.maxAnos, ui.maxMeses, ui.maxDias].map(el => parseInt(el.value) || 0);
        let minDays = toDays(minA, minM, minD);
        let maxDays = toDays(maxA, maxM, maxD);
        if (minDays === 0 && maxDays > 0) minDays = 2;
        if (maxDays === 0 && minDays > 0) maxDays = toDays(35, 0, 0);
        if (minDays > maxDays) {
            alert("El extremo mínimo no puede ser mayor que el máximo.");
            return false;
        }
        state.initialMinDays = minDays;
        state.initialMaxDays = maxDays;
        updateSummary('Pena Abstracta Inicial', `De ${formatYMD(fromDays(minDays))} a ${formatYMD(fromDays(maxDays))}`);
        return true;
    };
    
    const displayModule1Result = (min, max, title) => {
        state.adjustedMinDays = min;
        state.adjustedMaxDays = max;
        const resultText = `De <strong>${formatYMD(fromDays(min))}</strong> a <strong>${formatYMD(fromDays(max))}</strong>.`;
        ui.textoResultadoModulo01.innerHTML = `<p>${resultText}</p>`;
        show(ui.resultadoModulo01);
        show(ui.module02);
        updateSummary(title, resultText);
    };

    const updateSummary = (title, text) => {
        state.summary = state.summary.filter(item => item.title !== title);
        state.summary.push({ title, text });
    };

    const renderSummary = () => {
        const summaryHtml = state.summary.map(item => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = item.text;
            const cleanText = tempDiv.textContent || tempDiv.innerText || "";
            return `<h4>${item.title}</h4><p>${cleanText.replace(/\n\s*\n/g, '\n').replace(/\n/g, '<br>')}</p>`;
        }).join('');
        ui.summaryContent.innerHTML = summaryHtml;
        show(ui.finalSummary);
        show(ui.btnNuevoCalculo);
        ui.finalSummary.scrollIntoView({ behavior: 'smooth' });
    };

    // --- MANEJADORES DE EVENTOS ---
    ui.circunstancias.addEventListener('change', () => {
        document.querySelectorAll('.submodule, .result-box, #module02, #module03, #module04, #module05, #module06, #finalSummary, #btnNuevoCalculo').forEach(hide);
        const selection = ui.circunstancias.value;
        if (selection === 'no') {
            if (!getInitialPenalty()) return;
            state.adjustedMinDays = state.initialMinDays;
            state.adjustedMaxDays = state.initialMaxDays;
            show(ui.module02);
        } else if (selection) {
            show(document.getElementById(`submodulo${selection.charAt(0).toUpperCase() + selection.slice(1)}`));
        }
    });

    ui.btnCalcularIncremento.addEventListener('click', () => {
        if (!getInitialPenalty()) return;
        const factors = Array.from(document.querySelectorAll('input[name="incrementoFactor"]:checked')).map(cb => parseFactor(cb.value));
        if (!factors.length) return alert("Seleccione al menos una circunstancia.");
        const results = factors.map(f => state.initialMaxDays + (state.initialMaxDays * f));
        displayModule1Result(state.initialMaxDays, Math.max(...results), 'Incremento sobre el máximo');
    });

    ui.btnCalcularDisminucion.addEventListener('click', () => {
        if (!getInitialPenalty()) return;
        const factors = Array.from(document.querySelectorAll('input[name="disminucionFactor"]:checked')).map(cb => parseFactor(cb.value));
        if (!factors.length) return alert("Seleccione al menos una circunstancia.");
        const results = factors.map(f => ({ min: state.initialMinDays * (1 - f), max: state.initialMaxDays * (1 - f) }));
        displayModule1Result(Math.min(...results.map(r => r.min)), Math.max(...results.map(r => r.max)), 'Disminución bajo el mínimo');
    });

    ui.btnCalcularAmbas.addEventListener('click', () => {
        if (!getInitialPenalty()) return;
        const incFactors = Array.from(document.querySelectorAll('input[name="incrementoFactorAmbas"]:checked')).map(cb => parseFactor(cb.value));
        if (!incFactors.length) return alert("Seleccione un incremento.");
        const dismFactors = Array.from(document.querySelectorAll('input[name="disminucionFactorAmbas"]:checked')).map(cb => parseFactor(cb.value));
        if (!dismFactors.length) return alert("Seleccione una disminución.");
        const intermediateMax = Math.max(...incFactors.map(f => state.initialMaxDays + (state.initialMaxDays * f)));
        const intermediateMin = state.initialMaxDays;
        const finalResults = dismFactors.map(f => ({ min: intermediateMin * (1 - f), max: intermediateMax * (1 - f) }));
        displayModule1Result(Math.min(...finalResults.map(r => r.min)), Math.max(...finalResults.map(r => r.max)), 'Incremento y Disminución');
    });

    ui.sistemaDeterminacion.addEventListener('change', () => {
        hide(ui.module03); hide(ui.module04);
        const selection = ui.sistemaDeterminacion.value;
        const minText = formatYMD(fromDays(state.adjustedMinDays));
        const maxText = formatYMD(fromDays(state.adjustedMaxDays));
        if (selection === 'tercios') {
            ui.terciosMinDisplay.textContent = minText;
            ui.terciosMaxDisplay.textContent = maxText;
            show(ui.module03);
        } else if (selection === 'escalonado') {
            ui.escalonadoMinDisplay.textContent = minText;
            ui.escalonadoMaxDisplay.textContent = maxText;
            show(ui.module04);
        }
    });

    ui.btnDividirTercios.addEventListener('click', () => {
        const range = state.adjustedMaxDays - state.adjustedMinDays;
        const tercio = range / 3;
        const limit1 = state.adjustedMinDays + tercio;
        const limit2 = limit1 + tercio;
        const content = `<p>Cada tercio equivale a: <strong>${formatYMD(fromDays(tercio))}</strong></p><p>Tercio inferior: De ${formatYMD(fromDays(state.adjustedMinDays))} a <strong>${formatYMD(fromDays(limit1))}</strong></p><p>Tercio medio: De ${formatYMD(fromDays(limit1))} a <strong>${formatYMD(fromDays(limit2))}</strong></p><p>Tercio superior: De ${formatYMD(fromDays(limit2))} a <strong>${formatYMD(fromDays(state.adjustedMaxDays))}</strong></p>`;
        ui.contenidoResultadoModulo03.innerHTML = content;
        show(document.getElementById('resultadoModulo03'));
        updateSummary('Sistema de Tercios', content);
        renderSummary();
    });

    ui.btnCalcularEscalonado.addEventListener('click', () => {
        const totalAgravantes = parseInt(ui.agravantesTipo.value);
        const casoAgravantes = parseInt(ui.agravantesCaso.value);
        if (isNaN(totalAgravantes) || totalAgravantes <= 0 || isNaN(casoAgravantes) || casoAgravantes < 0 || casoAgravantes > totalAgravantes) return alert("Datos de agravantes inválidos.");
        const range = state.adjustedMaxDays - state.adjustedMinDays;
        const valorAgravante = range / totalAgravantes;
        const incremento = valorAgravante * casoAgravantes;
        const penaConcreta = state.adjustedMinDays + incremento;
        state.basePenaltyForReduction = penaConcreta;
        state.finalPenaltyDays = penaConcreta;
        const content = `<p>Cada agravante equivale a: <strong>${formatYMD(fromDays(valorAgravante))}</strong></p><p>Incremento por ${casoAgravantes} agravante(s): <strong>${formatYMD(fromDays(incremento))}</strong></p><p>Pena concreta: <strong>${formatYMD(fromDays(penaConcreta))}</strong></p>`;
        ui.contenidoResultadoModulo04.innerHTML = content;
        show(document.getElementById('resultadoModulo04'));
        show(ui.module05); show(ui.module06);
        updateSummary('Sistema Escalonado', content);
        renderSummary();
    });
    
    ui.btnCalcularReduccion.addEventListener('click', () => {
        const factors = Array.from(document.querySelectorAll('input[name="reduccionPena"]:checked')).map(cb => parseFactor(cb.value));
        let penaFinal = state.basePenaltyForReduction;
        let content = `<p>No se aplicaron reducciones.</p>`;
        if (factors.length > 0) {
            penaFinal = state.basePenaltyForReduction * (1 - Math.max(...factors));
            content = `<p>Pena con reducción: <strong>${formatYMD(fromDays(penaFinal))}</strong></p>`;
        }
        state.finalPenaltyDays = penaFinal;
        ui.contenidoResultadoModulo05.innerHTML = content;
        show(document.getElementById('resultadoModulo05'));
        updateSummary('Reducción sobre Pena Concreta', content);
        renderSummary();
    });

    ui.btnConvertirJornadas.addEventListener('click', () => {
        if (state.finalPenaltyDays === undefined) return;
        let content = '';
        if (state.initialMaxDays > toDays(3, 0, 0)) {
            content = `<p>No es posible convertir. El marco abstracto supera los 3 años.</p>`;
        } else {
            const jornadas = Math.round(state.finalPenaltyDays / 7);
            const finalJornadas = Math.max(10, Math.min(jornadas, 156));
            content = `<p>Resultado: <strong>${finalJornadas} jornadas</strong></p>`;
        }
        ui.contenidoResultadoModulo06.innerHTML = content;
        show(document.getElementById('resultadoModulo06'));
        updateSummary('Conversión a Jornadas', content);
        renderSummary();
    });

    // --- MANEJADORES DE BOTONES DE ACCIÓN UNIFICADOS ---
    const getTextForClipboard = (element) => {
        if (!element) return '';
        const lines = [];
        const nodes = element.querySelectorAll('h4, p');
        if (nodes.length > 0) {
            nodes.forEach(node => {
                lines.push(node.innerText.trim());
            });
        } else {
            lines.push(element.innerText.trim());
        }
        return lines.join('\n');
    };

    const handleCopyClick = (e) => {
        const currentButton = e.currentTarget;
        let contentToCopy = '';
        let targetElement;
        if (currentButton.id === 'btnCopiarResumen') {
            targetElement = ui.summaryContent;
        } else {
            const targetId = currentButton.dataset.target;
            targetElement = document.getElementById(targetId);
        }
        
        if (targetElement) {
            contentToCopy = getTextForClipboard(targetElement);
        }

        if (contentToCopy) {
            copyToClipboard(contentToCopy);
            const originalText = currentButton.textContent;
            currentButton.textContent = '¡Copiado!';
            setTimeout(() => { if (currentButton) currentButton.textContent = originalText; }, 1500);
        }
    };

    const handleWhatsAppClick = (e) => {
        const currentButton = e.currentTarget;
        let contentToShare = '';
        let targetElement;
        if (currentButton.id === 'btnCompartirResumen') {
            targetElement = ui.summaryContent;
        } else {
            const targetId = currentButton.dataset.target;
            targetElement = document.getElementById(targetId);
        }
        if(targetElement){
            contentToShare = getTextForClipboard(targetElement);
        }
        if (contentToShare) {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(contentToShare)}`, '_blank');
        }
    };

    document.querySelectorAll('.copy-button, .copy-button-yellow').forEach(button => button.addEventListener('click', handleCopyClick));
    document.querySelectorAll('.whatsapp-button').forEach(button => button.addEventListener('click', handleWhatsAppClick));
    
    ui.btnNuevoCalculo.addEventListener('click', () => window.location.reload());

    // --- INICIALIZACIÓN ---
    setupTheme();
});
