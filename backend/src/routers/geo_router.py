from fastapi import APIRouter, HTTPException, Query
import requests

router = APIRouter(prefix="/geo", tags=["geo"])


@router.get("/search")
async def geo_search(q: str = Query(..., min_length=2, description="Endereço para busca (ex: Rua, número, cidade)")):
	"""
	Proxy simples para busca de endereços (forward geocoding) no Nominatim.
	Evita CORS no frontend e melhora a estabilidade/desempenho no mobile.
	"""
	try:
		resp = requests.get(
			"https://nominatim.openstreetmap.org/search",
			params={
				"format": "json",
				"q": q,
				"limit": 1,
				"countrycodes": "br",
			},
			headers={
				"User-Agent": "ReciclaAI/1.0 (localhost; dev)",
				"Accept-Language": "pt-BR,pt;q=0.9",
			},
			timeout=5,
		)
		resp.raise_for_status()
		return resp.json()
	except requests.RequestException as e:
		raise HTTPException(status_code=502, detail=f"Erro ao consultar Nominatim (search): {e}")


@router.get("/reverse")
async def geo_reverse(
	lat: float = Query(..., description="Latitude"),
	lon: float = Query(..., description="Longitude"),
):
	"""
	Proxy simples para reverse geocoding no Nominatim.
	"""
	try:
		resp = requests.get(
			"https://nominatim.openstreetmap.org/reverse",
			params={
				"format": "json",
				"lat": lat,
				"lon": lon,
				"addressdetails": 1,
			},
			headers={
				"User-Agent": "ReciclaAI/1.0 (localhost; dev)",
				"Accept-Language": "pt-BR,pt;q=0.9",
			},
			timeout=5,
		)
		resp.raise_for_status()
		return resp.json()
	except requests.RequestException as e:
		raise HTTPException(status_code=502, detail=f"Erro ao consultar Nominatim (reverse): {e}")
