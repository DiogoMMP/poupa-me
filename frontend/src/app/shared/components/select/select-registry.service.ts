import { Injectable } from '@angular/core';

/**
 * Coordena os `<app-select>` da página para garantir que só um está aberto de cada vez: quando um
 * abre, fecha o que estivesse aberto antes. Necessário porque cada `app-select` intercepta o seu
 * próprio clique (`stopPropagation`), o que impede o listener de "clique fora" dos outros de disparar
 * quando se clica diretamente no gatilho de um `app-select` diferente.
 */
@Injectable({ providedIn: 'root' })
export class SelectRegistryService {
  private openSelect: { close(): void } | null = null;

  /**
   * Regista `select` como o dropdown atualmente aberto, fechando o anterior (se for outro).
   */
  register(select: { close(): void }): void {
    if (this.openSelect && this.openSelect !== select) {
      this.openSelect.close();
    }
    this.openSelect = select;
  }

  /**
   * Remove `select` do registo, caso seja o que está atualmente marcado como aberto.
   */
  unregister(select: { close(): void }): void {
    if (this.openSelect === select) {
      this.openSelect = null;
    }
  }
}
