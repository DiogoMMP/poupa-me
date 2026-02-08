import type {Categoria} from "../../domain/Categoria/Entities/Categoria.js";

export default interface ICategoriaRepo {
    save(categoria: Categoria): Promise<Categoria>;
    update(categoria: Categoria, nome: string): Promise<Categoria>;
    deleteByName(nome: string): Promise<void>;
    findByName(name: string): Promise<Categoria | null>;
    findAll(): Promise<Categoria[]>;
    findById(id: string): Promise<Categoria | null>;
}