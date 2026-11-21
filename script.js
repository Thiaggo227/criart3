document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================
    // VARIÁVEIS DE CONFIGURAÇÃO DO SUPABASE
    // ==========================================================
    const SUPABASE_URL = 'https://dfqqmnrpnpficpcfeunn.supabase.co/';
    const SUPABASE_ANON_KEY = 'sb_publishable_IZvKqoSAxKTIXtggpf_nYQ_zzZjk2cL';

    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let tacasGlobais = [];
    let medalhasMetalGlobais = [];
    let medalhasAcrilicoGlobais = [];
    let trofeusMdfGlobais = [];
    let placasGlobais = [];

    // Formata o texto da coluna 'observacao' para que cada tamanho/preço fique bem alinhado
    function formatarObservacaoPreco(texto) {
        if (!texto) return '';
        return texto
            .replace(/(R\$\s*\d+[.,]\d{2})\s+(?=[A-Z0-9]+\s*-)/g, '$1\n')
            .trim();
    }

    // ==========================================================
    // 1. CONTROLE DO CARROSSEL 3D E FILTROS DE MEDALHAS
    // ==========================================================
    let currentIndex3DMedalhas = 0;

    function atualizarExibicaoMedalhas() {
        const gridMedalhas = document.getElementById('gridMedalhas');
        if (!gridMedalhas) return;

        const botaoAtivo = document.querySelector('.btn-filtro-medalha.ativa');
        const categoriaSelecionada = botaoAtivo ? botaoAtivo.getAttribute('data-categoria') : 'metal';

        const todosItens = Array.from(gridMedalhas.querySelectorAll('.carrossel-3d-item'));

        const itensFiltrados = todosItens.filter(item => {
            const catItem = item.getAttribute('data-categoria');
            const deveExibir = (catItem === categoriaSelecionada);
            item.style.display = deveExibir ? 'flex' : 'none';
            return deveExibir;
        });

        currentIndex3DMedalhas = 0;
        atualizarPosicoes3D(itensFiltrados, currentIndex3DMedalhas, (val) => { currentIndex3DMedalhas = val; }, 'dots3D');
        atualizarDots3D(itensFiltrados, currentIndex3DMedalhas, 'dots3D', (idx) => {
            currentIndex3DMedalhas = idx;
            atualizarPosicoes3D(itensFiltrados, currentIndex3DMedalhas, (val) => { currentIndex3DMedalhas = val; }, 'dots3D');
            atualizarDots3D(itensFiltrados, currentIndex3DMedalhas, 'dots3D');
        });
    }

    function atualizarPosicoes3D(itensVisiveis, currentIndex) {
        const total = itensVisiveis.length;
        if (total === 0) return;

        itensVisiveis.forEach((item, index) => {
            const offset = (index - currentIndex + total) % total;

            let translateX = 0;
            let translateZ = 0;
            let scale = 1;
            let opacity = 1;
            let zIndex = 1;

            if (offset === 0) {
                translateX = 0;
                translateZ = 120;
                scale = 1.08;
                opacity = 1;
                zIndex = 10;
                item.style.pointerEvents = 'auto';
                item.classList.add('is-center');
            } else if (offset === 1 || offset === total - 1) {
                const direction = offset === 1 ? 1 : -1;
                translateX = direction * 240;
                translateZ = 0;
                scale = 0.85;
                opacity = 0.7;
                zIndex = 5;
                item.style.pointerEvents = 'auto';
                item.classList.remove('is-center');
            } else {
                const direction = offset > total / 2 ? -1 : 1;
                translateX = direction * 420;
                translateZ = -150;
                scale = 0.65;
                opacity = 0;
                zIndex = 1;
                item.style.pointerEvents = 'none';
                item.classList.remove('is-center');
            }

            item.style.transform = `translateX(${translateX}px) translateZ(${translateZ}px) scale(${scale})`;
            item.style.opacity = opacity;
            item.style.zIndex = zIndex;
        });
    }

    function atualizarDots3D(itensVisiveis, currentIndex, dotsContainerId, clickCallback) {
        const dotsContainer = document.getElementById(dotsContainerId);
        if (!dotsContainer) return;

        dotsContainer.innerHTML = '';
        itensVisiveis.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.classList.add('carrossel-3d-dot');
            if (i === currentIndex) dot.classList.add('active');
            if (clickCallback) {
                dot.addEventListener('click', () => clickCallback(i));
            }
            dotsContainer.appendChild(dot);
        });
    }

    const btnNext3D = document.getElementById('next3D');
    const btnPrev3D = document.getElementById('prev3D');

    if (btnNext3D) {
        btnNext3D.addEventListener('click', () => {
            const gridMedalhas = document.getElementById('gridMedalhas');
            if (!gridMedalhas) return;
            const visiveis = Array.from(gridMedalhas.querySelectorAll('.carrossel-3d-item')).filter(item => item.style.display !== 'none');
            if (visiveis.length === 0) return;
            currentIndex3DMedalhas = (currentIndex3DMedalhas + 1) % visiveis.length;
            atualizarPosicoes3D(visiveis, currentIndex3DMedalhas);
            atualizarDots3D(visiveis, currentIndex3DMedalhas, 'dots3D');
        });
    }

    if (btnPrev3D) {
        btnPrev3D.addEventListener('click', () => {
            const gridMedalhas = document.getElementById('gridMedalhas');
            if (!gridMedalhas) return;
            const visiveis = Array.from(gridMedalhas.querySelectorAll('.carrossel-3d-item')).filter(item => item.style.display !== 'none');
            if (visiveis.length === 0) return;
            currentIndex3DMedalhas = (currentIndex3DMedalhas - 1 + visiveis.length) % visiveis.length;
            atualizarPosicoes3D(visiveis, currentIndex3DMedalhas);
            atualizarDots3D(visiveis, currentIndex3DMedalhas, 'dots3D');
        });
    }

    // ==========================================================
    // 2. CARREGAR MEDALHAS DE METAL E ACRÍLICO DO SUPABASE
    // ==========================================================
    async function renderizarMedalhasMetalDoSupabase() {
        const gridMedalhas = document.getElementById('gridMedalhas');
        if (!gridMedalhas) return;

        const { data: medalhas, error } = await supabaseClient
            .from('medalhas_metal')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('Erro ao carregar medalhas de metal:', error);
            return;
        }

        if (!medalhas || medalhas.length === 0) return;
        medalhasMetalGlobais = medalhas;

        const htmlMedalhasMetal = medalhas.map(medalha => {
            const obsFormatada = formatarObservacaoPreco(medalha.observacao);
            return `
            <div class="carrossel-3d-item" data-categoria="metal" data-id="${medalha.id}" style="display: none;">
                <img src="${medalha.imagem_url || ''}" alt="Medalha Ref ${medalha.referencia}" class="medalha-pendurada-img">
                <div class="carrossel-3d-info">
                    <h4><strong>Ref: ${medalha.referencia}</strong></h4>
                    ${obsFormatada ? `<div class="preco-destaque-central" style="white-space: pre-line;">${obsFormatada}</div>` : ''}
                </div>
                <div class="infoMedalha">
                    <button class="btn-fechar-info" type="button"><i class="fa-solid fa-xmark"></i></button>
                    <img src="${medalha.imagem_url || ''}" alt="Medalha Ref ${medalha.referencia}">
                    <div class="info-detalhes-texto">
                        <h3>Ref: ${medalha.referencia}</h3>
                        ${obsFormatada ? `<p style="white-space: pre-line; font-weight: 600; color: #111; margin-top: 8px;">${obsFormatada}</p>` : ''}
                    </div>
                    <div class="btnOrc">
                        <a href="https://wa.me/5543988151444?text=${encodeURIComponent(`Olá! Gostaria de solicitar um orçamento para a Medalha de Metal Ref: ${medalha.referencia}`)}" target="_blank">
                            <i class="bi bi-whatsapp"></i> Solicitar Orçamento
                        </a>
                    </div>
                </div>
            </div>
        `}).join('');

        gridMedalhas.insertAdjacentHTML('afterbegin', htmlMedalhasMetal);
        atualizarExibicaoMedalhas();
    }

    async function renderizarMedalhasAcrilicoDoSupabase() {
        const gridMedalhas = document.getElementById('gridMedalhas');
        if (!gridMedalhas) return;

        const { data: medalhasAcrilico, error } = await supabaseClient
            .from('medalhas_acrilico')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('Erro ao carregar medalhas de acrílico:', error);
            return;
        }

        if (!medalhasAcrilico || medalhasAcrilico.length === 0) return;
        medalhasAcrilicoGlobais = medalhasAcrilico;

        const htmlMedalhasAcrilico = medalhasAcrilico.map(medalha => `
            <div class="carrossel-3d-item" data-categoria="acrilico" data-id="${medalha.id}" style="display: none;">
                <img src="${medalha.imagem_url || ''}" alt="${medalha.nome || 'Medalha de Acrílico'}" class="medalha-pendurada-img">
                <div class="carrossel-3d-info">
                    <h4><strong>${medalha.nome || 'Medalha'}</strong></h4>
                    <p>Ref: ${medalha.referencia || 'N/A'}</p>
                </div>
                <div class="infoMedalha">
                    <button class="btn-fechar-info" type="button"><i class="fa-solid fa-xmark"></i></button>
                    <img src="${medalha.imagem_url || ''}" alt="${medalha.nome}">
                    <div class="info-detalhes-texto">
                        <h3>${medalha.nome}</h3>
                        <p><strong>Ref:</strong> ${medalha.referencia || 'N/A'}</p>
                        ${medalha.observacao ? `<p style="white-space: pre-line;">${medalha.observacao}</p>` : ''}
                    </div>
                    <div class="btnOrc">
                        <a href="https://wa.me/5543988151444?text=${encodeURIComponent(`Olá! Gostaria de solicitar um orçamento para a Medalha de Acrílico: ${medalha.nome} (Ref: ${medalha.referencia})`)}" target="_blank">
                            <i class="bi bi-whatsapp"></i> Solicitar Orçamento
                        </a>
                    </div>
                </div>
            </div>
        `).join('');

        gridMedalhas.insertAdjacentHTML('beforeend', htmlMedalhasAcrilico);
        atualizarExibicaoMedalhas();
    }

    renderizarMedalhasMetalDoSupabase();
    renderizarMedalhasAcrilicoDoSupabase();

    // ==========================================================
    // 3. CARROSSEL 3D E FILTROS DE PLACAS
    // ==========================================================
    let currentIndex3DPlacas = 0;

    function atualizarExibicaoPlacas3D() {
        const gridPlacas = document.getElementById('gridPlacas');
        if (!gridPlacas) return;

        const botaoAtivo = document.querySelector('.btn-filtro-placa.ativa');
        const categoriaSelecionada = botaoAtivo ? botaoAtivo.getAttribute('data-categoria-placa') : 'inox';

        const todosItens = Array.from(gridPlacas.querySelectorAll('.carrossel-3d-item'));

        const itensFiltrados = todosItens.filter(item => {
            const catItem = item.getAttribute('data-categoria-placa');
            const deveExibir = (catItem === categoriaSelecionada);
            item.style.display = deveExibir ? 'flex' : 'none';
            return deveExibir;
        });

        currentIndex3DPlacas = 0;
        atualizarPosicoes3D(itensFiltrados, currentIndex3DPlacas);
        atualizarDots3D(itensFiltrados, currentIndex3DPlacas, 'dots3DPlacas', (idx) => {
            currentIndex3DPlacas = idx;
            atualizarPosicoes3D(itensFiltrados, currentIndex3DPlacas);
            atualizarDots3D(itensFiltrados, currentIndex3DPlacas, 'dots3DPlacas');
        });
    }

    const btnNext3DPlacas = document.getElementById('next3DPlacas');
    const btnPrev3DPlacas = document.getElementById('prev3DPlacas');

    if (btnNext3DPlacas) {
        btnNext3DPlacas.addEventListener('click', () => {
            const gridPlacas = document.getElementById('gridPlacas');
            if (!gridPlacas) return;
            const visiveis = Array.from(gridPlacas.querySelectorAll('.carrossel-3d-item')).filter(item => item.style.display !== 'none');
            if (visiveis.length === 0) return;
            currentIndex3DPlacas = (currentIndex3DPlacas + 1) % visiveis.length;
            atualizarPosicoes3D(visiveis, currentIndex3DPlacas);
            atualizarDots3D(visiveis, currentIndex3DPlacas, 'dots3DPlacas');
        });
    }

    if (btnPrev3DPlacas) {
        btnPrev3DPlacas.addEventListener('click', () => {
            const gridPlacas = document.getElementById('gridPlacas');
            if (!gridPlacas) return;
            const visiveis = Array.from(gridPlacas.querySelectorAll('.carrossel-3d-item')).filter(item => item.style.display !== 'none');
            if (visiveis.length === 0) return;
            currentIndex3DPlacas = (currentIndex3DPlacas - 1 + visiveis.length) % visiveis.length;
            atualizarPosicoes3D(visiveis, currentIndex3DPlacas);
            atualizarDots3D(visiveis, currentIndex3DPlacas, 'dots3DPlacas');
        });
    }

    async function renderizarPlacasDoSupabase() {
        const gridPlacas = document.getElementById('gridPlacas');
        if (!gridPlacas) return;

        const { data: placas, error } = await supabaseClient
            .from('placas')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('Erro ao carregar placas:', error);
            return;
        }

        if (!placas || placas.length === 0) return;
        placasGlobais = placas;

        const htmlPlacas = placas.map(placa => {
            const catNormalizada = (placa.categoria || 'inox')
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim();

            const precoFormatado = placa.preco > 0 ? `R$ ${Number(placa.preco).toFixed(2).replace('.', ',')}` : '';

            return `
            <div class="carrossel-3d-item" data-categoria-placa="${catNormalizada}" data-id="${placa.id}" style="display: none;">
                <img src="${placa.imagem_url || ''}" alt="${placa.nome}" class="medalha-pendurada-img">
                <div class="carrossel-3d-info">
                    <h4><strong>${placa.nome}</strong></h4>
                    <div class="preco-destaque-central">
                        ${placa.descricao ? `<p>${placa.descricao}</p>` : ''}
                        ${precoFormatado ? `<p style="font-weight:700; color:#111; margin-top:4px;">${precoFormatado}</p>` : ''}
                    </div>
                </div>
                <div class="infoMedalha">
                    <button class="btn-fechar-info" type="button"><i class="fa-solid fa-xmark"></i></button>
                    <img src="${placa.imagem_url || ''}" alt="${placa.nome}">
                    <div class="info-detalhes-texto">
                        <h3>${placa.nome}</h3>
                        ${placa.descricao ? `<p>${placa.descricao}</p>` : ''}
                        ${precoFormatado ? `<p style="font-weight:700; color:#111; margin-top:6px;">${precoFormatado}</p>` : ''}
                    </div>
                    <div class="btnOrc">
                        <a href="https://wa.me/5543988151444?text=${encodeURIComponent(`Olá! Gostaria de solicitar um orçamento para a Placa (${placa.categoria}): ${placa.nome}`)}" target="_blank">
                            <i class="bi bi-whatsapp"></i> Solicitar Orçamento
                        </a>
                    </div>
                </div>
            </div>
        `}).join('');

        gridPlacas.insertAdjacentHTML('afterbegin', htmlPlacas);
        atualizarExibicaoPlacas3D();
    }

    renderizarPlacasDoSupabase();

    // ==========================================================
    // 4. CARREGAR TAÇAS DO SUPABASE
    // ==========================================================
    async function renderizarTacasDoSupabase() {
        const gridTacas = document.getElementById('gridTacas');
        if (!gridTacas) return;

        const { data: tacas, error } = await supabaseClient.from('taca').select('*');
        if (error) {
            console.error('Erro ao carregar taças:', error);
            return;
        }

        if (!tacas || tacas.length === 0) {
            gridTacas.innerHTML = '<p>Nenhuma taça cadastrada no momento.</p>';
            return;
        }

        tacasGlobais = tacas;

        gridTacas.innerHTML = tacas.map(taca => `
            <div class="cardTaca" data-id="${taca.id}">
                <div class="taca-img-container">
                    <img src="${taca.imagem_url || ''}" alt="${taca.nome}" class="taca-img">
                </div>
                <div class="taca-info">
                    ${taca.nome ? `<h3 class="taca-nome">${taca.nome}</h3>` : ''}
                    ${taca.referencia ? `<span class="taca-ref"><strong>Ref:</strong> ${taca.referencia}</span>` : ''}
                    ${taca.altura ? `<span class="taca-altura"><strong>Altura:</strong> ${taca.altura}</span>` : ''}
                    <div class="taca-preco">R$ <span>${Number(taca.preco).toFixed(2).replace('.', ',')}</span></div>
                </div>
            </div>
        `).join('');
    }

    renderizarTacasDoSupabase();

    // ==========================================================
    // 5. TROFÉUS (MDF E ACRÍLICO)
    // ==========================================================
    let trofeusExpandido = false;

    function atualizarExibicaoTrofeus() {
        const containerSecao = document.getElementById('trofeus');
        const gridTrofeusFiltro = document.getElementById('carrosselTrofeusFiltro');
        if (!containerSecao || !gridTrofeusFiltro) return;

        const botaoAtivo = document.querySelector('.btn-filtro-trofeu.ativa');
        const categoriaSelecionada = botaoAtivo ? botaoAtivo.getAttribute('data-categoria-trofeu') : 'mdf';

        const todosCards = Array.from(gridTrofeusFiltro.querySelectorAll('.cardTrofeu'));
        const cardsDaCategoria = todosCards.filter(card => card.getAttribute('data-categoria-trofeu') === categoriaSelecionada);

        todosCards.forEach(card => card.style.display = 'none');

        cardsDaCategoria.forEach((card, index) => {
            if (trofeusExpandido || index < 8) {
                card.style.display = 'flex';
            }
        });

        let btnWrapper = document.getElementById('wrapperBtnVerMaisTrofeus');
        if (!btnWrapper) {
            btnWrapper = document.createElement('div');
            btnWrapper.id = 'wrapperBtnVerMaisTrofeus';
            btnWrapper.className = 'catalogo-btn-wrapper';
            btnWrapper.innerHTML = `
                <button id="btnVerMaisTrofeus" class="btn-ver-catalogo">
                    Ver mais <i class="fa-solid fa-arrow-down"></i>
                </button>
            `;
            containerSecao.appendChild(btnWrapper);

            const btnVerMais = btnWrapper.querySelector('#btnVerMaisTrofeus');
            btnVerMais.addEventListener('click', () => {
                trofeusExpandido = !trofeusExpandido;
                atualizarExibicaoTrofeus();
            });
        }

        const btnVerMais = btnWrapper.querySelector('#btnVerMaisTrofeus');
        if (cardsDaCategoria.length > 8) {
            btnWrapper.style.display = 'flex';
            btnVerMais.innerHTML = trofeusExpandido
                ? 'Ver menos <i class="fa-solid fa-arrow-up"></i>'
                : 'Ver mais <i class="fa-solid fa-arrow-down"></i>';
        } else {
            btnWrapper.style.display = 'none';
        }
    }

    async function renderizarTrofeusMdfDoSupabase() {
        const gridTrofeusFiltro = document.getElementById('carrosselTrofeusFiltro');
        if (!gridTrofeusFiltro) return;

        const { data: trofeusMdf, error } = await supabaseClient.from('trofeus_mdf').select('*').order('id', { ascending: true });
        if (error || !trofeusMdf) return;
        trofeusMdfGlobais = trofeusMdf;

        const htmlTrofeusMdf = trofeusMdf.map(trofeu => `
            <div class="cardTrofeu" data-categoria-trofeu="mdf" data-id="${trofeu.id}" style="display: none;">
                <img src="${trofeu.imagem || ''}" alt="${trofeu.nome}">
                <h3>${trofeu.nome}</h3>
                <h4>${trofeu.descricao}</h4>
            </div>
        `).join('');

        gridTrofeusFiltro.insertAdjacentHTML('beforeend', htmlTrofeusMdf);
        atualizarExibicaoTrofeus();
    }

    async function renderizarTrofeusAcrilicoDoSupabase() {
        const gridTrofeusFiltro = document.getElementById('carrosselTrofeusFiltro');
        if (!gridTrofeusFiltro) return;

        const { data: trofeusAcrilico, error } = await supabaseClient.from('trofeus_acrilico').select('*').order('id', { ascending: true });
        if (error || !trofeusAcrilico) return;

        const htmlTrofeusAcrilico = trofeusAcrilico.map(trofeu => `
            <div class="cardTrofeu" data-categoria-trofeu="acrilico" data-id="${trofeu.id}" style="display: none;">
                <img src="${trofeu.imagem || ''}" alt="${trofeu.nome}">
                <h3>${trofeu.nome}</h3>
                <h4>${trofeu.descricao}</h4>
            </div>
        `).join('');

        gridTrofeusFiltro.insertAdjacentHTML('beforeend', htmlTrofeusAcrilico);
        atualizarExibicaoTrofeus();
    }

    renderizarTrofeusMdfDoSupabase();
    renderizarTrofeusAcrilicoDoSupabase();

    // ==========================================================
    // 6. CONTROLE DE CLIQUE E MODAIS DO CARROSSEL 3D
    // ==========================================================
    function configurarCliques3D(gridId, getIndexFunc, setIndexFunc, atualizarPosFunc) {
        const gridEl = document.getElementById(gridId);
        if (!gridEl) return;

        gridEl.addEventListener('click', (e) => {
            const btnFechar = e.target.closest('.btn-fechar-info');
            if (btnFechar) {
                e.stopPropagation();
                const itemModal = btnFechar.closest('.carrossel-3d-item');
                if (itemModal) {
                    itemModal.classList.remove('ativa-modal');
                    document.body.style.overflow = '';
                }
                return;
            }

            const item = e.target.closest('.carrossel-3d-item');
            if (item) {
                const visiveis = Array.from(gridEl.querySelectorAll('.carrossel-3d-item')).filter(i => i.style.display !== 'none');
                const indexClicado = visiveis.indexOf(item);
                const currentIndex = getIndexFunc();

                if (indexClicado === currentIndex) {
                    const infoModal = item.querySelector('.infoMedalha');
                    if (infoModal && !item.classList.contains('ativa-modal')) {
                        item.classList.add('ativa-modal');
                        document.body.style.overflow = 'hidden';
                    }
                } else {
                    if (indexClicado !== -1) {
                        setIndexFunc(indexClicado);
                        atualizarPosFunc(visiveis);
                    }
                }
            }
        });
    }

    configurarCliques3D('gridMedalhas', () => currentIndex3DMedalhas, (v) => { currentIndex3DMedalhas = v; }, (vis) => {
        atualizarPosicoes3D(vis, currentIndex3DMedalhas);
        atualizarDots3D(vis, currentIndex3DMedalhas, 'dots3D');
    });

    configurarCliques3D('gridPlacas', () => currentIndex3DPlacas, (v) => { currentIndex3DPlacas = v; }, (vis) => {
        atualizarPosicoes3D(vis, currentIndex3DPlacas);
        atualizarDots3D(vis, currentIndex3DPlacas, 'dots3DPlacas');
    });

    // ==========================================================
    // SUPORTE A ARRASTAR COM O DEDO / MOUSE (SWIPE 3D)
    // ==========================================================
    function configurarSwipe3D(wrapperSelector, gridId, getIndexFunc, setIndexFunc, atualizarPosFunc) {
        const wrapper3D = document.querySelector(wrapperSelector);
        if (!wrapper3D) return;

        let touchStartX = 0;
        let touchEndX = 0;

        wrapper3D.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        wrapper3D.addEventListener('mousedown', (e) => {
            touchStartX = e.clientX;
        });

        wrapper3D.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            tratarDeslizamento();
        }, { passive: true });

        wrapper3D.addEventListener('mouseup', (e) => {
            touchEndX = e.clientX;
            tratarDeslizamento();
        });

        function tratarDeslizamento() {
            const limiarMinimo = 40;
            const gridEl = document.getElementById(gridId);
            if (!gridEl) return;

            const visiveis = Array.from(gridEl.querySelectorAll('.carrossel-3d-item')).filter(item => item.style.display !== 'none');
            if (visiveis.length === 0) return;

            let current = getIndexFunc();
            if (touchEndX < touchStartX - limiarMinimo) {
                current = (current + 1) % visiveis.length;
                setIndexFunc(current);
                atualizarPosFunc(visiveis);
            } else if (touchEndX > touchStartX + limiarMinimo) {
                current = (current - 1 + visiveis.length) % visiveis.length;
                setIndexFunc(current);
                atualizarPosFunc(visiveis);
            }
        }
    }

    configurarSwipe3D('.containerMedalha-section .carrossel-3d-wrapper', 'gridMedalhas', () => currentIndex3DMedalhas, (v) => { currentIndex3DMedalhas = v; }, (vis) => {
        atualizarPosicoes3D(vis, currentIndex3DMedalhas);
        atualizarDots3D(vis, currentIndex3DMedalhas, 'dots3D');
    });

    configurarSwipe3D('#placas .carrossel-3d-wrapper', 'gridPlacas', () => currentIndex3DPlacas, (v) => { currentIndex3DPlacas = v; }, (vis) => {
        atualizarPosicoes3D(vis, currentIndex3DPlacas);
        atualizarDots3D(vis, currentIndex3DPlacas, 'dots3DPlacas');
    });

    // ==========================================================
    // 7. CARROSSEL DE BANNERS INTRODUTÓRIOS
    // ==========================================================
    function initCarrossel(containerSelector, intervalTime) {
        document.querySelectorAll(containerSelector).forEach(container => {
            const images = container.querySelectorAll('img');
            const dotsContainer = container.querySelector('.dots-container');
            if (!images.length) return;

            let currentIndex = 0;
            let autoPlayTimer = null;

            if (dotsContainer) {
                dotsContainer.innerHTML = '';
                images.forEach((_, index) => {
                    const dot = document.createElement('div');
                    dot.classList.add('dot');
                    if (index === 0) dot.classList.add('active');
                    dot.addEventListener('click', () => {
                        goToSlide(index);
                        resetTimer();
                    });
                    dotsContainer.appendChild(dot);
                });
            }

            const dots = dotsContainer ? dotsContainer.querySelectorAll('.dot') : [];

            function goToSlide(index) {
                images[currentIndex].classList.remove('active');
                if (dots[currentIndex]) dots[currentIndex].classList.remove('active');
                currentIndex = index;
                images[currentIndex].classList.add('active');
                if (dots[currentIndex]) dots[currentIndex].classList.add('active');
            }

            function nextSlide() {
                goToSlide((currentIndex + 1) % images.length);
            }

            function resetTimer() {
                if (autoPlayTimer) clearInterval(autoPlayTimer);
                if (images.length > 1) autoPlayTimer = setInterval(nextSlide, intervalTime);
            }

            if (images.length > 1) autoPlayTimer = setInterval(nextSlide, intervalTime);
        });
    }

    initCarrossel('.carrosselIntro', 5000);
    initCarrossel('.carrosselIntroS, .carrosselSecundario', 4000);

    // ==========================================================
    // 8. MENU HAMBÚRGUER
    // ==========================================================
    const menuToggle = document.getElementById('menuToggle');
    const navElements = document.getElementById('navElements');
    const menuOverlay = document.getElementById('menuOverlay');
    const menuLinks = document.querySelectorAll('.menu a');

    if (menuToggle && navElements) {
        const toggleMenu = () => {
            const isActive = navElements.classList.toggle('active');
            if (menuOverlay) menuOverlay.classList.toggle('active');
            document.body.style.overflow = isActive ? 'hidden' : '';
        };

        menuToggle.addEventListener('click', toggleMenu);
        if (menuOverlay) menuOverlay.addEventListener('click', toggleMenu);

        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                navElements.classList.remove('active');
                if (menuOverlay) menuOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // ==========================================================
    // 9. SELETORES DE ABAS (MEDALHAS, TROFÉUS E PLACAS)
    // ==========================================================
    const botoesFiltroMedalha = document.querySelectorAll('.btn-filtro-medalha');
    if (botoesFiltroMedalha.length > 0) {
        botoesFiltroMedalha.forEach(botao => {
            botao.addEventListener('click', () => {
                botoesFiltroMedalha.forEach(b => b.classList.remove('ativa'));
                botao.classList.add('ativa');
                atualizarExibicaoMedalhas();
            });
        });
    }

    const botoesFiltroPlaca = document.querySelectorAll('.btn-filtro-placa');
    if (botoesFiltroPlaca.length > 0) {
        botoesFiltroPlaca.forEach(botao => {
            botao.addEventListener('click', () => {
                botoesFiltroPlaca.forEach(b => b.classList.remove('ativa'));
                botao.classList.add('ativa');
                atualizarExibicaoPlacas3D();
            });
        });
    }

    const botoesFiltroTrofeu = document.querySelectorAll('.btn-filtro-trofeu');
    const carrosselTrofeusFiltro = document.getElementById('carrosselTrofeusFiltro');

    if (botoesFiltroTrofeu.length > 0 && carrosselTrofeusFiltro) {
        botoesFiltroTrofeu.forEach(botao => {
            botao.addEventListener('click', () => {
                botoesFiltroTrofeu.forEach(b => b.classList.remove('ativa'));
                botao.classList.add('ativa');
                trofeusExpandido = false;
                atualizarExibicaoTrofeus();
            });
        });
    }

    // ==========================================================
    // 10. BUSCA GLOBAL DE PRODUTOS (COM PREÇOS EM PLACAS E TAÇAS)
    // ==========================================================
    const btnBuscaMobile = document.getElementById('btnBuscaMobile');
    const modalBuscaMobile = document.getElementById('modalBuscaMobile');
    const modalBuscaOverlay = document.getElementById('modalBuscaOverlay');
    const btnFecharModal = document.getElementById('btnFecharModal');
    const inputBuscaModal = document.getElementById('inputBuscaModal');
    const inputBuscaDesktop = document.querySelector('.inputBusca');
    const iconeBuscaDesktop = document.querySelector('.busca-container i');
    const btnClearSearch = document.getElementById('btnClearSearch');
    const modalBuscaResultados = document.getElementById('modalBuscaResultados');
    const searchResultsCounter = document.getElementById('searchResultsCounter');

    const coletarProdutosDaPagina = () => {
        const produtos = [];

        medalhasMetalGlobais.forEach(m => {
            produtos.push({ 
                referencia: m.referencia, 
                titulo: `Ref: ${m.referencia}`, 
                preco: '', 
                detalhe: m.observacao || 'Medalha de Metal', 
                img: m.imagem_url || '', 
                categoria: 'Medalha de Metal' 
            });
        });

        medalhasAcrilicoGlobais.forEach(m => {
            produtos.push({ 
                referencia: m.referencia, 
                titulo: m.nome || `Ref: ${m.referencia}`, 
                preco: '', 
                detalhe: m.observacao || '', 
                img: m.imagem_url || '', 
                categoria: 'Medalha de Acrílico' 
            });
        });

        placasGlobais.forEach(p => {
            const precoFormatado = p.preco > 0 ? `R$ ${Number(p.preco).toFixed(2).replace('.', ',')}` : '';
            const detalheCompleta = [p.descricao, precoFormatado].filter(Boolean).join(' • ');
            produtos.push({ 
                referencia: p.nome, 
                titulo: p.nome, 
                preco: precoFormatado, 
                detalhe: detalheCompleta || `Placa (${p.categoria})`, 
                img: p.imagem_url || '', 
                categoria: `Placa - ${p.categoria}` 
            });
        });

        tacasGlobais.forEach(t => {
            const precoFormatado = t.preco > 0 ? `R$ ${Number(t.preco).toFixed(2).replace('.', ',')}` : '';
            const infoExtra = [
                t.referencia ? `Ref: ${t.referencia}` : '', 
                t.altura ? `Altura: ${t.altura}` : '', 
                precoFormatado
            ].filter(Boolean).join(' • ');
            
            produtos.push({ 
                titulo: t.nome || 'Taça', 
                preco: precoFormatado, 
                detalhe: infoExtra, 
                img: t.imagem_url || '', 
                categoria: 'Taça' 
            });
        });

        return produtos;
    };

    const abrirModalBusca = () => { 
        if (modalBuscaMobile) { 
            modalBuscaMobile.classList.add('active'); 
            document.body.style.overflow = 'hidden'; 
            setTimeout(() => inputBuscaModal?.focus(), 100); 
        } 
    };

    const fecharModalBusca = () => { 
        if (modalBuscaMobile) { 
            modalBuscaMobile.classList.remove('active'); 
            document.body.style.overflow = ''; 
        } 
    };

    if (btnBuscaMobile) btnBuscaMobile.addEventListener('click', abrirModalBusca);
    if (btnFecharModal) btnFecharModal.addEventListener('click', fecharModalBusca);
    if (modalBuscaOverlay) modalBuscaOverlay.addEventListener('click', fecharModalBusca);
    if (iconeBuscaDesktop) iconeBuscaDesktop.addEventListener('click', abrirModalBusca);

    if (btnClearSearch) {
        btnClearSearch.addEventListener('click', () => {
            if (inputBuscaModal) {
                inputBuscaModal.value = '';
                inputBuscaModal.focus();
            }
            btnClearSearch.classList.remove('visible');
            executarBusca('');
        });
    }

    const executarBusca = (termo) => {
        if (!modalBuscaResultados) return;
        if (!termo) {
            if (searchResultsCounter) searchResultsCounter.innerHTML = '';
            modalBuscaResultados.innerHTML = `<div class="modal-busca-empty"><i class="fa-solid fa-magnifying-glass"></i><p>Digite algo para iniciar a busca.</p></div>`;
            return;
        }
        const filtrados = coletarProdutosDaPagina().filter(item => `${item.titulo} ${item.detalhe} ${item.categoria}`.toLowerCase().includes(termo));
        if (searchResultsCounter) searchResultsCounter.innerHTML = `${filtrados.length} produto(s) encontrado(s)`;
        if (filtrados.length === 0) {
            modalBuscaResultados.innerHTML = `<div class="modal-busca-empty"><i class="fa-solid fa-face-frown"></i><p>Nenhum produto encontrado.</p></div>`;
            return;
        }
        modalBuscaResultados.innerHTML = filtrados.map(item => `
            <div class="modal-result-card" data-ref="${item.referencia || item.titulo}">
                <img src="${item.img}" alt="${item.titulo}">
                <div class="modal-result-info">
                    <span class="modal-result-category">${item.categoria}</span>
                    <h4>${item.titulo}</h4>
                    <p style="white-space: pre-line;">${item.detalhe}</p>
                </div>
            </div>
        `).join('');
    };

    if (inputBuscaModal) {
        inputBuscaModal.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase().trim();
            if (btnClearSearch) btnClearSearch.classList.toggle('visible', termo.length > 0);
            executarBusca(termo);
        });
    }

    if (inputBuscaDesktop) {
        inputBuscaDesktop.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase().trim();
            if (termo.length > 0) {
                abrirModalBusca();
                if (inputBuscaModal) { inputBuscaModal.value = termo; inputBuscaModal.focus(); }
                executarBusca(termo);
            }
        });
    }

    // ==========================================================
    // 11. OBSERVER DE FADE IN
    // ==========================================================
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.carrossel-3d-item, .cardTrofeu, .cardTaca').forEach(card => {
        card.classList.add('card-fade-in');
        observer.observe(card);
    });

    window.addEventListener('beforeunload', () => {
        document.body.style.overflow = '';
    });
});