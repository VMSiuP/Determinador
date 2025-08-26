document.addEventListener('DOMContentLoaded', () => {
    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => console.log('Service Worker registered with scope:', registration.scope))
            .catch(error => console.log('Service Worker registration failed:', error));
    }

    // --- State Management ---
    let appState = {};

    const resetState = () => {
        appState = {
            initialMinDays: 0,
            initialMaxDays: 0,
            module1ResultMinDays: null,
            module1ResultMaxDays: null,
            finalPenaltyDays: null,
            summary: []
        };
    };
    
    // --- DOM Elements ---
    const dom = {
        themeToggle: document.getElementById('themeToggle'),
        body: document.body,
        
        // Module 1
        minAnos: document.getElementById('minAnos'),
        minMeses: document.getElementById('minMeses'),
        minDias: document.getElementById('minDias'),
        maxAnos: document.getElementById('maxAnos'),
        maxMeses: document.getElementById('maxMeses'),
        maxDias: document.getElementById('maxDias'),
        circunstancias: document.getElementById('circunstancias'),
        submoduloIncremento: document.getElementById('submoduloIncremento'),
        incrementoFactor: document.getElementById('incrementoFactor'),
        submoduloDisminucion: document.getElementById('submoduloDisminucion'),
        btnCalcularDisminucion: document.getElementById('btnCalcularDisminucion'),
        submoduloAmbas: document.getElementById('submoduloAmbas'),
        incrementoFactorAmbas: document.getElementById('incrementoFactorAmbas'),
        btnCalcularAmbas: document.getElementById('btnCalcularAmbas'),
        resultadoModulo01: document.getElementById('resultadoModulo01'),
        textoResultadoModulo01: document.getElementById('textoResultadoModulo01'),
        
        // Module 2
        module02: document.getElementById('module02'),
        sistemaDeterminacion: document.getElementById('sistemaDeterminacion'),

        // Module 3
        module03: document.getElementById('module03'),
        terciosMinDisplay: document.getElementById('terciosMinDisplay'),
        terciosMaxDisplay: document.getElementById('terciosMaxDisplay'),
        btnDividirTercios: document.getElementById('btnDividirTercios'),
        resultadoModulo03: document.getElementById('resultadoModulo03'),
        equivalenciaTercio: document.getElementById('equivalenciaTercio'),
        tercioInferior: document.getElementById('tercioInferior'),
        tercioMedio: document.getElementById('tercioMedio'),
        tercioSuperior: document.getElementById('tercioSuperior'),

        // Module 4
        module04: document.getElementById('module04'),
        escalonadoMinDisplay: document.getElementById('escalonadoMinDisplay'),
        escalonadoMaxDisplay: document.getElementById('escalonadoMaxDisplay'),
        agravantesTipo: document.getElementById('agravantesTipo'),
        agravantesCaso: document.getElementById('agravantesCaso'),
        btnCalcularEscalonado: document.getElementById('btnCalcularEscalonado'),
        resultadoModulo04: document.getElementById('resultadoModulo04'),
        equivalenciaAgravante: document.getElementById('equivalenciaAgravante'),
        incrementoAgravantes: document.getElementById('incrementoAgravantes'),
        resultadoFinalEscalonado: document.getElementById('resultadoFinalEscalonado'),

        // Module 5
        module05: document.getElementById('module05'),
        btnTerminacion: document.getElementById('btnTerminacion'),
        btnConclusion: document.getElementById('btnConclusion'),
        resultadoModulo05: document.getElementById('resultadoModulo05'),
        resultadoFinalProcesal: document.getElementById('resultadoFinalProcesal'),

        // Module 6
        module06: document.getElementById('module06'),
        btnConvertirJornadas: document.getElementById('btnConvertirJornadas'),
        resultadoModulo06: document.getElementById('resultadoModulo06'),
        resultadoJornadas: document.getElementById('resultadoJornadas'),

        // Final
        finalSummary: document.getElementById('finalSummary'),
        summaryContent: document.getElementById('summaryContent'),
        btnCopiarResumen: document.getElementById('btnCopiarResumen'),
        btnCompartirResumen: document.getElementById('btnCompartirResumen'),
        btnNuevoCalculo: document.getElementById('btnNuevoCalculo'),
    };

    // --- Utility Functions ---
    const parseFraction = (str) => {
        const [num, den] = str.split('/').map(Number);
        return num / den;
    };

    const toDays = (anos, meses, dias) => (anos * 360) + (meses * 30) + dias;
    
    const fromDays = (totalDays) => {
        if (totalDays < 0) totalDays = 0;
        const anos = Math.floor(totalDays / 360);
        const remainder = totalDays % 360;
        const meses = Math.floor(remainder / 30);
        const dias = Math.round(remainder % 30);
        return { anos, meses, dias };
    };

    const formatYMD = ({ anos, meses, dias }) => `${anos} Años, ${meses} Meses, ${dias} Días`;

    const show = (element) => element.classList.remove('hidden');
    const hide = (element) => element.classList.add('hidden');

    const updateSummary = (title, text) => {
        appState.summary.push({ title, text });
    };

    const renderSummary = () => {
        dom.summaryContent.innerHTML = appState.summary
            .map(item => `<h4>${item.title}</h4><p>${item.text}</p>`)
            .join('');
        show(dom.finalSummary);
        show(dom.btnNuevoCalculo);
    };

    // --- Theme Switcher Logic ---
    dom.themeToggle.addEventListener('change', () => {
        dom.body.classList.toggle('dark-mode');
    });

    // --- Module 1 Logic ---
    const getInitialPenalty = () => {
        const minAnos = parseInt(dom.minAnos.value) || 0;
        const minMeses = parseInt(dom.minMeses.value) || 0;
        const minDias = parseInt(dom.minDias.value) || 0;
        
        let initialMin = toDays(minAnos, minMeses, minDias);
        if (initialMin === 0) initialMin = 2; // Mínimo legal

        const maxAnos = parseInt(dom.maxAnos.value) || 0;
        const maxMeses = parseInt(dom.maxMeses.value) || 0;
        const maxDias = parseInt(dom.maxDias.value) || 0;

        let initialMax = toDays(maxAnos, maxMeses, maxDias);
        if (initialMax === 0) initialMax = toDays(35, 0, 0); // Máximo legal

        appState.initialMinDays = initialMin;
        appState.initialMaxDays = initialMax;

        const penaInicialStr = `De ${formatYMD(fromDays(initialMin))} a ${formatYMD(fromDays(initialMax))}`;
        updateSummary('Pena Abstracta Inicial', penaInicialStr);
    };
    
    dom.circunstancias.addEventListener('change', (e) => {
        const selection = e.target.value;
        hide(dom.submoduloIncremento);
        hide(dom.submoduloDisminucion);
        hide(dom.submoduloAmbas);
        hide(dom.resultadoModulo01);
        hide(dom.module02);

        if (selection === 'no') {
            getInitialPenalty();
            appState.module1ResultMinDays = appState.initialMinDays;
            appState.module1ResultMaxDays = appState.initialMaxDays;
            show(dom.module02);
        } else if (selection === 'incremento') {
            show(dom.submoduloIncremento);
        } else if (selection === 'disminucion') {
            show(dom.submoduloDisminucion);
        } else if (selection === 'ambas') {
            show(dom.submoduloAmbas);
        }
    });

    dom.incrementoFactor.addEventListener('change', () => {
        getInitialPenalty();
        const factor = parseFraction(dom.incrementoFactor.value);
        const incremento = appState.initialMaxDays * factor;
        const nuevoMin = appState.initialMaxDays;
        const nuevoMax = appState.initialMaxDays + incremento;

        appState.module1ResultMinDays = nuevoMin;
        appState.module1ResultMaxDays = nuevoMax;
        
        const resultText = `De <strong>${formatYMD(fromDays(nuevoMin))}</strong> a <strong>${formatYMD(fromDays(nuevoMax))}</strong>.`;
        dom.textoResultadoModulo01.innerHTML = resultText;
        show(dom.resultadoModulo01);
        show(dom.module02);

        updateSummary(`Incremento (${dom.incrementoFactor.value})`, resultText);
    });

    dom.btnCalcularDisminucion.addEventListener('click', () => {
        getInitialPenalty();
        const selectedFactors = Array.from(document.querySelectorAll('input[name="disminucionFactor"]:checked'))
            .map(cb => parseFraction(cb.value));

        if (selectedFactors.length === 0) return;

        let resultados = [];
        selectedFactors.forEach(factor => {
            const nuevoMin = appState.initialMinDays * (1 - factor);
            const nuevoMax = appState.initialMaxDays * (1 - factor);
            resultados.push({min: nuevoMin, max: nuevoMax});
        });

        const minFinal = Math.min(...resultados.map(r => r.min));
        const maxFinal = Math.max(...resultados.map(r => r.max));

        appState.module1ResultMinDays = minFinal;
        appState.module1ResultMaxDays = maxFinal;

        const resultText = `De <strong>${formatYMD(fromDays(minFinal))}</strong> a <strong>${formatYMD(fromDays(maxFinal))}</strong>.`;
        dom.textoResultadoModulo01.innerHTML = resultText;
        show(dom.resultadoModulo01);
        show(dom.module02);
        const factorsStr = Array.from(document.querySelectorAll('input[name="disminucionFactor"]:checked')).map(cb => cb.value).join(', ');
        updateSummary(`Disminución (${factorsStr})`, resultText);
    });

    dom.btnCalcularAmbas.addEventListener('click', () => {
        getInitialPenalty();
        const incrementoFactor = parseFraction(dom.incrementoFactorAmbas.value);
        if (!incrementoFactor) return;

        const selectedDisminucionFactors = Array.from(document.querySelectorAll('input[name="disminucionFactorAmbas"]:checked'))
            .map(cb => parseFraction(cb.value));
        if (selectedDisminucionFactors.length === 0) return;

        // Step 1: Increment
        const incremento = appState.initialMaxDays * incrementoFactor;
        const penaIntermediaMin = appState.initialMaxDays;
        const penaIntermediaMax = appState.initialMaxDays + incremento;
        updateSummary(`Incremento Intermedio (${dom.incrementoFactorAmbas.value})`, `De ${formatYMD(fromDays(penaIntermediaMin))} a ${formatYMD(fromDays(penaIntermediaMax))}`);

        // Step 2: Decrease on the new range
        let resultados = [];
        selectedDisminucionFactors.forEach(factor => {
            const nuevoMin = penaIntermediaMin * (1 - factor);
            const nuevoMax = penaIntermediaMax * (1 - factor);
            resultados.push({min: nuevoMin, max: nuevoMax});
        });

        const minFinal = Math.min(...resultados.map(r => r.min));
        const maxFinal = Math.max(...resultados.map(r => r.max));

        appState.module1ResultMinDays = minFinal;
        appState.module1ResultMaxDays = maxFinal;

        const resultText = `De <strong>${formatYMD(fromDays(minFinal))}</strong> a <strong>${formatYMD(fromDays(maxFinal))}</strong>.`;
        dom.textoResultadoModulo01.innerHTML = resultText;
        show(dom.resultadoModulo01);
        show(dom.module02);

        const factorsStr = Array.from(document.querySelectorAll('input[name="disminucionFactorAmbas"]:checked')).map(cb => cb.value).join(', ');
        updateSummary(`Disminución final (${factorsStr})`, resultText);
    });

    // --- Module 2 Logic ---
    dom.sistemaDeterminacion.addEventListener('change', (e) => {
        const selection = e.target.value;
        hide(dom.module03);
        hide(dom.module04);

        if (selection === 'tercios') {
            dom.terciosMinDisplay.textContent = formatYMD(fromDays(appState.module1ResultMinDays));
            dom.terciosMaxDisplay.textContent = formatYMD(fromDays(appState.module1ResultMaxDays));
            show(dom.module03);
        } else if (selection === 'escalonado') {
            dom.escalonadoMinDisplay.textContent = formatYMD(fromDays(appState.module1ResultMinDays));
            dom.escalonadoMaxDisplay.textContent = formatYMD(fromDays(appState.module1ResultMaxDays));
            show(dom.module04);
        }
    });

    // --- Module 3 Logic ---
    dom.btnDividirTercios.addEventListener('click', () => {
        const min = appState.module1ResultMinDays;
        const max = appState.module1ResultMaxDays;
        const rangoTotal = max - min;
        const tercio = rangoTotal / 3;

        const limite1 = min + tercio;
        const limite2 = min + 2 * tercio;

        dom.equivalenciaTercio.innerHTML = `Cada tercio equivale a: <strong>${formatYMD(fromDays(tercio))}</strong>`;
        dom.tercioInferior.innerHTML = `Tercio inferior: De ${formatYMD(fromDays(min))} a <strong>${formatYMD(fromDays(limite1))}</strong>`;
        dom.tercioMedio.innerHTML = `Tercio medio: De ${formatYMD(fromDays(limite1))} a <strong>${formatYMD(fromDays(limite2))}</strong>`;
        dom.tercioSuperior.innerHTML = `Tercio superior: De ${formatYMD(fromDays(limite2))} a <strong>${formatYMD(fromDays(max))}</strong>`;
        show(dom.resultadoModulo03);
        
        updateSummary('Sistema de Tercios', dom.resultadoModulo03.innerText);
        renderSummary();
    });

    // --- Module 4 Logic ---
    dom.btnCalcularEscalonado.addEventListener('click', () => {
        const min = appState.module1ResultMinDays;
        const max = appState.module1ResultMaxDays;
        const totalAgravantesTipo = parseInt(dom.agravantesTipo.value);
        const agravantesCaso = parseInt(dom.agravantesCaso.value);

        if (!totalAgravantesTipo || agravantesCaso === null) return;

        const rangoTotal = max - min;
        const valorPorAgravante = rangoTotal / totalAgravantesTipo;
        const incremento = valorPorAgravante * agravantesCaso;
        const penaConcreta = min + incremento;
        appState.finalPenaltyDays = penaConcreta;

        dom.equivalenciaAgravante.innerHTML = `Cada agravante equivale a: <strong>${formatYMD(fromDays(valorPorAgravante))}</strong>`;
        dom.incrementoAgravantes.innerHTML = `Incremento por ${agravantesCaso} agravante(s): <strong>${formatYMD(fromDays(incremento))}</strong>`;
        dom.resultadoFinalEscalonado.innerHTML = `Resultado: <strong>${formatYMD(fromDays(penaConcreta))}</strong>`;
        
        show(dom.resultadoModulo04);
        show(dom.module05); // Show next module
        show(dom.module06);

        updateSummary('Sistema Escalonado', dom.resultadoModulo04.innerText);
        renderSummary(); // Partial summary
    });

    // --- Module 5 Logic ---
    const calcularReduccionProcesal = (factor, tipo) => {
        if (!appState.finalPenaltyDays) return;
        const penaReducida = appState.finalPenaltyDays * (1 - factor);
        dom.resultadoFinalProcesal.innerHTML = `Resultado (${tipo}): <strong>${formatYMD(fromDays(penaReducida))}</strong>`;
        show(dom.resultadoModulo05);

        appState.finalPenaltyDays = penaReducida; // Update final penalty
        updateSummary(`Reducción Procesal (${tipo})`, dom.resultadoFinalProcesal.innerText);
        renderSummary();
    };

    dom.btnTerminacion.addEventListener('click', () => calcularReduccionProcesal(1/6, 'Terminación Anticipada'));
    dom.btnConclusion.addEventListener('click', () => calcularReduccionProcesal(1/7, 'Conclusión Anticipada'));

    // --- Module 6 Logic ---
    dom.btnConvertirJornadas.addEventListener('click', () => {
        if (!appState.finalPenaltyDays) return;

        const maxPenaParaConvertir = (3 * 365); // 3 años en días (365 por especificación)
        if (appState.module1ResultMaxDays > maxPenaParaConvertir) {
             dom.resultadoJornadas.textContent = 'No es posible convertir la pena, pues supera las 156 jornadas (art. 34.5 CP).';
        } else {
            const jornadas = Math.round(appState.finalPenaltyDays / 7);
            let resultadoTexto = `${jornadas} jornadas`;
            if (jornadas < 10) resultadoTexto = '10 jornadas (mínimo legal)';
            if (jornadas > 156) resultadoTexto = '156 jornadas (máximo legal)';
            dom.resultadoJornadas.textContent = resultadoTexto;
        }
        show(dom.resultadoModulo06);

        updateSummary('Conversión a Jornadas', dom.resultadoJornadas.innerText);
        renderSummary();
    });

    // --- Actions (Copy/Share/Reset) ---
    document.querySelectorAll('.copy-button, .copy-button-yellow').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const content = document.getElementById(targetId).innerText;
            navigator.clipboard.writeText(content).then(() => alert('Resultado copiado.'));
        });
    });

    document.querySelectorAll('.whatsapp-button').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const content = document.getElementById(targetId).innerText;
            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(content)}`;
            window.open(whatsappUrl, '_blank');
        });
    });

    dom.btnCopiarResumen.addEventListener('click', () => {
        const content = dom.summaryContent.innerText;
        navigator.clipboard.writeText(content).then(() => alert('Resumen copiado.'));
    });

    dom.btnCompartirResumen.addEventListener('click', () => {
        const content = dom.summaryContent.innerText;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(content)}`;
        window.open(whatsappUrl, '_blank');
    });

    dom.btnNuevoCalculo.addEventListener('click', () => {
        window.location.reload(); // Easiest way to reset everything
    });

    // --- Initial setup ---
    resetState();
});