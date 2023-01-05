export class AcaoRegistro
{
    constructor(
        private _botao: HTMLElement, 
        private _funcao: EventListenerOrEventListenerObject
    ){}    

    get botao()
    {
        return this._botao;
    }

    get funcao_click(): EventListenerOrEventListenerObject
    {
        return this._funcao;
    }

}

export class AcaoDiferenteParaCadaRegistro
{
    constructor(
        public _callbackDecisora: Function, 
        public _acoesRegistros: Array<AcaoRegistro>
    ){}
}


export class CampoDosRegistros
{
    constructor(
        private _nomeDoCampo: string,
        private _campoNoObjeto: string,
        private _geradorValorPersonalizado: ((value: string) => string) | null = null
    ){}

    get nomeDoCampo(): string
    {
        return this._nomeDoCampo;
    }

    get campoNoObjeto(): string
    {
        return this._campoNoObjeto;
    }

    get geradorValorPersonalizado(): ((value: string) => string) | null
    {
        return this._geradorValorPersonalizado;
    }
}

export class ZayDataTable
{
    private thead: HTMLElement;
    private tbody: HTMLElement;
    private tfoot: HTMLElement;

    private nome_tabela: string;
    private tabela: HTMLTableElement;
    private campos: Array<CampoDosRegistros>; 
    private campo_id: string;
    private dados: Array<Object>; 
    private lista_acoes: Array<AcaoRegistro | AcaoDiferenteParaCadaRegistro> | null; 
    private loader_acoes: HTMLElement | null;
    private qtde_registros_por_pagina: number | false;

    private nav_btns_paginacao: HTMLElement;
    private btn_voltar_pagina: HTMLElement;
    private btn_avancar_pagina: HTMLElement;
    private dados_divididos_em_paginas: Array<Array<Object>>;

    private paginacao: boolean;

    private qtde_paginas: number = 0;
    private pagina_exibida: number = 0;

    private _indicador_de_primeira_vez: boolean;

    //Eventos
    public onAdvanceOrRetreatPage: Function | null = null;
    public onChangePage: Function | null = null;
    public onWriteRegisters: Function | null = null;

    constructor(
        nome_tabela: string,
        tabela: HTMLTableElement,
        campos: Array<CampoDosRegistros>, 
        campo_id: string,
        dados: Array<Object>, 
        lista_acoes: Array<AcaoRegistro | AcaoDiferenteParaCadaRegistro> | null, 
        loader_acoes: HTMLElement | null,
        qtde_registros_por_pagina: number | false
    ){
        this.nome_tabela = nome_tabela;
        this.tabela = tabela;
     
        this.campos = campos;
        this.campo_id = campo_id;

        if(lista_acoes &&  lista_acoes.length > 0){
            this.campos.push(new CampoDosRegistros("Ações", 'acoes'));
        }
        this.lista_acoes = lista_acoes;
        this.loader_acoes = loader_acoes;

        this.paginacao = true;

        if(qtde_registros_por_pagina === false){
            this.qtde_registros_por_pagina = dados.length;
            this.paginacao = false;
        }else{
            this.qtde_registros_por_pagina = qtde_registros_por_pagina;
        }
    

        this._indicador_de_primeira_vez = true;

        this.gera_tfoot();
        this.adiciona_dados_que_serao_escritos(dados);
        this.gera_thead();
        this.gera_tbody();
    }   

    private adiciona_dados_que_serao_escritos(dados: Array<Object>){
        this.dados = dados;
        this.dados_divididos_em_paginas = this.divide_dados_em_paginas();
    }

    private verifica_se_objeto_possui_campos_corretos(objeto_registro: Object)
    {
        if(this.campos.length <= 0){
            return;
        }

        //Adiciona o campo id para verificar se corresponte também
        const campo_id_provisorio = new CampoDosRegistros('id', this.campo_id);
        this.campos.push(campo_id_provisorio);

        this.campos.forEach( campo => {
            
            let campo_no_objeto = campo.campoNoObjeto;

            if(campo_no_objeto != 'acoes'){

                if(! (campo_no_objeto in objeto_registro) ){

                    if(this._indicador_de_primeira_vez){
                        throw new Error(`O objeto ${JSON.stringify(objeto_registro)} não contém a propriedade: "${campo_no_objeto}"`);
                    } 

                    throw new Error("Atualizar: Objeto não corresponde com os que foram passados inicialmente!");

                }
                
            }

        } );

        //Remove o campo id adicionado acima;
        this.campos.pop();
    }

