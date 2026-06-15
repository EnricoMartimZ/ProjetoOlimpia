"""Cadastra as pesquisas reais da Secretaria (pasta pesquisas_feita_pela_secretaria/)
via API. Faz parse dos .md, loga como servidor e faz POST /pesquisas.

Uso:
    python backend/scripts/seed_pesquisas.py [--api http://localhost:8000] \
        [--email carlos.almeida@olimpia.sp.gov.br] [--senha ...] [--dry-run]
"""
import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
PASTA = RAIZ / "pesquisas_feita_pela_secretaria"

# "Tipo" do campo (md) -> FieldType da API
TIPO_CAMPO = {
    "múltipla escolha": "multipla_escolha",
    "texto curto": "texto",
    "texto longo": "texto_longo",
    "data": "data",
    "número": "numero",
    "numero": "numero",
}
# "Tipo" da pesquisa (md) -> TipoPesquisa da API
TIPO_PESQUISA = {"pública": "publica", "publica": "publica", "privada": "campo", "campo": "campo"}

# Ajustes por arquivo: pula perguntas (1-based, conforme numeração do .md)
PULAR_PERGUNTAS = {
    "pesquisa_demanda_turistica.md": {1},  # "Nome do pesquisador": usuario_id já vincula
}


def parse_md(path: Path) -> dict:
    texto = path.read_text(encoding="utf-8")
    linhas = texto.splitlines()

    nome = descricao = tipo_raw = None
    for ln in linhas:
        m = re.match(r"- \*\*Nome:\*\*\s*(.+)", ln)
        if m and nome is None:
            nome = m.group(1).strip()
        m = re.match(r"- \*\*Descrição:\*\*\s*(.+)", ln)
        if m and descricao is None:
            descricao = m.group(1).strip()
        m = re.match(r"- \*\*Tipo:\*\*\s*(.+)", ln)
        if m and tipo_raw is None:
            tipo_raw = m.group(1).strip()

    tipo = TIPO_PESQUISA[tipo_raw.lower()]
    pular = PULAR_PERGUNTAS.get(path.name, set())

    # Divide em blocos de pergunta a partir dos cabeçalhos "### N"
    campos = []
    blocos = re.split(r"^### (\d+)\s*$", texto, flags=re.MULTILINE)
    # blocos = [preâmbulo, "1", corpo1, "2", corpo2, ...]
    ordem = 0
    for i in range(1, len(blocos), 2):
        num = int(blocos[i])
        corpo = blocos[i + 1]
        if num in pular:
            continue

        pergunta = re.search(r"- \*\*Pergunta:\*\*\s*(.+)", corpo)
        tipo_c = re.search(r"- \*\*Tipo:\*\*\s*(.+)", corpo)
        obrig = re.search(r"- \*\*Obrigatória:\*\*\s*(.+)", corpo)
        if not (pergunta and tipo_c):
            raise ValueError(f"{path.name}: pergunta {num} mal formada")

        ft = TIPO_CAMPO[tipo_c.group(1).strip().lower()]
        opcoes = []
        if "**Opções:**" in corpo:
            trecho = corpo.split("**Opções:**", 1)[1]
            for ln in trecho.splitlines():
                mo = re.match(r"\s{2,}- (.+)", ln)
                if mo:
                    opcoes.append(mo.group(1).strip())
                elif re.match(r"- \*\*", ln):  # próximo atributo: fim das opções
                    break

        campos.append(
            {
                "texto_pergunta": pergunta.group(1).strip(),
                "tipo": ft,
                "opcoes": opcoes,
                "obrigatorio": bool(obrig and obrig.group(1).strip().lower().startswith("sim")),
                "ordem": ordem,
            }
        )
        ordem += 1

    return {"nome": nome, "descricao": descricao or "", "tipo": tipo, "campos": campos}


def api(method: str, url: str, body=None, token=None) -> tuple[int, dict]:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read() or "null")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or "null")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default="http://localhost:8000")
    ap.add_argument("--email", default="carlos.almeida@olimpia.sp.gov.br")
    ap.add_argument("--senha", default="FQv_-UefzOwf")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    arquivos = sorted(PASTA.glob("*.md"))
    pesquisas = [parse_md(a) for a in arquivos]

    print("Pesquisas parseadas:")
    for p in pesquisas:
        print(f"  - {p['nome']}  [tipo={p['tipo']}, {len(p['campos'])} campos]")

    if args.dry_run:
        print("\n--dry-run: nada enviado.")
        return

    st, body = api("POST", f"{args.api}/auth/login", {"email": args.email, "senha": args.senha})
    if st != 200:
        sys.exit(f"Falha no login ({st}): {body}")
    token = body["access_token"]
    print(f"\nLogin OK como {args.email}")

    for p in pesquisas:
        st, body = api("POST", f"{args.api}/pesquisas", p, token=token)
        if st == 201:
            print(f"  ✓ criada id={body['id']}: {p['nome']} ({len(body['campos'])} campos)")
        elif st == 409:
            print(f"  ⚠ já existe (nome duplicado): {p['nome']}")
        else:
            print(f"  ✗ erro {st}: {p['nome']} -> {body}")


if __name__ == "__main__":
    main()
