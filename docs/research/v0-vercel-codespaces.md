# v0, Vercel e Codespaces — pesquisa de produto

Data: 15 de novembro de 2026. Esta análise amplia a pesquisa do Lovable com documentação oficial, observação HTTP e relatos públicos. Não recupera implementações privadas nem demonstra superioridade do Forge Studio.

## Alvos e observações efetivamente realizadas

| Alvo informado                  | Observação sem autenticação                                           | Cobertura                                                                      |
| ------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `https://v0.app/ebb10`          | HTTP 200; HTML com título e chamadas da página pública genérica do v0 | Não comprova acesso a workspace, chat ou aplicativo de ebb10                   |
| `https://vercel.com/ebb10`      | HTTP 404 nesta execução                                               | Não permite distinguir recurso inexistente de recurso inacessível ao visitante |
| `https://github.com/codespaces` | HTTP 302 para login; página de login HTTP 200                         | Nenhum codespace de usuário foi aberto, criado, modificado ou excluído         |

A captura tem quatro registros de requisições, incluindo o redirecionamento. Não é um HAR de sessão completa de navegador. Scripts não foram executados; corpos, cookies e cabeçalhos de autenticação não foram retidos. Versão HTTP, tamanho transferido e fases de tempo não medidos ficam desconhecidos. Os tempos registrados são do cliente urllib, não benchmarks de produto. Para compatibilidade com campos obrigatórios do HAR, o total é colocado em `wait`, com `send` e `receive` em zero: são placeholders, não medições de fases de rede.

### Aplicação real das ferramentas

Foram usados REA npm **6.9.0** e Craft Anything CLI **0.6.1**, já fixados e avaliados na etapa anterior:

```sh
python scripts/record-public-http.py work/public-targets.har
rea inspect-web-network-capture "$PWD/work/public-targets.har" har --format json
craft-anything-cli --deep web-recording-show --path "$PWD/work/public-targets.har" --limit 20
```

Ambos analisaram com sucesso os registros offline. As evidências originais estão em [evidence/](evidence/). O parâmetro Deep do Craft permite ler o arquivo local; não ultrapassa o login de qualquer serviço. Cobertura completa de quatro registros **não equivale a cobertura completa do software**. Não foram descompilados serviços remotos, recuperados prompts privados ou analisados códigos privados.

## O que cada produto traz para o desenho

