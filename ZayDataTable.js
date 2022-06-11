class ZayDataTable
{
    
    constructor(nome_tabela, tabela, campos, campo_id ,dados, lista_acoes, loader_acoes ,qtde_registros_por_pagina ,class_tr_thead, class_td_thead, class_tr_tbody, class_td_tbody, class_mensagem_sem_registros , class_nav_paginacao, class_btn_voltar_e_avancar_pagina, class_btn_numero_pagina, class_btn_paginacao_selecionado, class_btn_paginacao_desativado,callback_escrita_concluida)
    {
        this.nome_tabela = nome_tabela;
        this.tabela = tabela;
        this.thead;
        this.tbody;
        this.tfoot;

        this.classes = {
            class_tr_thead,
            class_td_thead,
            class_tr_tbody,
            class_td_tbody,
            class_mensagem_sem_registros,
            class_nav_paginacao,
            class_btn_voltar_e_avancar_pagina,
            class_btn_numero_pagina,
            class_btn_paginacao_selecionado,
            class_btn_paginacao_desativado
        }

        this.nav_btns_paginacao;
        this.btn_voltar_pagina;
        this.btn_avancar_pagina;
        this.dados = [];
        this.dados_divididos_em_paginas = [];
        this.campos = campos;
        this.campo_id = campo_id;
        if(lista_acoes.length > 0){
            this.campos['Ações'] = 'acoes';
        }
        this.lista_acoes = lista_acoes;
        this.loader_acoes = loader_acoes;
        this.qtde_registros_por_pagina = qtde_registros_por_pagina;
        this.qtde_paginas = 0;
        this.pagina_exibida = 0;
        this.callback_escrita_concluida = callback_escrita_concluida;

        this.gera_tfoot();
        this.adiciona_dados_que_serao_escritos(dados);
        this.gera_thead();
        this.gera_tbody();
    }   

    adiciona_dados_que_serao_escritos(dados){
        this.dados = dados;
        this.dados_divididos_em_paginas = this.divide_dados_em_paginas();
    }

    verifica_se_objeto_possui_campos_corretos(objeto_registro)
    {
        if(this.campos.length <= 0){
            return;
        }

        //Adiciona o campo id para verificar se corresponte também
        this.campos['id'] = this.campo_id;

        for(let nome_campo in this.campos){
            let campo = this.campos[nome_campo];

            if(campo != 'acoes'){
                let campo_no_obj_registro = objeto_registro[campo];
                if(!campo_no_obj_registro){
                    throw new Error("Objeto não corresponde com os que foram passados inicialmente!");
                }
            }
        }

        //Remove o campo id adicionado acima;
        delete this.campos['id'];
    }

    gera_thead = function(){
        let thead = document.createElement("thead");

        let tr_thead = document.createElement("tr");
        tr_thead.classList.add(this.classes.class_tr_thead)

        let campos = this.campos;

        for(let nome_campo in campos){
            let td = document.createElement("td");
            td.classList.add(this.classes.class_td_thead);
            td.textContent = nome_campo;
            tr_thead.appendChild(td);
        }
    
        thead.appendChild(tr_thead);
    
        this.tabela.appendChild(thead);

        this.thead = thead;
    }

    gera_tbody = function(){
        let tbody = document.createElement("tbody");

        this.tbody = tbody;

        this.escreve_registros_no_tbody();
    
        this.tabela.appendChild(tbody);

    }

    gera_tfoot = function(){
        let tfoot = document.createElement("tfoot");

        let tr = document.createElement('tr');

        let td = document.createElement('td');
        td.setAttribute("colspan", Object.keys(this.campos).length);

        let nav = document.createElement("nav");
        nav.classList.add(this.classes.class_nav_paginacao);
        //Nav já começa aculta, só é exibida se tiver registros
        nav.style.display = 'none';

        this.nav_btns_paginacao = nav;
        
        td.appendChild(nav);
        tr.appendChild(td);
        tfoot.appendChild(tr);

        this.tabela.appendChild(tfoot);

        this.tfoot = tfoot;

    }

    escreve_registros_no_tbody = function(){

        this.tbody.innerHTML = "";

        if(this.dados.length == 0){
            this.tbody.innerHTML = 
            `
            <tr>
                <td colspan="${Object.keys(this.campos).length}" class="${this.classes.class_mensagem_sem_registros}">
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
            this.btn_voltar_pagina.classList.add(this.classes.class_btn_paginacao_desativado);
        }else{
            this.btn_voltar_pagina.classList.remove(this.classes.class_btn_paginacao_desativado);
        }

        if(this.pagina_exibida + 1 == this.qtde_paginas){
            this.btn_avancar_pagina.classList.add(this.classes.class_btn_paginacao_desativado);
        }else{
            this.btn_avancar_pagina.classList.remove(this.classes.class_btn_paginacao_desativado);
        }

        let registros_para_escrever = this.dados_divididos_em_paginas[this.pagina_exibida]; 
    
        registros_para_escrever.forEach((objeto)=>{

            //Lança erro se não for um objeto correto
            this.verifica_se_objeto_possui_campos_corretos(objeto);

            let tr = document.createElement("tr");
            tr.classList.add(this.classes.class_tr_tbody);
            tr.dataset.id = objeto[this.campo_id];
            tr.id = `${this.nome_tabela}ID-${objeto[this.campo_id]}`;

            for(let nome_campo in this.campos){
                let td = document.createElement("td");
                td.classList.add(this.classes.class_td_tbody);

                let campo = this.campos[nome_campo];

                td.dataset.nome_campo = campo;

                if(campo == 'acoes'){
                    this.lista_acoes.forEach((objeto_acao)=>{

                        let botao = objeto_acao.botao;
                        let funcao = objeto_acao.funcao_click;

                        botao = botao.cloneNode(true);

                        botao.addEventListener("click", funcao);

                        botao.dataset.id = objeto[this.campo_id];

                        botao.classList.add("btn_acoes_registros");

                        td.appendChild(botao);

                    });
                    let novo_loader = this.loader_acoes.cloneNode(true);

                    novo_loader.style.display = "none";

                    novo_loader.classList.add("loader_acoes_tabela");

                    td.appendChild(novo_loader);
                }else{
                    td.textContent = objeto[campo];
                }

                tr.appendChild(td);
            }

            this.tbody.appendChild(tr);
        });
        
        if(this.callback_escrita_concluida){
            this.callback_escrita_concluida();
        }

    }

    busca_registro_no_array_de_dados_pelo_id = function(id){
        return this.dados.find((registro)=>{
            return registro[this.campo_id] == id;
        });
    }

    busca_tr_por_id(id)
    {
        return document.querySelector(`#${this.nome_tabela}ID-${id}`);
    }

    limpa_lista(){
        this.dados = [];
        this.dados_divididos_em_paginas = [];
        this.qtde_paginas = 0;
        this.pagina_exibida = 0;
        this.escreve_registros_no_tbody();
    }

    adiciona_id_na_funcao_btn = function(string_btn, id){
        let string_dividida = string_btn.split('(');
        return `${string_dividida[0]}(${id}${string_dividida[1]}`;
    }

    gera_botoes_paginacao(){

        this.nav_btns_paginacao.innerHTML = "";

        let btn_voltar = document.createElement("a");
        btn_voltar.classList.add(this.classes.class_btn_voltar_e_avancar_pagina, 'material-icons');
        btn_voltar.addEventListener("click", event => this.voltar_pagina(event));
        btn_voltar.textContent = 'arrow_back_ios_new';

        this.nav_btns_paginacao.appendChild(btn_voltar);

        this.btn_voltar_pagina = btn_voltar;
            
        for(let i = 0; i < this.qtde_paginas; i++){
            let btn = document.createElement("a");
            btn.classList.add(this.classes.class_btn_numero_pagina);
            btn.textContent = i+1;
            btn.id = `${this.classes.class_btn_numero_pagina}-${i}`;
            btn.dataset.numero_pagina = i;
            btn.addEventListener("click", event =>  this.trocar_de_pagina(event));

            this.nav_btns_paginacao.appendChild(btn);
        }

        let btn_avancar = document.createElement("a");
        btn_avancar.classList.add(this.classes.class_btn_voltar_e_avancar_pagina, 'material-icons');
        btn_avancar.addEventListener("click", event =>  this.avancar_pagina(event));
        btn_avancar.textContent = 'arrow_forward_ios';

        this.nav_btns_paginacao.appendChild(btn_avancar);

        this.btn_avancar_pagina = btn_avancar;
    }

    divide_dados_em_paginas(){

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

    atualiza_registros(dados){

        this.adiciona_dados_que_serao_escritos(dados);

        if(this.pagina_exibida +1 > this.qtde_paginas){
            this.pagina_exibida = 0;
        }

        this.escreve_registros_no_tbody();
    }
    
    remove_registro(id){
        let tempo_opacidade_ms = 500;

        let tr = this.busca_tr_por_id(id);

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

    atualiza_registro(objeto_registro)
    {

        //Lança erro se não for um objeto correto
        this.verifica_se_objeto_possui_campos_corretos(objeto_registro);

        let id = objeto_registro[this.campo_id];

        let produto_na_lista = this.busca_registro_no_array_de_dados_pelo_id(id);

        let tr = this.busca_tr_por_id(id);

        for(let valor in this.campos){
            let campo = this.campos[valor];

            let td = tr.querySelector(`[data-nome_campo=${campo}]`);

            if(campo != 'acoes'){
                td.textContent = objeto_registro[campo];
                produto_na_lista[campo] = objeto_registro[campo];
            }
            
        }

    }

    ativa_loader_de_um_registro(id)
    {
        let tr = this.busca_tr_por_id(id);
        let campo_acoes = tr.querySelector("[data-nome_campo=acoes]");
        let btns = campo_acoes.querySelectorAll(".btn_acoes_registros");
        btns.forEach( btn => {
            btn.style.display = 'none';
        })
        let loader = campo_acoes.querySelector(".loader_acoes_tabela");
        loader.style.display = "";
    }

    desativa_loader_de_um_registro(id)
    {
        let tr = this.busca_tr_por_id(id);
        let campo_acoes = tr.querySelector("[data-nome_campo=acoes]");
        let btns = campo_acoes.querySelectorAll(".btn_acoes_registros");
        btns.forEach( btn => { 
            btn.style.display = '';
        });
        let loader = campo_acoes.querySelector(".loader_acoes_tabela");
        loader.style.display = "none";
    }

    trocar_de_pagina(event){
        let numero_pagina = Number(event.target.dataset.numero_pagina);

        this.pagina_exibida = numero_pagina;

        this.escreve_registros_no_tbody();

    }

    avancar_pagina(event){

        if(this.pagina_exibida +1 == this.qtde_paginas){
            return;
        }

        this.pagina_exibida++;

        this.escreve_registros_no_tbody();

    }

    voltar_pagina(event){

        if(this.pagina_exibida == 0){
            return;
        }

        this.pagina_exibida--;

        this.escreve_registros_no_tbody();
    }

    ativa_btn_pagina(){
        let btns = document.querySelectorAll("."+this.classes.class_btn_numero_pagina);
        btns.forEach((btn)=>{
            btn.classList.remove(this.classes.class_btn_paginacao_selecionado);
        });

        let btn = document.querySelector(`#${this.classes.class_btn_numero_pagina}-${this.pagina_exibida}`);
        

        btn.classList.add(this.classes.class_btn_paginacao_selecionado);

    } 
}