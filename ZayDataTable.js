export class AcaoRegistro {
    constructor(_botao, _funcao) {
        this._botao = _botao;
        this._funcao = _funcao;
    }
    get botao() {
        return this._botao;
    }
    get funcao_click() {
        return this._funcao;
    }
}
export class AcaoDiferenteParaCadaRegistro {
    constructor(_callbackDecisora, _acoesRegistros) {
        this._callbackDecisora = _callbackDecisora;
        this._acoesRegistros = _acoesRegistros;
    }
}
export class CampoDosRegistros {
    constructor(_nomeDoCampo, _campoNoObjeto, _geradorValorPersonalizado = null) {
        this._nomeDoCampo = _nomeDoCampo;
        this._campoNoObjeto = _campoNoObjeto;
        this._geradorValorPersonalizado = _geradorValorPersonalizado;
    }
    get nomeDoCampo() {
        return this._nomeDoCampo;
    }
    get campoNoObjeto() {
        return this._campoNoObjeto;
    }
    get geradorValorPersonalizado() {
        return this._geradorValorPersonalizado;
    }
}
export class ZayDataTable {
    constructor(nome_tabela, tabela, campos, campo_id, dados, lista_acoes, loader_acoes, qtde_registros_por_pagina) {
        this.qtde_paginas = 0;
        this.pagina_exibida = 0;
        //Eventos
        this.onAdvanceOrRetreatPage = null;
        this.onChangePage = null;
        this.onWriteRegisters = null;
        this.escreve_registros_no_tbody = () => {
            this.tbody.innerHTML = "";
            if (this.dados.length == 0) {
                this.tbody.innerHTML =
                    `
            <tr>
                <td colspan="${Object.keys(this.campos).length}" class="${this.nome_tabela}__mensagem_sem_registros">
                    Nenhum registro foi encontrado!
                </td>
            </tr>
            `;
                this.nav_btns_paginacao.style.display = 'none';
                return;
            }
            else {
                this.nav_btns_paginacao.style.display = 'flex';
            }
            if (this.paginacao) {
                this.ativa_btn_pagina();
                if (this.pagina_exibida == 0) {
                    this.btn_voltar_pagina.classList.add('zayDataTable__btn_paginacao_desativado', `${this.nome_tabela}__btn_paginacao_desativado`);
                }
                else {
                    this.btn_voltar_pagina.classList.remove('zayDataTable__btn_paginacao_desativado', `${this.nome_tabela}__btn_paginacao_desativado`);
                }
                if (this.pagina_exibida + 1 == this.qtde_paginas) {
                    this.btn_avancar_pagina.classList.add('zayDataTable__btn_paginacao_desativado', `${this.nome_tabela}__btn_paginacao_desativado`);
                }
                else {
                    this.btn_avancar_pagina.classList.remove('zayDataTable__btn_paginacao_desativado', `${this.nome_tabela}__btn_paginacao_desativado`);
                }
            }
            let registros_para_escrever = this.dados_divididos_em_paginas[this.pagina_exibida];
            registros_para_escrever.forEach((objeto) => {
                //Lança erro se não for um objeto correto
                this.verifica_se_objeto_possui_campos_corretos(objeto);
                let tr = document.createElement("tr");
                tr.classList.add(`${this.nome_tabela}__tr_tbody`);
                tr.dataset.id = objeto[this.campo_id];
                tr.id = `${this.nome_tabela}ID-${objeto[this.campo_id]}`;
                this.campos.forEach(campo => {
                    let td = document.createElement("td");
                    let campo_no_objeto = campo.campoNoObjeto;
                    td.classList.add(`zayDataTable_${campo_no_objeto}`, `${this.nome_tabela}__td_tbody`, `${this.nome_tabela}-${campo_no_objeto}`);
                    if (campo_no_objeto == 'acoes') {
                        if (this.lista_acoes) {
                            this.lista_acoes.forEach((objeto_acao) => {
                                if (objeto_acao instanceof AcaoDiferenteParaCadaRegistro) {
                                    const indiceDeQualAcaoUsar = objeto_acao._callbackDecisora(objeto);
                                    objeto_acao = objeto_acao._acoesRegistros[indiceDeQualAcaoUsar];
                                }
                                let botao = objeto_acao.botao;
                                let funcao = objeto_acao.funcao_click;
                                const novo_botao = botao.cloneNode(true);
                                novo_botao.addEventListener("click", funcao);
                                novo_botao.dataset.id = objeto[this.campo_id];
                                novo_botao.classList.add("btn_acoes_registros");
                                td.appendChild(novo_botao);
                            });
                            if (this.loader_acoes) {
                                let novo_loader = this.loader_acoes.cloneNode(true);
                                novo_loader.style.display = "none";
                                novo_loader.classList.add("loader_acoes_tabela");
                                td.appendChild(novo_loader);
                            }
                        }
                    }
                    else {
                        if (campo.geradorValorPersonalizado) {
                            td.innerHTML = campo.geradorValorPersonalizado(objeto[campo_no_objeto]);
                        }
                        else {
                            td.textContent = objeto[campo_no_objeto];
                        }
                    }
                    tr.appendChild(td);
                });
                this.tbody.appendChild(tr);
            });
            //Define o indicador para false pois nesse momento indica que a tabela já foi constuída
            this._indicador_de_primeira_vez = false;
            if (this.onWriteRegisters) {
                this.onWriteRegisters();
            }
        };
        this.busca_registro_no_array_de_dados_pelo_id = function (id) {
            return this.dados.find((registro) => {
                return registro[this.campo_id] == id;
            });
        };
        this.busca_registro_no_array_de_dados_divididos_pelo_id = function (id) {
            return this.dados_divididos_em_paginas[this.pagina_exibida].find((registro) => {
                return registro[this.campo_id] == id;
            });
        };
        this.adiciona_id_na_funcao_btn = function (string_btn, id) {
            let string_dividida = string_btn.split('(');
            return `${string_dividida[0]}(${id}${string_dividida[1]}`;
        };
        if (nome_tabela.match(/\s/)) {
            throw new Error("Nome da tabela não pode ter espaços");
        }
        this.nome_tabela = nome_tabela;
        this.tabela = tabela;
        this.campos = campos;
        this.campo_id = campo_id;
        if (lista_acoes && lista_acoes.length > 0) {
            this.campos.push(new CampoDosRegistros("Ações", 'acoes'));
        }
        this.lista_acoes = lista_acoes;
        this.loader_acoes = loader_acoes;
        this.paginacao = true;
        if (qtde_registros_por_pagina === false) {
            this.qtde_registros_por_pagina = dados.length;
            this.paginacao = false;
        }
        else {
            this.qtde_registros_por_pagina = qtde_registros_por_pagina;
        }
        this._indicador_de_primeira_vez = true;
        this.gera_tfoot();
        this.adiciona_dados_que_serao_escritos(dados);
        this.gera_thead();
        this.gera_tbody();
    }
    adiciona_dados_que_serao_escritos(dados) {
        this.dados = dados;
        this.dados_divididos_em_paginas = this.divide_dados_em_paginas();
    }
    verifica_se_objeto_possui_campos_corretos(objeto_registro) {
        if (this.campos.length <= 0) {
            return;
        }
        //Adiciona o campo id para verificar se corresponte também
        const campo_id_provisorio = new CampoDosRegistros('id', this.campo_id);
        this.campos.push(campo_id_provisorio);
        this.campos.forEach(campo => {
            let campo_no_objeto = campo.campoNoObjeto;
            if (campo_no_objeto != 'acoes') {
                if (!(campo_no_objeto in objeto_registro)) {
                    if (this._indicador_de_primeira_vez) {
                        throw new Error(`O objeto ${JSON.stringify(objeto_registro)} não contém a propriedade: "${campo_no_objeto}"`);
                    }
                    throw new Error("Atualizar: Objeto não corresponde com os que foram passados inicialmente!");
                }
            }
        });
        //Remove o campo id adicionado acima;
        this.campos.pop();
    }
    gera_thead() {
        let thead = document.createElement("thead");
        let tr_thead = document.createElement("tr");
        tr_thead.classList.add(`${this.nome_tabela}__tr_thead`);
        this.campos.forEach(campo => {
            let td = document.createElement("td");
            td.classList.add(`zayDataTable_${campo.campoNoObjeto}`, `${this.nome_tabela}__td_thead`, `${this.nome_tabela}-${campo.campoNoObjeto}`);
            td.textContent = campo.nomeDoCampo;
            tr_thead.appendChild(td);
        });
        thead.appendChild(tr_thead);
        this.tabela.appendChild(thead);
        this.thead = thead;
    }
    gera_tbody() {
        let tbody = document.createElement("tbody");
        this.tbody = tbody;
        this.escreve_registros_no_tbody();
        this.tabela.appendChild(tbody);
    }
    gera_tfoot() {
        let tfoot = document.createElement("tfoot");
        let tr = document.createElement('tr');
        let td = document.createElement('td');
        td.setAttribute("colspan", String(Object.keys(this.campos).length));
        let nav = document.createElement("nav");
        nav.classList.add(`zayDataTable__nav_paginacao`, `${this.nome_tabela}__nav_paginacao`);
        //Nav já começa aculta, só é exibida se tiver registros
        nav.style.display = 'none';
        this.nav_btns_paginacao = nav;
        td.appendChild(nav);
        tr.appendChild(td);
        tfoot.appendChild(tr);
        this.tabela.appendChild(tfoot);
        this.tfoot = tfoot;
    }
    busca_tr_por_id(id) {
        return document.querySelector(`#${this.nome_tabela}ID-${id}`);
    }
    limpa_lista() {
        this.dados = [];
        this.dados_divididos_em_paginas = [];
        this.qtde_paginas = 0;
        this.pagina_exibida = 0;
        this.escreve_registros_no_tbody();
    }
    gera_botoes_paginacao() {
        if (!this.paginacao) {
            return;
        }
        this.nav_btns_paginacao.innerHTML = "";
        let btn_voltar = document.createElement("a");
        btn_voltar.classList.add('zayDataTable__btn_voltar_e_avancar_pagina', `${this.nome_tabela}__btn_voltar_e_avancar_pagina`, 'material-icons');
        btn_voltar.addEventListener("click", () => this.voltar_pagina());
        btn_voltar.textContent = 'arrow_back_ios_new';
        this.nav_btns_paginacao.appendChild(btn_voltar);
        this.btn_voltar_pagina = btn_voltar;
        for (let i = 0; i < this.qtde_paginas; i++) {
            let btn = document.createElement("a");
            btn.classList.add(`zayDataTable__btnNumeroPaginacao`, `${this.nome_tabela}__btn_numero_pagina`);
            btn.textContent = `${i + 1}`;
            btn.id = `${this.nome_tabela}__btn_numero_pagina-${i}`;
            btn.dataset.numero_pagina = `${i}`;
            btn.addEventListener("click", event => this.trocar_de_pagina(event));
            this.nav_btns_paginacao.appendChild(btn);
        }
        let btn_avancar = document.createElement("a");
        btn_avancar.classList.add('zayDataTable__btn_voltar_e_avancar_pagina', `${this.nome_tabela}__btn_voltar_e_avancar_pagina`, 'material-icons');
        btn_avancar.addEventListener("click", () => this.avancar_pagina());
        btn_avancar.textContent = 'arrow_forward_ios';
        this.nav_btns_paginacao.appendChild(btn_avancar);
        this.btn_avancar_pagina = btn_avancar;
    }
    divide_dados_em_paginas() {
        this.qtde_paginas = Math.ceil(this.dados.length / this.qtde_registros_por_pagina);
        let dados_divididos_em_paginas = [];
        let start = 0;
        for (let i = 0; i < this.qtde_paginas; i++) {
            dados_divididos_em_paginas.push(this.dados.slice(start, start + this.qtde_registros_por_pagina));
            start += this.qtde_registros_por_pagina;
        }
        this.gera_botoes_paginacao();
        return dados_divididos_em_paginas;
    }
    atualiza_registros(dados) {
        this.adiciona_dados_que_serao_escritos(dados);
        if (this.pagina_exibida + 1 > this.qtde_paginas) {
            this.pagina_exibida = 0;
        }
        this.escreve_registros_no_tbody();
    }
    remove_registro(id) {
        let tempo_opacidade_ms = 500;
        let tr = this.busca_tr_por_id(id);
        tr.style.transition = tempo_opacidade_ms + "ms";
        tr.style.opacity = '0.0';
        setTimeout(() => {
            tr.remove();
        }, tempo_opacidade_ms);
        this.remove_registro_do_array_de_dados(id);
        this.remove_registro_do_array_de_dados_divididos(id);
    }
    remove_registro_do_array_de_dados(id) {
        let registro_excluido = this.busca_registro_no_array_de_dados_pelo_id(id);
        let indice_registro_excluido = this.dados.indexOf(registro_excluido);
        this.dados.splice(indice_registro_excluido, 1);
    }
    remove_registro_do_array_de_dados_divididos(id) {
        let array_da_pagina = this.dados_divididos_em_paginas[this.pagina_exibida];
        let registro_excluido = this.busca_registro_no_array_de_dados_divididos_pelo_id(id);
        let indice_registro_excluido = array_da_pagina.indexOf(registro_excluido);
        array_da_pagina.splice(indice_registro_excluido, 1);
    }
    atualiza_registro(objeto_registro) {
        //Lança erro se não for um objeto correto
        this.verifica_se_objeto_possui_campos_corretos(objeto_registro);
        let id = objeto_registro[this.campo_id];
        let registro_na_lista = this.busca_registro_no_array_de_dados_pelo_id(id);
        let tr = this.busca_tr_por_id(id);
        this.campos.forEach(campo => {
            let campo_no_objeto = campo.campoNoObjeto;
            let td = tr.querySelector(`.${this.nome_tabela}-${campo_no_objeto}`);
            if (campo_no_objeto != 'acoes') {
                td.textContent = objeto_registro[campo_no_objeto];
                registro_na_lista[campo_no_objeto] = objeto_registro[campo_no_objeto];
            }
        });
    }
    ativa_loader_de_um_registro(id) {
        if (!this.lista_acoes || this.lista_acoes.length == 0 || !this.loader_acoes) {
            return;
        }
        let tr = this.busca_tr_por_id(id);
        let campo_acoes = tr.querySelector(`.${this.nome_tabela}-acoes`);
        let btns = campo_acoes.querySelectorAll(".btn_acoes_registros");
        btns.forEach(btn => {
            btn.style.display = 'none';
        });
        let loader = campo_acoes.querySelector(".loader_acoes_tabela");
        loader.style.display = "";
    }
    desativa_loader_de_um_registro(id) {
        if (!this.lista_acoes || this.lista_acoes.length == 0 || !this.loader_acoes) {
            return;
        }
        let tr = this.busca_tr_por_id(id);
        let campo_acoes = tr.querySelector(`.${this.nome_tabela}-acoes`);
        let btns = campo_acoes.querySelectorAll(".btn_acoes_registros");
        btns.forEach(btn => {
            btn.style.display = '';
        });
        let loader = campo_acoes.querySelector(".loader_acoes_tabela");
        loader.style.display = "none";
    }
    trocar_de_pagina(event) {
        let elelementoClicado = event.target;
        let numero_pagina = Number(elelementoClicado.dataset.numero_pagina);
        this.pagina_exibida = numero_pagina;
        this.escreve_registros_no_tbody();
        if (this.onChangePage) {
            this.onChangePage();
        }
    }
    avancar_pagina() {
        if (this.pagina_exibida + 1 == this.qtde_paginas) {
            return;
        }
        this.pagina_exibida++;
        this.escreve_registros_no_tbody();
        if (this.onAdvanceOrRetreatPage) {
            this.onAdvanceOrRetreatPage();
        }
    }
    voltar_pagina() {
        if (this.pagina_exibida == 0) {
            return;
        }
        this.pagina_exibida--;
        this.escreve_registros_no_tbody();
        if (this.onAdvanceOrRetreatPage) {
            this.onAdvanceOrRetreatPage();
        }
    }
    ativa_btn_pagina() {
        if (!this.paginacao) {
            return;
        }
        const btnAtivado = document.querySelector('.zayDataTable__btnPaginacaoAtivado');
        if (btnAtivado) {
            btnAtivado.classList.remove(`zayDataTable__btnPaginacaoAtivado`, `${this.nome_tabela}__btn_paginacao_selecionado`);
        }
        let btn = document.querySelector(`#${this.nome_tabela}__btn_numero_pagina-${this.pagina_exibida}`);
        btn.classList.add(`zayDataTable__btnPaginacaoAtivado`, `${this.nome_tabela}__btn_paginacao_selecionado`);
    }
}
