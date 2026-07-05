import { Result } from '../../core/logic/Result.js';
import type { ICategoriaDTO } from '../../dto/ICategoriaDTO.js';

export default interface IIACategorizacaoService {
    suggestCategory(description: string): Promise<Result<ICategoriaDTO>>;
}
