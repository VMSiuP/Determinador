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

    const parseInitialPenalty = () => {
        state.summary = []; // Reinicia el resumen para un nuevo cálculo
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
    
    const displayModule1Result = (min, max, title, submoduleElement, customSummaryText) => {
        state.adjustedMinDays = min;
        state.adjustedMaxDays = max;
        const resultText = `De <strong>${formatYMD(fromDays(min))}</strong> a <strong>${formatYMD(fromDays(max))}</strong>.`;
        ui.textoResultadoModulo01.innerHTML = `<p>${resultText}</p>`;
        
        show(ui.resultadoModulo01);
        show(ui.module02);
        
        const summaryToUse = customSummaryText || resultText;
        updateSummary(title, summaryToUse);
        
        if (submoduleElement) {
            submoduleElement.classList.add('disabled-visuals');
            submoduleElement.querySelectorAll('input, button').forEach(el => el.disabled = true);
        }
        
        ui.resultadoModulo01.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const updateSummary = (title, text) => {
        state.summary = state.summary.filter(item => item.title !== title);
        state.summary.push({ title, text });
    };

    const renderSummary = () => {
        const summaryHtml = state.summary.map(item => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = item.text; // Usamos innerHTML para interpretar <br>
            // No limpiamos el texto aquí para mantener el formato en la visualización
            return `<h4>${item.title}</h4><p>${tempDiv.innerHTML}</p>`;
        }).join('');
        ui.summaryContent.innerHTML = summaryHtml;
        show(ui.finalSummary);
        show(ui.btnNuevoCalculo);
    };

    // --- MANEJADORES DE EVENTOS ---
    ui.circunstancias.addEventListener('change', () => {
        document.querySelectorAll('.submodule, .result-box, #module02, #module03, #module04, #module05, #module06, #finalSummary, #btnNuevoCalculo').forEach(hide);
        document.querySelectorAll('.submodule').forEach(sub => {
             sub.classList.remove('disabled-visuals');
             sub.querySelectorAll('input, button').forEach(el => el.disabled = false);
        });
        
        const selection = ui.circunstancias.value;
        if (selection === 'no') {
            if (!parseInitialPenalty()) return;
            state.adjustedMinDays = state.initialMinDays;
            state.adjustedMaxDays = state.initialMaxDays;
            show(ui.module02);
        } else if (selection) {
            show(document.getElementById(`submodulo${selection.charAt(0).toUpperCase() + selection.slice(1)}`));
        }
    });

    ui.btnCalcularIncremento.addEventListener('click', () => {
        if (!parseInitialPenalty()) return;
        const checkedBoxes = Array.from(document.querySelectorAll('input[name="incrementoFactor"]:checked'));
        if (!checkedBoxes.length) return alert("Seleccione al menos una circunstancia.");
        const factors = checkedBoxes.map(cb => parseFactor(cb.value));
        const labels = checkedBoxes.map(cb => cb.parentElement.textContent.trim());
        const results = factors.map(f => state.initialMaxDays + (state.initialMaxDays * f));
        const finalMin = state.initialMaxDays;
        const finalMax = Math.max(...results);
        let summaryText = `Circunstancias seleccionadas:<br>- ${labels.join('<br>- ')}`;
        summaryText += `<br><b>Nuevo Marco Penal: De ${formatYMD(fromDays(finalMin))} a ${formatYMD(fromDays(finalMax))}</b>`;
        displayModule1Result(finalMin, finalMax, 'Incremento sobre el máximo', ui.submoduloIncremento, summaryText);
    });

    ui.btnCalcularDisminucion.addEventListener('click', () => {
        if (!parseInitialPenalty()) return;
        const checkedBoxes = Array.from(document.querySelectorAll('input[name="disminucionFactor"]:checked'));
        if (!checkedBoxes.length) return alert("Seleccione al menos una circunstancia.");
        const factors = checkedBoxes.map(cb => parseFactor(cb.value));
        const labels = checkedBoxes.map(cb => cb.parentElement.textContent.trim());
        const results = factors.map(f => ({ min: state.initialMinDays * (1 - f), max: state.initialMaxDays * (1 - f) }));
        const finalMin = Math.min(...results.map(r => r.min));
        const finalMax = Math.max(...results.map(r => r.max));
        let summaryText = `Circunstancias seleccionadas:<br>- ${labels.join('<br>- ')}`;
        summaryText += `<br><b>Nuevo Marco Penal: De ${formatYMD(fromDays(finalMin))} a ${formatYMD(fromDays(finalMax))}</b>`;
        displayModule1Result(finalMin, finalMax, 'Disminución bajo el mínimo', ui.submoduloDisminucion, summaryText);
    });

    ui.btnCalcularAmbas.addEventListener('click', () => {
        if (!parseInitialPenalty()) return;
        const checkedIncBoxes = Array.from(document.querySelectorAll('input[name="incrementoFactorAmbas"]:checked'));
        if (!checkedIncBoxes.length) return alert("Seleccione un incremento.");
        const checkedDismBoxes = Array.from(document.querySelectorAll('input[name="disminucionFactorAmbas"]:checked'));
        if (!checkedDismBoxes.length) return alert("Seleccione una disminución.");

        const incFactors = checkedIncBoxes.map(cb => parseFactor(cb.value));
        const incLabels = checkedIncBoxes.map(cb => cb.parentElement.textContent.trim());
        const dismFactors = checkedDismBoxes.map(cb => parseFactor(cb.value));
        const dismLabels = checkedDismBoxes.map(cb => cb.parentElement.textContent.trim());

        const intermediateMax = Math.max(...incFactors.map(f => state.initialMaxDays + (state.initialMaxDays * f)));
        const intermediateMin = state.initialMaxDays;
        const finalResults = dismFactors.map(f => ({ min: intermediateMin * (1 - f), max: intermediateMax * (1 - f) }));
        const finalMin = Math.min(...finalResults.map(r => r.min));
        const finalMax = Math.max(...finalResults.map(r => r.max));
        
        let summaryText = `<u>Paso 1: Incremento</u><br>Circunstancias seleccionadas: ${incLabels.join(', ')}`;
        summaryText += `<br>Marco Intermedio: De ${formatYMD(fromDays(intermediateMin))} a ${formatYMD(fromDays(intermediateMax))}`;
        summaryText += `<br><u>Paso 2: Disminución</u><br>Circunstancias seleccionadas: ${dismLabels.join(', ')}`;
        summaryText += `<br><b>Nuevo Marco Penal Final: De ${formatYMD(fromDays(finalMin))} a ${formatYMD(fromDays(finalMax))}</b>`;
        displayModule1Result(finalMin, finalMax, 'Incremento y Disminución', ui.submoduloAmbas, summaryText);
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
        const resultElement = document.getElementById('resultadoModulo03');
        ui.contenidoResultadoModulo03.innerHTML = content;
        show(resultElement);
        updateSummary('Sistema de Tercios', content);
        renderSummary();
        resultElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

        const contentForDisplay = `<p>Pena concreta: <strong>${formatYMD(fromDays(penaConcreta))}</strong></p>`;
        const contentForSummary = `Agravantes del tipo penal: ${totalAgravantes}<br>Agravantes del caso concreto: ${casoAgravantes}<br>Cada agravante equivale a: ${formatYMD(fromDays(valorAgravante))}<br>Incremento por ${casoAgravantes} agravante(s): ${formatYMD(fromDays(incremento))}<br><b>Pena concreta: ${formatYMD(fromDays(penaConcreta))}</b>`;
        
        const resultElement = document.getElementById('resultadoModulo04');
        ui.contenidoResultadoModulo04.innerHTML = contentForDisplay;
        show(resultElement);
        show(ui.module05); show(ui.module06);
        updateSummary('Sistema Escalonado', contentForSummary);
        renderSummary();
        resultElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    
    ui.btnCalcularReduccion.addEventListener('click', () => {
        const checkedBoxes = Array.from(document.querySelectorAll('input[name="reduccionPena"]:checked'));
        const factors = checkedBoxes.map(cb => parseFactor(cb.value));
        const labels = checkedBoxes.map(cb => cb.parentElement.textContent.trim());
        
        let penaFinal = state.basePenaltyForReduction;
        let contentForDisplay = `<p>No se aplicaron reducciones.</p>`;
        let contentForSummary = `No se aplicaron reducciones.`;

        if (factors.length > 0) {
            const maxFactor = Math.max(...factors);
            const selectedLabel = labels[factors.indexOf(maxFactor)];
            const reduccion = state.basePenaltyForReduction * maxFactor;
            penaFinal = state.basePenaltyForReduction - reduccion;
            
            contentForDisplay = `<p>Pena final con reducción: <strong>${formatYMD(fromDays(penaFinal))}</strong></p>`;
            contentForSummary = `Reducción seleccionada: ${selectedLabel}<br>Monto de la reducción: ${formatYMD(fromDays(reduccion))}<br><b>Pena concreta final con reducción: ${formatYMD(fromDays(penaFinal))}</b>`;
        }
        
        state.finalPenaltyDays = penaFinal;
        const resultElement = document.getElementById('resultadoModulo05');
        ui.contenidoResultadoModulo05.innerHTML = contentForDisplay;
        show(resultElement);
        updateSummary('Reducción sobre Pena Concreta', contentForSummary);
        renderSummary();
        resultElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    ui.btnConvertirJornadas.addEventListener('click', () => {
        if (state.finalPenaltyDays === undefined) return;
        let content = '';
        if (state.initialMaxDays > toDays(4, 0, 0)) {
            content = `<p>No es posible convertir. El marco abstracto supera los 4 años.</p>`;
        } else {
            const jornadas = Math.round(state.finalPenaltyDays / 7);
            const finalJornadas = Math.max(10, Math.min(jornadas, 156));
            content = `<p>Resultado: <strong>${finalJornadas} jornadas</strong></p>`;
        }
        const resultElement = document.getElementById('resultadoModulo06');
        ui.contenidoResultadoModulo06.innerHTML = content;
        show(resultElement);
        updateSummary('Conversión a Jornadas', content);
        renderSummary();
        resultElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // --- MANEJADORES DE BOTONES DE ACCIÓN UNIFICADOS ---
    const getTextForClipboard = (element) => {
        if (!element) return '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = element.innerHTML;
        // Reemplaza <br> con saltos de línea y <h4> con un formato de título
        tempDiv.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
        tempDiv.querySelectorAll('h4').forEach(h4 => h4.replaceWith(`\n--- ${h4.textContent.toUpperCase()} ---\n`));
        // Limpia cualquier HTML restante (como <strong>) para obtener solo texto plano
        return tempDiv.textContent || tempDiv.innerText;
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
            contentToCopy = getTextForClipboard(targetElement).trim();
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
            contentToShare = getTextForClipboard(targetElement).trim();
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