    private gera_thead(){

        let thead = document.createElement("thead");

        let tr_thead = document.createElement("tr");
        tr_thead.classList.add(`${this.nome_tabela}__tr_thead`)
        
        this.campos.forEach( campo => {

            let td = document.createElement("td");

            td.classList.add(
                `zayDataTable_${campo.campoNoObjeto}`,
                `${this.nome_tabela}__td_thead`, 
                `${this.nome_tabela}-${campo.campoNoObjeto}`
            );

            td.textContent = campo.nomeDoCampo;
            tr_thead.appendChild(td);

        } )

        thead.appendChild(tr_thead);
    
        this.tabela.appendChild(thead);

        this.thead = thead;
    }

    private gera_tbody(){
        let tbody = document.createElement("tbody");

        this.tbody = tbody;

        this.escreve_registros_no_tbody();
    
        this.tabela.appendChild(tbody);

    }

    private gera_tfoot(){
        let tfoot = document.createElement("tfoot");

        let tr = document.createElement('tr');

        let td = document.createElement('td');
        td.setAttribute("colspan", String(Object.keys(this.campos).length));

        let nav = document.createElement("nav");
        nav.classList.add(
            `zayDataTable__nav_paginacao`,
            `${this.nome_tabela}__nav_paginacao`,
        );
        //Nav já começa aculta, só é exibida se tiver registros
        nav.style.display = 'none';

        this.nav_btns_paginacao = nav;
        
        td.appendChild(nav);
        tr.appendChild(td);
        tfoot.appendChild(tr);

        this.tabela.appendChild(tfoot);

        this.tfoot = tfoot;

    }

    private escreve_registros_no_tbody = () => {

        this.tbody.innerHTML = "";

        if(this.dados.length == 0){
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
        }else{
            this.nav_btns_paginacao.style.display = 'flex';
        }

        if(this.paginacao){
            this.ativa_btn_pagina();

            if(this.pagina_exibida == 0){
                this.btn_voltar_pagina.classList.add(
                    'zayDataTable__btn_paginacao_desativado',
                    `${this.nome_tabela}__btn_paginacao_desativado`
                );
            }else{
                this.btn_voltar_pagina.classList.remove(
                    'zayDataTable__btn_paginacao_desativado',
                    `${this.nome_tabela}__btn_paginacao_desativado`
                );
            }
    
            if(this.pagina_exibida + 1 == this.qtde_paginas){
                this.btn_avancar_pagina.classList.add(
                    'zayDataTable__btn_paginacao_desativado',
                    `${this.nome_tabela}__btn_paginacao_desativado`
                );
            }else{
                this.btn_avancar_pagina.classList.remove(
                    'zayDataTable__btn_paginacao_desativado',
                    `${this.nome_tabela}__btn_paginacao_desativado`
                );
            }
        }
      
        let registros_para_escrever = this.dados_divididos_em_paginas[this.pagina_exibida]; 
    
        registros_para_escrever.forEach((objeto: object)=>{
            //Lança erro se não for um objeto correto
            this.verifica_se_objeto_possui_campos_corretos(objeto);

            let tr = document.createElement("tr");
            tr.classList.add(`${this.nome_tabela}__tr_tbody`);

            tr.dataset.id = objeto[this.campo_id as keyof object];

            tr.id = `${this.nome_tabela}ID-${objeto[this.campo_id as keyof object]}`;

            this.campos.forEach( campo => {

                let td = document.createElement("td");

                let campo_no_objeto = campo.campoNoObjeto;

                td.classList.add(
                    `zayDataTable_${campo_no_objeto}`, 
                    `${this.nome_tabela}__td_tbody`, 
                    `${this.nome_tabela}-${campo_no_objeto}`
                );

                if(campo_no_objeto == 'acoes'){
                    
                    if(this.lista_acoes){
                        this.lista_acoes.forEach((objeto_acao)=>{

                            if(objeto_acao instanceof AcaoDiferenteParaCadaRegistro){
                                const indiceDeQualAcaoUsar = objeto_acao._callbackDecisora(objeto);
    
                                objeto_acao = objeto_acao._acoesRegistros[indiceDeQualAcaoUsar];
                            }
    
                            let botao = objeto_acao.botao as HTMLElement;
                            let funcao = objeto_acao.funcao_click;
    
                            const novo_botao = botao.cloneNode(true) as HTMLElement;
    
                            novo_botao.addEventListener("click", funcao);
    
                            novo_botao.dataset.id = objeto[this.campo_id as keyof object];
    
                            novo_botao.classList.add("btn_acoes_registros");
    
                            td.appendChild(novo_botao);
    
                        });
    
                        if(this.loader_acoes){
                            let novo_loader = this.loader_acoes.cloneNode(true) as HTMLElement;
    
                            novo_loader.style.display = "none";
        
                            novo_loader.classList.add("loader_acoes_tabela");
        
                            td.appendChild(novo_loader);
                        }
                    }

                }else{

                    if(campo.geradorValorPersonalizado){
                        td.innerHTML = campo.geradorValorPersonalizado(objeto[campo_no_objeto as keyof object]);
                    }else{
                        td.textContent = objeto[campo_no_objeto as keyof object];
                    }
      
                }

                tr.appendChild(td);

            } )

            this.tbody.appendChild(tr);

        });

        //Define o indicador para false pois nesse momento indica que a tabela já foi constuída
        this._indicador_de_primeira_vez = false;

        if(this.onWriteRegisters){
            this.onWriteRegisters();
        }
    }

