# Análise competitiva — 15 de novembro de 2026

## Cobertura e significado

O índice público consultado contém 342 páginas. As 342 foram coletadas com HTTP 200 e têm URL, data de coleta e SHA-256 registrados no manifesto. Houve revisão direcionada de 38 páginas centrais e leitura complementar dos limites relevantes. **Coleta não equivale a leitura aprofundada de todas as páginas nem a teste de todas as funcionalidades.**

A conta Lovable conectada confirmou um workspace e quatro projetos, em leitura. Nenhum desses projetos é a plataforma concorrente; seus dados privados não foram incorporados neste repositório. Não foram criados projetos, disparadas gerações pagas ou feitas publicações no Lovable.

Não há acesso ao servidor, prompts privados, modelos, custos internos ou código da plataforma Lovable. Detalhes abaixo são declarações da documentação pública, não resultados de testes independentes.

## Inventário funcional

- Produto: workspace, projetos, chats, editor, preview, histórico e drafts.
- Construção: Chat/Plan/Build, tarefas por objetivo e investigação com subagentes.
- Contexto: instruções, memória por escopo, AGENTS.md, skills e referência entre projetos.
- Design: edição no preview, tokens, biblioteca de componentes e design systems versionados.
- Backend: dados, autenticação, arquivos, funções, logs e tarefas agendadas.
- Integrações: conectores, gateway, credenciais gerenciadas, MCP, API e sincronização Git.
- Verificação: navegador, testes de frontend/backend, análise de segurança e Trust center.
- Operação: publicação, domínios, analytics, monitoramento, créditos e limites.

## Achados com consequência para o produto

| Achado documentado                                                                                               | Fonte                                                                                                                           | Oportunidade proposta                                                       | Como comprovar nossa implementação                                  |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Drafts compartilham backend e dados; apagar o draft não desfaz gravações                                         | [Drafts](https://docs.lovable.dev/features/drafts.md)                                                                           | Preview com dados separados por padrão                                      | Gravar em A; comprovar ausência no principal e em B                 |
| Drafts ainda não aparecem como branches no Git sync                                                              | [Limitações dos drafts](https://docs.lovable.dev/features/drafts.md#limitations)                                                | Branch/worktree como unidade da mudança                                     | Conferir remoto, commit e diff por preview                          |
| Reverter versão restaura código e funções, mas não dados do banco                                                | [Histórico](https://docs.lovable.dev/features/projects/history.md)                                                              | Recuperação com plano de código e plano de dados separados                  | Simular migração e documentar restauração ou avanço corretivo       |
| Limites são avaliados após registrar consumo e podem ser ligeiramente excedidos                                  | [Limites](https://docs.lovable.dev/features/usage-limits-and-alerts.md#limitations)                                             | Reserva de orçamento antes de iniciar trabalho pago                         | Disparar tarefas concorrentes e comprovar soma dentro do limite     |
| Testes no navegador têm limites para canvas, interação complexa e detalhes visuais; login externo tem restrições | [Browser testing](https://docs.lovable.dev/features/browser-testing.md#limitations)                                             | Verificadores específicos por tipo de aplicação                             | Casos próprios de canvas e autenticação, com estados instrumentados |
| Monitoramento pode ter falsos positivos e não corrige automaticamente                                            | [Monitoramento](https://docs.lovable.dev/features/project-monitoring.md)                                                        | Achado associado a reprodução e regressão                                   | Repetir cenário; teste falha antes e passa após a mudança           |
| Regras técnicas ficam em AGENTS.md; memória pessoal e de projeto têm escopos distintos                           | [Memória](https://docs.lovable.dev/features/memory.md)                                                                          | Memória rastreável, editável e com resolução de conflito                    | Mostrar origem, versão, escopo e alteração aplicada                 |
| Design system inclui componentes, esquema, tokens e verificação de adesão                                        | [Design systems](https://docs.lovable.dev/features/design-systems.md)                                                           | Tratar consistência visual como contrato verificável                        | Detectar desvio e vincular resultado à versão da biblioteca         |
| Há migração documentada de React/Vite para TanStack Start                                                        | [Migração](https://docs.lovable.dev/features/upgrade-to-tanstack-start.md)                                                      | Modernização avaliada por aplicação, sem migração automática indiscriminada | Comparar rotas, login, renderização, preview e desempenho           |
| MCP e REST têm superfícies e pré-requisitos diferentes                                                           | [MCP](https://docs.lovable.dev/integrations/lovable-mcp-server.md), [API](https://docs.lovable.dev/integrations/lovable-api.md) | API/MCP do nosso produto compartilhando contratos de domínio                | Mesma operação, autorização e resultado nas duas interfaces         |

As oportunidades são hipóteses de valor, não prova de exclusividade de mercado ou de superioridade. A ausência de uma capacidade nas páginas consultadas não prova sua inexistência.

## Posicionamento inicial

Entregar mudanças em aplicações existentes com comprovação: branch identificada, dados de teste separados, orçamento reservado e evidências vinculadas ao commit. Os recursos básicos de chat, preview, histórico e exportação são base competitiva; não são diferenciais suficientes.

Começar com equipes pequenas e agências que precisam revisar e manter aplicações. Validar a hipótese com tarefas equivalentes e usuários reais antes de ampliar o escopo para todos os recursos do Lovable.

## Ferramentas avaliadas

- Craft Anything: distribuição oficial 0.6.1, checksum verificado. A abertura do navegador privado falhou por configuração do sandbox do ambiente. Uma inspeção por CDP registrou intersticial de certificado, não a aplicação.
- REA: npm 6.9.0. A descoberta CDP funcionou; a inspeção retornou `target_not_allowed`.
- Os erros acima não demonstram falhas do Lovable. Não foram contornadas autenticação ou validação TLS.
- O produto Forge Studio não integra essas ferramentas nesta versão.

## O que aproveitar agora

A base implementa especificações com identidade, revisão por evidências e núcleo de orçamento. Isolamento real, execução automática, Git e agente integrado continuam no roadmap. Não anunciar esses itens como prontos apenas porque estão descritos na arquitetura.
