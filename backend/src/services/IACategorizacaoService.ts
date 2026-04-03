import { Service, Inject } from 'typedi';
import { InferenceClient } from "@huggingface/inference";
import config from '../config/index.js';
import { Result } from '../core/logic/Result.js';
import { Guard } from '../core/logic/Guard.js';
import type ICategoriaRepo from '../repos/IRepos/ICategoriaRepo.js';
import type IIACategorizacaoService from './IServices/IIACategorizacaoService.js';
import type { ICategoriaDTO } from '../dto/ICategoriaDTO.js';
import { CategoriaMap } from '../mappers/CategoriaMap.js';

@Service()
export default class AICategorizationService implements IIACategorizacaoService {
    private client: InferenceClient;

    constructor(
        @Inject('CategoriaRepo') private categoriaRepo: ICategoriaRepo,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void, info: (...args: unknown[]) => void }
    ) {
        // Initialize the client with your HF_TOKEN
        this.client = new InferenceClient(config.ai.hfToken);
    }

    /**
     * Suggests a category for a given transaction description using AI.
     * It fetches existing categories from the DB to use as candidate labels.
     */
    public async suggestCategory(description: string): Promise<Result<ICategoriaDTO>> {
        try {
            // 1. Logic Guard
            const guardResult = Guard.againstNullOrUndefined(description, 'description');
            if (!guardResult.succeeded) {
                return Result.fail<ICategoriaDTO>(guardResult.message || 'Descrição inválida');
            }

            // 2. Get your real categories from DB
            const categorias = await this.categoriaRepo.findAll();
            if (categorias.length === 0) {
                 return Result.fail<ICategoriaDTO>('Nenhuma categoria encontrada na base de dados para comparar.');
            }
            
            // Filter out "Sem Categoria" so AI doesn't pick it
            const activeCategories = categorias.filter(c => c.nome.value !== 'Sem Categoria');
            const labels = activeCategories.map(c => c.nome.value).join(', ');

            // 3. The "Brain" call
            const chatCompletion = await this.client.chatCompletion({
                model: config.ai.model,
                messages: [
                    {
                        role: "system",
                        content: `Tu és o motor de IA da app "Poupa-me". 
                        O teu objetivo é ler uma descrição de despesa e escolher a melhor categoria.
                        Categorias disponíveis: [${labels}].
                        Usa a categoria "Outros" apenas em último caso, se nenhuma das outras for adequada.
                        Responde APENAS com o nome da categoria exato. Não uses pontuação.`
                    },
                    {
                        role: "user",
                        content: `A despesa é: "${description}"`
                    },
                ],
                max_tokens: 15,
            });

            const suggestion = chatCompletion.choices[0]?.message?.content;

            if (!suggestion) return Result.fail<ICategoriaDTO>('AI_RETURNED_EMPTY');

            // Clean up potentially trailing punctuation like dots
            const cleanSuggestion = suggestion.trim().replace(/[^\w\sÀ-ú]/gi, '').trim();
            
            this.logger.info(`Sugestão da IA para "${description}": ${cleanSuggestion}`);

            // 4. Find the full category object and return as DTO
            const suggestedCategory = categorias.find(c => c.nome.value.toLowerCase() === cleanSuggestion.toLowerCase()) 
                                        || categorias.find(c => c.nome.value === 'Outros');
                                        
            if (!suggestedCategory) {
                 return Result.fail<ICategoriaDTO>('Erro interno ao mapear categoria sugerida.');
            }

            return Result.ok<ICategoriaDTO>(CategoriaMap.toDTO(suggestedCategory));

        } catch (e) {
            this.logger.error('AICategorizationService error: %o', e);
            return Result.fail<ICategoriaDTO>('AI_SERVICE_UNAVAILABLE');
        }
    }
}
