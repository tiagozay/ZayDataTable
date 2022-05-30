class AcaoRegistro
{
    constructor(Node_botao, funcao_click)
    {
        if(!(Node_botao instanceof Node)){
            throw new TypeError("Botão deve ser do tipo Node");
        }else if((typeof funcao_click) != 'function'){
            throw new TypeError("Função incorreta")
        }
        this._botao = Node_botao;
        this._funcao_click = funcao_click;
    }

    get botao()
    {
        return this._botao;
    }

    get funcao_click()
    {
        return this._funcao_click;
    }
    
}