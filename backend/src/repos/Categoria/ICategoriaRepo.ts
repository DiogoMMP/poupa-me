import type {Categoria} from "../../domain/Categoria/Entities/Categoria.js";

export default interface ICategoriaRepo {
    save(categoria: Categoria): Promise<Categoria>;
    update(categoria: Categoria, id: string): Promise<Categoria>;
    deleteById(id: string): Promise<void>;
    findAll(includeInactive?: boolean): Promise<Categoria[]>;
    findById(id: string): Promise<Categoria | null>;
    findActiveById(id: string): Promise<Categoria | null>;
}