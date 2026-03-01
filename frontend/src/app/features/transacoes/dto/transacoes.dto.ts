import {CartoesCreditoDTO} from '../../cartoes-credito/dto/cartoes-credito.dto';
import {ContasDto} from '../../contas/dto/contas.dto';

// Date components
export interface DataProps {
  dia: number;
  mes: number;
  ano: number;
}

// Money representation
export interface DinheiroProps {
  valor: number;
  moeda: string;
}

// Category structure
export interface CategoriaProps {
  id?: string;
  nome: string;
  icon: string;
}

// Transaction DTO returned by the API
export interface TransacoesDTO {
  id: string;
  data: DataProps;
  descricao: string;
  valor: DinheiroProps;
  tipo: string;
  categoria: CategoriaProps;
  status: string;
  conta?: ContasDto;
  cartaoCredito?: CartoesCreditoDTO;
  userId: string;
}

// Payload for creating transactions
export interface TransacoesInputDTO {
  data: DataProps;
  descricao: string;
  valor: DinheiroProps;
  categoriaId: string;
  contaId?: string;
  cartaoCreditoId?: string;
  contaDestinoId?: string; // Only for monthly expense - destination account id
  userId?: string; // normally set by the server from authenticated user
}

export interface TransacoesReembolsoDTO {
  data: DataProps;
  descricao: string;
  valor: DinheiroProps;
  categoriaId: string;
  contaId?: string;
  cartaoCreditoId?: string;
  userId?: string;
}

export interface TransacoesUpdateDTO {
  data?: DataProps;
  descricao?: string;
  valor?: DinheiroProps;
  tipo?: string;
  categoriaId?: string;
  status?: string;
  contaId?: string;
  cartaoCreditoId?: string;
  contaDestinoId?: string; // For monthly expense
}
