# Qubes OS — extração e análise de fontes oficiais

Qubes OS é um sistema operacional orientado a isolamento entre domínios, não um antivírus. Esta investigação aplica REA 6.9.0 e Craft Anything CLI 0.6.1 a três componentes oficiais de sua linha `release4.3`.

## Atualidade e identidade

A página oficial de downloads consultada em 16 de novembro de 2026 indicou **4.3.2** como versão estável. Sua ISO tem 8.459.569.152 bytes e não foi baixada. Foram obtidos ZIPs integrais das fontes de três repositórios, fixados nos commits abaixo. Não foi demonstrado que esses commits correspondem exatamente aos pacotes da ISO 4.3.2.

| Componente | Commit fixado | Arquivos regulares / bytes |
| --- | --- | --- |
| qubes-core-admin | `16d5a7333423497c0dcfd4ced50a69e958b0743b` | 274 / 4.053.893 |
| qubes-core-qrexec | `205db68abd6d89dff1bc03bce8ce0c88749b7248` | 162 / 1.752.116 |
| qubes-core-admin-client | `57a4b6c6baff05217abf071452da141e5a800f33` | 178 / 2.035.854 |

Origem, hashes dos ZIPs e inventários por arquivo estão no [manifesto verificado](evidence/qubes/verified-inventory.json). Os repositórios completos são referenciados por submódulos Git, com suas licenças e avisos upstream; não são dependências do runtime do Forge.

```sh
git submodule update --init references/qubes-core-admin \
  references/qubes-core-qrexec references/qubes-core-admin-client
```

## Execução efetiva e extração

Para cada um dos três ZIPs:

```sh
rea extract-artifact /caminho/componente.zip \
  --output-root /caminho/novo-diretorio-rea --format json
craft-anything-cli --deep core-archive-extract \
  --path /caminho/componente.zip --max-files 5000 --max-bytes 50000000
craft-anything-cli --deep app-source-import \
  --path /caminho/diretorio-extraido-pelo-craft --include-hidden true \
  --respect-gitignore false --max-files 5000 \
  --max-file-bytes 4000000 --max-total-bytes 50000000
```

As nove operações terminaram com código zero. Os resultados brutos acompanham o relatório em `evidence/qubes/`; caminhos absolutos nesses registros descrevem o ambiente da coleta.

REA materializou **614 arquivos regulares**, totalizando **7.841.863 bytes**. Craft materializou **606**. A diferença são oito arquivos de teste sysfs do core-admin: o Craft recusa nomes com `:` por sua regra de segurança multiplataforma. Nenhum desses oito arquivos foi perdido na extração do REA. Os 14 links simbólicos dos arquivos ZIP foram registrados com alvo e hash e não foram materializados pelas ferramentas.

O verificador original `scripts/verify-qubes-sources.py` comparou cada arquivo regular do ZIP com a saída do REA e cada arquivo admitido pelo Craft com sua saída. Todos os bytes comparados coincidiram. O verificador também confere SHA-256 dos arquivos de origem e CRCs dos membros ZIP.

O importador de fontes do Craft examinou 260, 158 e 176 arquivos, respectivamente, declarando suas entradas ignoradas. Essa cobertura é diferente da extração e não deve ser confundida com análise semântica de todos os arquivos. O importador reconstrói detalhes JS/TS; não reconstrói a semântica de Python e C desses projetos.

Complementarmente, Python `ast.parse` analisou **284 arquivos Python**, incluindo testes: 137 no core-admin, 40 no qrexec e 107 no cliente. Foram contadas 6.306 definições de função e 788 classes. Não houve erro de parsing; um teste upstream emitiu aviso de escape de string. Esses totais incluem código de teste e não representam funcionalidades distintas do produto. O código Qubes não foi importado nem executado.

## Mecanismos examinados nas fontes

| Mecanismo | Localização no componente fixado | Observação e aplicação proposta ao Forge |
| --- | --- | --- |
| Ciclo de vida de domínio | core-admin `qubes/vm/qubesvm.py`, `QubesVM.start` | Lock de inicialização, validação de estado e eventos de falha; inspira estados explícitos e tratamento de falhas de tarefas |
| Domínios descartáveis | core-admin `qubes/vm/dispvm.py`, `DispVM`, `from_appvm`, cleanup | Modela descarte e limpeza; inspira ambientes temporários verificáveis, sem afirmar que um processo isolado equivale a VM |
| Autorização entre domínios | qrexec `qrexec/policy/parser.py`, `AbstractPolicy.find_matching_rule` e ações Allow/Ask/Deny | A primeira regra correspondente decide; ausência de regra causa AccessDenied. Inspira permissões explícitas por operação |
| Transporte entre domínios | qrexec `daemon/qrexec-daemon.c` e `agent/qrexec-agent.c` | Separação de daemon e agente; o transporte não foi testado e não se afirma segurança do protocolo completo |
| API administrativa | core-admin `qubes/api/__init__.py` e `qubes/api/admin.py` | Eventos `admin-permission` e ponto de imposição de predicados; inspira um limite de autorização no servidor |
| Cliente de administração | core-admin-client `qubesadmin/app.py` e `qubesadmin/tools/` | Cliente separado da autoridade administrativa; inspira adaptadores sem privilégios implícitos |
| Regras de rede | core-admin `qubes/firewall.py` | Objetos de regras e validação; o enforcement real não foi exercitado |

As observações são leituras direcionadas de contratos e fluxo de controle, não revisão manual de cada função. As recomendações são requisitos originais, ainda não implementados no Forge. Não houve execução de testes do Qubes, avaliação de escapes, medição de resistência a ataques ou comprovação de isolamento em hardware.

## Licenças e limites

Os submódulos preservam a árvore completa de cada commit, inclusive arquivos de licença, avisos e links. Consulte as licenças por componente e por arquivo antes de distribuir derivados; a licença MIT do Forge não substitui as licenças upstream. Não foi copiado código Qubes para o runtime autoral.

Este recorte não inclui a distribuição inteira: Xen, kernels, templates, firmware, GUI completa e demais componentes não foram extraídos ou auditados. Também não comprova cadeia de build ou assinatura de release. URLs oficiais e hashes identificam a coleta, mas não substituem validação criptográfica das assinaturas upstream. “Todos os arquivos regulares dos três ZIPs” é a cobertura alcançada; não significa “todo o Qubes OS”.
