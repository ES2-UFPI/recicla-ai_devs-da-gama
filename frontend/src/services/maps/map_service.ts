import type { MapAdapter, ColetaPoint, GeoArea } from "./map_adapter";

export class MapService {
    private adapter: MapAdapter;
    constructor(adapter: MapAdapter) {
        this.adapter = adapter; 
    }

    carregarPontosColeta(bounds: GeoArea): ColetaPoint[] {
        return this.adapter.obterPontosColeta(bounds);
    }

    adicionaPonto(ponto: ColetaPoint): boolean {
        return this.adapter.exibirPonto(ponto);
    }

    removePonto(pontoId: string): boolean {
        return this.adapter.removerPonto(pontoId);
    }

    setAdapter(adapter: MapAdapter) {
        this.adapter = adapter;
    }
}