    private busca_registro_no_array_de_dados_pelo_id = function(id: string){
        return this.dados.find((registro: object)=>{
            return registro[this.campo_id as keyof object] == id;
        });
    }

    private busca_registro_no_array_de_dados_divididos_pelo_id = function(id: string){
        return this.dados_divididos_em_paginas[this.pagina_exibida].find((registro: object)=>{
            return registro[this.campo_id as keyof object] == id;
        });
    }


    private busca_tr_por_id(id: string)
    {
        return document.querySelector(`#${this.nome_tabela}ID-${id}`) as HTMLElement;
    }

    public limpa_lista(){
        this.dados = [];
        this.dados_divididos_em_paginas = [];
        this.qtde_paginas = 0;
        this.pagina_exibida = 0;
        this.escreve_registros_no_tbody();
    }

    private adiciona_id_na_funcao_btn = function(string_btn: string, id: string){
        let string_dividida = string_btn.split('(');
        return `${string_dividida[0]}(${id}${string_dividida[1]}`;
    }

    private gera_botoes_paginacao(){

        if(!this.paginacao){
            return;
        }

        this.nav_btns_paginacao.innerHTML = "";

        let btn_voltar = document.createElement("a");
        btn_voltar.classList.add(
            'zayDataTable__btn_voltar_e_avancar_pagina',
            `${this.nome_tabela}__btn_voltar_e_avancar_pagina`,
            'material-icons'
        );
        btn_voltar.addEventListener("click", () => this.voltar_pagina());
        btn_voltar.textContent = 'arrow_back_ios_new';

        this.nav_btns_paginacao.appendChild(btn_voltar);

        this.btn_voltar_pagina = btn_voltar;
            
        for(let i = 0; i < this.qtde_paginas; i++){
            let btn = document.createElement("a");
            btn.classList.add(
                `zayDataTable__btnNumeroPaginacao`,
                `${this.nome_tabela}__btn_numero_pagina`
            );
            btn.textContent = `${i+1}`;
            btn.id = `${this.nome_tabela}__btn_numero_pagina-${i}`;
            btn.dataset.numero_pagina = `${i}`;
            btn.addEventListener("click", event =>  this.trocar_de_pagina(event));

            this.nav_btns_paginacao.appendChild(btn);
        }

        let btn_avancar = document.createElement("a");
        btn_avancar.classList.add(
            'zayDataTable__btn_voltar_e_avancar_pagina',
            `${this.nome_tabela}__btn_voltar_e_avancar_pagina`,
            'material-icons'
        );
        btn_avancar.addEventListener("click", () =>  this.avancar_pagina());
        btn_avancar.textContent = 'arrow_forward_ios';

        this.nav_btns_paginacao.appendChild(btn_avancar);

        this.btn_avancar_pagina = btn_avancar;
    }

    private divide_dados_em_paginas(){

        this.qtde_paginas = Math.ceil(this.dados.length / (this.qtde_registros_por_pagina as number) );

        let dados_divididos_em_paginas = [];

        let start = 0;

        for(let i = 0; i < this.qtde_paginas; i++){
            dados_divididos_em_paginas.push(
                this.dados.slice(start, start + (this.qtde_registros_por_pagina as number) )
            );
            start += (this.qtde_registros_por_pagina as number);
        }   

        this.gera_botoes_paginacao();

        return dados_divididos_em_paginas;
    }

    public atualiza_registros(dados: Array<object>){

        this.adiciona_dados_que_serao_escritos(dados);

        if(this.pagina_exibida +1 > this.qtde_paginas){
            this.pagina_exibida = 0;
        }

        this.escreve_registros_no_tbody();
    }
    
    public remove_registro(id: string){
        let tempo_opacidade_ms = 500;

        let tr: HTMLElement = this.busca_tr_por_id(id) as HTMLElement;

        tr.style.transition = tempo_opacidade_ms+"ms";
        tr.style.opacity = '0.0';
        setTimeout(()=>{
            tr.remove();
        }, tempo_opacidade_ms);

        this.remove_registro_do_array_de_dados(id);
        this.remove_registro_do_array_de_dados_divididos(id);

    }

