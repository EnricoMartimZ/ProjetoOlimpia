"""
Rotas públicas (sem autenticação).

Servem o formulário que o cidadão/dono de hospedagem acessa pelo link
`/pesquisa/{edicaoId}`. Os endpoints de envio de resposta ficam em `respostas.py`.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.edicao import PublicEdicaoOut
from app.schemas.pesquisa import CampoOut
from app.services.edicao import campos_combinados, edicao_aberta, load_edicao_com_campos

router = APIRouter(prefix="/publico", tags=["publico"])


@router.get(
    "/edicoes/{edicao_id}",
    response_model=PublicEdicaoOut,
    summary="Formulário público de uma edição",
    description=(
        "Retorna o formulário de uma edição (campos fixos + extras) sem exigir "
        "autenticação. Usado pela página pública acessada via link `/pesquisa/{edicaoId}`."
    ),
    responses={404: {"description": "Edição não encontrada."}},
)
def formulario_publico(edicao_id: int, db: Session = Depends(get_db)):
    edicao = load_edicao_com_campos(db, edicao_id)
    if not edicao:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Edição não encontrada.")

    return PublicEdicaoOut(
        edicao_id=edicao.id,
        pesquisa_id=edicao.pesquisa_id,
        pesquisa_nome=edicao.pesquisa.nome,
        descricao=edicao.pesquisa.descricao,
        numero_edicao=edicao.numero_edicao,
        data_abertura=edicao.data_abertura,
        data_fechamento=edicao.data_fechamento,
        aberta=edicao_aberta(edicao),
        campos=[CampoOut.model_validate(c) for c in campos_combinados(edicao)],
    )