| Referência                                                                                                                                                                                                                                                    | Capacidades documentadas                                                                         | Consequência proposta para o Forge                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| [v0: sandbox](https://v0.app/docs/sandbox)                                                                                                                                                                                                                    | VM por chat; código, terminal, editor e preview no mesmo ambiente; ciclo de suspensão e retomada | Uma execução identificável e recuperável; separar isolamento de máquina de isolamento dos serviços externos e dos dados |
| [v0: agente](https://v0.app/docs/agentic-features) e [terminal](https://v0.app/docs/terminal-commands)                                                                                                                                                        | Navegador, terminal e ferramentas externas; modos de permissão                                   | Mostrar ação, escopo, resultado e cancelamento; não anunciar geração sem executá-la                                     |
| [v0: GitHub](https://v0.app/docs/github) e [versões](https://v0.app/docs/versions)                                                                                                                                                                            | Repositório como fonte de verdade quando conectado; branches, PR e versões                       | Vincular execução a commit/diff e preservar modificações externas                                                       |
| [Vercel: observabilidade](https://vercel.com/docs/observability) e [rollback](https://vercel.com/docs/instant-rollback)                                                                                                                                       | Diagnóstico operacional e retorno de versão de implantação                                       | Separar preview, publicação, monitoramento e recuperação; não confundir rollback de código com restauração de dados     |
| [Vercel: gastos](https://vercel.com/docs/spend-management)                                                                                                                                                                                                    | Alertas e controles de gasto já existem                                                          | Orçamento não é diferencial por si só; nossa hipótese é reserva prévia e reconciliação por operação                     |
| [Codespaces](https://docs.github.com/en/codespaces/about-codespaces/what-are-codespaces) e [dev containers](https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/introduction-to-dev-containers) | Ambiente reprodutível configurado no repositório, com acesso por editor e CLI                    | Ambiente de desenvolvimento portável; não depender de uma sessão para preservar trabalho                                |
| [Codespaces: exportação](https://docs.github.com/en/codespaces/troubleshooting/exporting-changes-to-a-branch)                                                                                                                                                 | Exportar a branch atual sem iniciar o codespace, com restrições                                  | Recuperação deve ser acessível quando o runtime está indisponível; não alegar que o concorrente não tem exportação      |

As células descrevem documentação, não testes autenticados independentes. VM isolada não prova que bancos externos, credenciais ou integrações estejam separados. A mesma cautela se aplica ao Forge.

## Reclamações públicas e requisitos derivados

A amostra é intencional, pequena e não representativa. Não permite estimar prevalência ou classificar os concorrentes. Threads antigas podem descrever problemas já resolvidos. Publicar um relato não confirma sua causa técnica.

| Relato                                                                                                                                                      | Estado da evidência                                                                                                                          | Resposta de produto proposta                                                                              | Situação no Forge                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [v0: consumo durante indisponibilidade de sandbox](https://community.vercel.com/t/is-v0-max-buggy/33630)                                                    | Relato de fevereiro de 2026, com resposta de funcionária sobre falha temporária e usuário indicando retomada; não tratado como defeito atual | Checar runtime antes da chamada paga; interromper repetição sem progresso; reconciliar custo por operação | Reserva pura testada; preflight e cobrança real ainda não conectados                     |
| [v0: histórico anterior inacessível](https://community.vercel.com/t/cant-access-previous-chats-history-of-v0-project/13563)                                 | Relato histórico; sem reprodução atual                                                                                                       | Exportar especificações, contexto e evidências sem depender do histórico remoto                           | Exportação JSON com verificação de integridade entregue na v0.2                          |
| [Vercel: cobranças de build inesperadas](https://community.vercel.com/t/vercel-build-minutes-billing-enabled-by-default-causing-unexpected-charges/37434/7) | Feedback histórico; controles de Spend Management são mencionados nas respostas                                                              | Explicar geração, execução, build e hospedagem como custos distintos                                      | Produto atual não faz chamadas pagas; política futura no backlog                         |
| [Codespaces: perda de arquivos e sessões](https://github.com/orgs/community/discussions/208625)                                                             | Alegação de usuário em setembro de 2026, sem causa confirmada por esta pesquisa                                                              | Checkpoints e exportação externa; mostrar o que é persistente e o que não é                               | Histórico local e exportação entregues; backup remoto e restauração automática ainda não |
| [Codespaces: limite de instâncias apesar da lista vazia](https://github.com/orgs/community/discussions/202155)                                              | Relato público; não reproduzido                                                                                                              | Estado de recursos reconciliado e diagnóstico acionável                                                   | Orquestrador de recursos ainda não implementado                                          |
| [Lovable: créditos em correções](https://www.reddit.com/r/lovable/comments/1xknspm/does_anyone_else_burn_through_lovable_credits/)                          | Relato de usuário encontrado na busca; acesso HTTP direto pode ser limitado; não comprova medição ou causa                                   | Resultado acompanhado por teste real; limite de tentativas e comparação antes/depois                      | Critérios e evidências manuais entregues; verificador automático ainda não               |

Também existem recursos de recuperação dos concorrentes: no Codespaces há exportação sem iniciar o ambiente; a documentação informa persistência de `/workspaces` em rebuild e políticas de exclusão automática. Uma política pode excluir ambientes mesmo com alterações não enviadas. Esses fatos devem orientar nossa UX, sem transformar relatos individuais em acusações.

Fontes de ciclo de vida: [persistência](https://docs.github.com/en/codespaces/developing-in-a-codespace/persisting-environment-variables-and-temporary-files), [exclusão automática](https://docs.github.com/en/codespaces/setting-your-user-preferences/configuring-automatic-deletion-of-your-codespaces).

## Síntese original de produto

Aproveitar a simplicidade de jornada do Lovable, a ligação entre terminal/editor/preview do v0, o controle operacional da Vercel e a reprodutibilidade do Codespaces. O contrato de valor do Forge será uma mudança verificável: intenção → especificação → ambiente → branch → execução → evidência → revisão → publicação.

A hipótese de diferenciação é previsibilidade e recuperação, não quantidade de recursos. Medir custo por mudança aceita, regressões, intervenção humana, recuperação de trabalho e tempo até entrega. Não há benchmark que sustente "imbatível" nesta etapa.

## Entrega concreta desta etapa

- Preservada a licença MIT e o histórico do repositório criado pelo usuário.
- Publicada a base local anteriormente preparada.
- Exportação de projeto com histórico e SHA-256, download na interface e verificador CLI.
- Metadados de fontes e evidências HTTP sem credenciais ou corpos de login.
- Configuração de dev container para reproduzir o desenvolvimento (não foi criado codespace pago).
- Requisitos derivados dos relatos adicionados ao roadmap, com estado real explícito.