    private remove_registro_do_array_de_dados(id: string)
    {
        let registro_excluido = this.busca_registro_no_array_de_dados_pelo_id(id);

        let indice_registro_excluido = this.dados.indexOf(registro_excluido);
    
        this.dados.splice(indice_registro_excluido, 1);
    }

    private remove_registro_do_array_de_dados_divididos(id: string)
    {
        let array_da_pagina = this.dados_divididos_em_paginas[this.pagina_exibida];

        let registro_excluido = this.busca_registro_no_array_de_dados_divididos_pelo_id(id);

        let indice_registro_excluido = array_da_pagina.indexOf(registro_excluido);
    
        array_da_pagina.splice(indice_registro_excluido, 1);
    }

    public atualiza_registro(objeto_registro: object)
    {

        //Lança erro se não for um objeto correto
        this.verifica_se_objeto_possui_campos_corretos(objeto_registro);

        let id = objeto_registro[this.campo_id as keyof object];

        let registro_na_lista = this.busca_registro_no_array_de_dados_pelo_id(id);

        let tr = this.busca_tr_por_id(id) as Element;

        this.campos.forEach( campo => {

            let campo_no_objeto = campo.campoNoObjeto;

            let td = tr.querySelector(`.${this.nome_tabela}-${campo_no_objeto}`) as Element;

            if(campo_no_objeto != 'acoes'){
                td.textContent = objeto_registro[campo_no_objeto as keyof object];
                registro_na_lista[campo_no_objeto] = objeto_registro[campo_no_objeto as keyof object];
            }

        } );
    }

    public ativa_loader_de_um_registro(id: string)
    {
        if(!this.lista_acoes || this.lista_acoes.length == 0 || !this.loader_acoes){
            return;
        }

        let tr = this.busca_tr_por_id(id) as Element;
        let campo_acoes = tr.querySelector(`.${this.nome_tabela}-acoes`) as Element;
        let btns = campo_acoes.querySelectorAll<HTMLButtonElement>(".btn_acoes_registros");
        btns.forEach( btn => {
            btn.style.display = 'none';
        })
        let loader = campo_acoes.querySelector(".loader_acoes_tabela") as HTMLElement;
        loader.style.display = "";
    }

    public desativa_loader_de_um_registro(id: string)
    {
        if(!this.lista_acoes || this.lista_acoes.length == 0 || !this.loader_acoes){
            return;
        }

        let tr = this.busca_tr_por_id(id) as Element;
        let campo_acoes = tr.querySelector(`.${this.nome_tabela}-acoes`) as Element;
        let btns = campo_acoes.querySelectorAll<HTMLButtonElement>(".btn_acoes_registros");
        btns.forEach( btn => { 
            btn.style.display = '';
        });
        let loader = campo_acoes.querySelector(".loader_acoes_tabela") as HTMLElement;
        loader.style.display = "none";
    }

    private trocar_de_pagina(event: Event){
        let elelementoClicado: HTMLElement = event.target as HTMLElement;

        let numero_pagina = Number(elelementoClicado.dataset.numero_pagina);

        this.pagina_exibida = numero_pagina;

        this.escreve_registros_no_tbody();

        if(this.onChangePage){
            this.onChangePage();
        }

    }

    private avancar_pagina(){

        if(this.pagina_exibida +1 == this.qtde_paginas){
            return;
        }

        this.pagina_exibida++;

        this.escreve_registros_no_tbody();

        if(this.onAdvanceOrRetreatPage){
            this.onAdvanceOrRetreatPage();
        }

    }

    private voltar_pagina(){

        if(this.pagina_exibida == 0){
            return;
        }

        this.pagina_exibida--;

        this.escreve_registros_no_tbody();

        if(this.onAdvanceOrRetreatPage){
            this.onAdvanceOrRetreatPage();
        }
    }

    private ativa_btn_pagina(){

        if(!this.paginacao){
            return;
        }

        const btnAtivado = document.querySelector('.zayDataTable__btnPaginacaoAtivado');

        if(btnAtivado){
            btnAtivado.classList.remove(
                `zayDataTable__btnPaginacaoAtivado`,
                `${this.nome_tabela}__btn_paginacao_selecionado`
            );
        }
       

        let btn = document.querySelector(`#${this.nome_tabela}__btn_numero_pagina-${this.pagina_exibida}`) as Element;
        
        btn.classList.add(
            `zayDataTable__btnPaginacaoAtivado`,
            `${this.nome_tabela}__btn_paginacao_selecionado`
        );

    } 
}

