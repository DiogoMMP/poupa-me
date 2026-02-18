export interface ContasModel {
  id: string;
  userId?: string;
  nome: string;
  icon: string;
  saldo: {
    valor: number;
    moeda: string;
  };
  bancoId: string;
}
