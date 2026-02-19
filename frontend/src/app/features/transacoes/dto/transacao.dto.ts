export interface TransacaoDTO {
  id: string;
  data: {
    dia: number;
    mes: number;
    ano: number;
  };
  descricao: string;
  valor: {
    valor: number;
    moeda: string;
  };
  tipo: string;
  categoria: {
    id: string;
    nome: string;
    icon: string;
  };
  status: string;
  contaId?: string;
  cartaoCreditoId?: string;
  userId: string;
}


