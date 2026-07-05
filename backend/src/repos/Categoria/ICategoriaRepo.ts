import type {Categoria} from "../../domain/Categoria/Entities/Categoria.js";

export default interface ICategoriaRepo {
    save(categoria: Categoria): Promise<Categoria>;
    update(categoria: Categoria, id: string): Promise<Categoria>;
    deleteById(id: string): Promise<void>;
    findAll(): Promise<Categoria[]>;
    findById(id: string): Promise<Categoria | null>;
}