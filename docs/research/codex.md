# Codex — análise pública e evolução original do Forge

Data: 15 de novembro de 2026.

## Cobertura real

O link local informado pelo usuário retornou HTTP 200 na consulta anônima, mas não revelou conteúdo legível pela ferramenta de leitura. Isso não confirma acesso à sessão, ao editor ou ao aplicativo autenticado. O identificador local foi removido da captura antes de sua análise e publicação.

REA 6.9.0 e Craft Anything 0.6.1 analisaram com sucesso uma captura de dois registros HTTP: o endereço local com identificador redigido e a página pública do repositório. Esses registros não incluem execução de scripts, cookies ou conteúdos de respostas. Evidências: [manifesto](evidence/codex/manifest.json). A cobertura completa do arquivo não significa cobertura completa do Codex.

Para entender o código que está publicado, a leitura direta de fonte é mais precisa e rápida que tentar inferir sua implementação pela interface. Foram consultados cinco arquivos do repositório [openai/codex](https://github.com/openai/codex), no commit `ee344ca9458351a6ea102795fa73110ad3ede5dc`. Caminhos, URLs fixadas e SHA-256 constam no [manifesto de fontes](codex-source-manifest.json).

Não foram analisados binários locais da instalação do usuário nem acessados históricos privados, prompts internos, modelos ou serviços proprietários do ChatGPT. Codex CLI aberto e produto completo ChatGPT/Codex não são a mesma superfície. Não incorporamos código do Codex ao Forge.

## Achados e decisões

| Observação                                                                               | Fonte                                                                                                                                                                                                                                                                                                                      | Consequência para o Forge                                           | Estado                                                |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| O CLI tem código público, com distribuição identificável                                 | [Repositório](https://github.com/openai/codex)                                                                                                                                                                                                                                                                             | Separar código aberto observável de serviços internos desconhecidos | Pesquisa                                              |
| App-server documenta mensagens estruturadas e erros JSON-RPC                             | [README fixado](https://github.com/openai/codex/blob/ee344ca9458351a6ea102795fa73110ad3ede5dc/codex-rs/app-server/README.md)                                                                                                                                                                                               | Contratos explícitos entre interface, execução e eventos            | Proposto; agente ainda separado do Studio             |
| O protocolo declara estados Completed, Interrupted, Failed e InProgress                  | [Turn](https://github.com/openai/codex/blob/ee344ca9458351a6ea102795fa73110ad3ede5dc/codex-rs/app-server-protocol/src/protocol/v2/turn.rs)                                                                                                                                                                                 | Não confundir plano, execução, interrupção e sucesso                | Estado de execução real ainda no backlog              |
| A fonte mantém referências específicas para execução não interativa, políticas e sandbox | [Exec](https://github.com/openai/codex/blob/ee344ca9458351a6ea102795fa73110ad3ede5dc/docs/exec.md), [política](https://github.com/openai/codex/blob/ee344ca9458351a6ea102795fa73110ad3ede5dc/docs/execpolicy.md), [sandbox](https://github.com/openai/codex/blob/ee344ca9458351a6ea102795fa73110ad3ede5dc/docs/sandbox.md) | Tratar execução, permissão e isolamento como capacidades distintas  | Proposto; nenhum modo de execução novo foi habilitado |

Um [relato público #59536](https://github.com/openai/codex/issues/59536) descreve erro de início apesar de uma tarefa aparentemente continuar. É relato, não reprodução independente; seu estado pode mudar. A lição proposta é reconciliar a identidade/estado de uma operação antes de repeti-la após erro ambíguo, não alegar uma falha atual universal do concorrente.

## Entrega concreta v0.4

`npm run repo:inspect -- /caminho/do/repositorio` registra commit, branch, arquivos rastreados e alterações staged/unstaged/untracked. Em HEAD destacado a branch é nula; em repositório vazio o commit é nulo. Estado sujo ou sem commit não é apresentado como pronto para uma verificação vinculada a commit.

O comando usa Git sem shell, com timeout e saída limitada. Desabilita fsmonitor e hooks nos comandos usados. Não executa código do projeto, não testa a aplicação e não altera Git. Não lê conteúdos, remotos, tokens ou configurações de autenticação. O hash é dos metadados, não um backup nem uma identidade completa do conteúdo não commitado. Submódulos e arquivos ignorados ficam fora da cobertura.

A inspeção é uma ferramenta CLI local; não há seleção de diretório remoto pela API nem integração automática com o agente. Seu papel é preparar a vinculação futura entre tarefa, commit e evidência. Não gera aplicativo por conta própria.

## Próximo contrato de execução

Antes de anunciar execução por agente: identificar operação e commit, validar ambiente, iniciar uma única vez, registrar eventos reais, permitir cancelamento confirmado, reconciliar resultados ambíguos e só declarar sucesso com verificadores e artefatos. Retentativa não deve ser confundida com repetição segura. Esses itens dependem das etapas de agente, autenticação e sandbox do roadmap.
