function ZayDataTable(varivel_de_referencia, tabela, campos, campo_id ,dados, funcoes_acoes, qtde_registros_por_pagina ,class_tr_thead, class_td_thead, class_tr_tbody, class_td_tbody, class_mensagem_sem_registros , class_nav_paginacao, class_btn_voltar_e_avancar_pagina, class_btn_numero_pagina, class_btn_paginacao_selecionado, class_btn_paginacao_desativado,callback_escrita_concluida){
    this.tabela = tabela;
    this.thead;
    this.tbody;
    this.tfoot;
    this.nav_btns_paginacao;
    this.btn_voltar_pagina;
    this.btn_avancar_pagina;
    this.dados = [];
    this.dados_divididos_em_paginas = [];
    this.campos = campos;
    if(funcoes_acoes.length > 0){
        this.campos['Ações'] = 'acoes';
    }
    this.qtde_registros_por_pagina = qtde_registros_por_pagina;
    this.qtde_paginas = 0;
    this.pagina_exibida = 0;
 
    this.adiciona_dados_que_serao_escritos = function(dados){
        this.dados = dados;
        this.dados_divididos_em_paginas = this.divide_dados_em_paginas();
    }

    this.gera_thead = function(){
        let thead = document.createElement("thead");

        let tr_thead = document.createElement("tr");
        tr_thead.classList.add(class_tr_thead)
    
        for(nome_campo in campos){
            let td = document.createElement("td");
            td.classList.add(class_td_thead);
            td.textContent = nome_campo;
            tr_thead.appendChild(td);
        }
    
        thead.appendChild(tr_thead);
    
        this.tabela.appendChild(thead);

        this.thead = thead;
    }

    this.gera_tbody = function(){
        let tbody = document.createElement("tbody");

        this.tbody = tbody;

        this.escreve_registros_no_tbody();
    
        tabela.appendChild(tbody);

    }

    this.gera_tfoot = function(){
        let tfoot = document.createElement("tfoot");

        let tr = document.createElement('tr');

        let td = document.createElement('td');
        td.setAttribute("colspan", Object.keys(this.campos).length);

        let nav = document.createElement("nav");
        nav.classList.add(class_nav_paginacao);
        //Nav já começa aculta, só é exibida se tiver registros
        nav.style.display = 'none';

        this.nav_btns_paginacao = nav;
        
        td.appendChild(nav);
        tr.appendChild(td);
        tfoot.appendChild(tr);

        tabela.appendChild(tfoot);

        this.tfoot = tfoot;

    }

    this.escreve_registros_no_tbody = function(){

        this.tbody.innerHTML = "";

        if(this.dados.length == 0){
            this.tbody.innerHTML = 
            `
            <tr>
                <td colspan="${Object.keys(this.campos).length}" class="${class_mensagem_sem_registros}">
                    Nenhum registro foi encontrado!
                </td>
            </tr>
            `;

            this.nav_btns_paginacao.style.display = 'none';

            return;
        }else{
            this.nav_btns_paginacao.style.display = 'flex';
        }

        this.ativa_btn_pagina();

        if(this.pagina_exibida == 0){
            this.btn_voltar_pagina.classList.add(class_btn_paginacao_desativado);
        }else{
            this.btn_voltar_pagina.classList.remove(class_btn_paginacao_desativado);
        }

        if(this.pagina_exibida + 1 == this.qtde_paginas){
            this.btn_avancar_pagina.classList.add(class_btn_paginacao_desativado);
        }else{
            this.btn_avancar_pagina.classList.remove(class_btn_paginacao_desativado);
        }

        let registros_para_escrever = this.dados_divididos_em_paginas[this.pagina_exibida]; 
    
        registros_para_escrever.forEach((objeto)=>{
            let tr = document.createElement("tr");
            tr.classList.add(class_tr_tbody);
            tr.dataset.id = objeto[campo_id];
            tr.id = `${varivel_de_referencia}ID-${objeto[campo_id]}`;

            for(nome_campo in this.campos){
                let td = document.createElement("td");
                td.classList.add(class_td_tbody);

                let campo = this.campos[nome_campo];

                if(campo == 'acoes'){
                    funcoes_acoes.forEach((btn)=>{
                        btn = this.adiciona_id_na_funcao_btn(btn, objeto[campo_id]);
                        td.innerHTML += btn;
                    });
                }else{
                    td.textContent = objeto[campo];
                }

                tr.appendChild(td);
            }

            this.tbody.appendChild(tr);
        });
        
        if(callback_escrita_concluida){
            callback_escrita_concluida();
        }

    }

    this.busca_registro_no_array_de_dados_pelo_id = function(id){
        return this.dados.find((registro)=>{
            return registro[campo_id] == id;
        });
    }

    this.limpa_lista = function(){
        this.dados = [];
        this.dados_divididos_em_paginas = [];
        this.qtde_paginas = 0;
        this.pagina_exibida = 0;
        this.escreve_registros_no_tbody();
    }

    this.adiciona_id_na_funcao_btn = function(string_btn, id){
        let string_dividida = string_btn.split('(');
        return `${string_dividida[0]}(${id}${string_dividida[1]}`;
    }

    this.gera_botoes_paginacao = function(){

        this.nav_btns_paginacao.innerHTML = "";

        let btn_voltar = document.createElement("a");
        btn_voltar.classList.add(class_btn_voltar_e_avancar_pagina);
        btn_voltar.addEventListener("click", this.voltar_pagina);
        btn_voltar.textContent = 'Voltar';

        this.nav_btns_paginacao.appendChild(btn_voltar);

        this.btn_voltar_pagina = btn_voltar;
            
        for(let i = 0; i < this.qtde_paginas; i++){
            let btn = document.createElement("a");
            btn.classList.add(class_btn_numero_pagina);
            btn.textContent = i+1;
            btn.id = `${class_btn_numero_pagina}-${i}`;
            btn.dataset.numero_pagina = i;
            btn.addEventListener("click", this.trocar_de_pagina);

            this.nav_btns_paginacao.appendChild(btn);
        }

        let btn_avancar = document.createElement("a");
        btn_avancar.classList.add(class_btn_voltar_e_avancar_pagina);
        btn_avancar.addEventListener("click", this.avancar_pagina);
        btn_avancar.textContent = 'Avançar';

        this.nav_btns_paginacao.appendChild(btn_avancar);

        this.btn_avancar_pagina = btn_avancar;
    }

    this.divide_dados_em_paginas = function(){

        this.qtde_paginas = Math.ceil(this.dados.length / this.qtde_registros_por_pagina);

        let dados_divididos_em_paginas = [];

        let start = 0;

        for(let i = 0; i < this.qtde_paginas; i++){
            dados_divididos_em_paginas.push(
                this.dados.slice(start, start + this.qtde_registros_por_pagina)
            );
            start += this.qtde_registros_por_pagina;
        }   

        this.gera_botoes_paginacao();

        return dados_divididos_em_paginas;
    }

    this.atualiza_registros = function(dados){

        this.adiciona_dados_que_serao_escritos(dados);

        if(this.pagina_exibida +1 > this.qtde_paginas){
            this.pagina_exibida = 0;
        }

        this.escreve_registros_no_tbody();
    }
    
    this.remove_registro = function(id){
        let tempo_opacidade_ms = 500;

        let tr = document.querySelector(`#${varivel_de_referencia}ID-${id}`);

        tr.style.transition = tempo_opacidade_ms+"ms";
        tr.style.opacity = 0.0;
        setTimeout(()=>{
            tr.remove();
        }, tempo_opacidade_ms);


        //Lógica para remover registro do array de dados
        let registro_excluido = this.busca_registro_no_array_de_dados_pelo_id(id);

        let indice_registro_excluido = this.dados.indexOf(registro_excluido);
    
        this.dados.splice(indice_registro_excluido, 1);
    }

    this.trocar_de_pagina = function(event){
        let numero_pagina = Number(event.target.dataset.numero_pagina);

        let instancia_atual = eval(varivel_de_referencia);

        instancia_atual.pagina_exibida = numero_pagina;

        instancia_atual.escreve_registros_no_tbody();

    }

    this.avancar_pagina = function(event){
        let btn = event.target;

        let instancia_atual = eval(varivel_de_referencia);

        if(instancia_atual.pagina_exibida +1 == instancia_atual.qtde_paginas){
            return;
        }

        instancia_atual.pagina_exibida++;


        instancia_atual.escreve_registros_no_tbody();

    }

    this.voltar_pagina = function(event){
        let btn = event.target;

        let instancia_atual = eval(varivel_de_referencia);

        if(instancia_atual.pagina_exibida == 0){
            btn.classList.add(class_btn_paginacao_desativado);
            return;
        }

        instancia_atual.pagina_exibida--;

        instancia_atual.escreve_registros_no_tbody();
    }

    this.ativa_btn_pagina = function(){
        let btns = document.querySelectorAll("."+class_btn_numero_pagina);
        btns.forEach((btn)=>{
            btn.classList.remove(class_btn_paginacao_selecionado);
        });

        let btn = document.querySelector(`#${class_btn_numero_pagina}-${this.pagina_exibida}`);
        
        btn.classList.add(class_btn_paginacao_selecionado);

    }

    this.gera_tfoot();
    this.adiciona_dados_que_serao_escritos(dados);
    this.gera_thead();
    this.gera_tbody();
 
}