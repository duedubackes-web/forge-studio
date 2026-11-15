# Roadmap

Legenda: entregue = funciona na base atual; parcial = parte funciona e o restante está explícito; planejado = falta implementação e comprovação.

| ID  | Prioridade | Estado    | Entrega                              | Aceitação                                                                             |
| --- | ---------- | --------- | ------------------------------------ | ------------------------------------------------------------------------------------- |
| F01 | P0         | Entregue  | Studio local                         | Criar projeto, recarregar e recuperar o estado                                        |
| F02 | P0         | Entregue  | Plano e evidências                   | Cada registro aponta para o hash da especificação; falha posterior bloqueia revisão   |
| F03 | P0         | Entregue  | Núcleo de orçamento                  | Reservas somadas não excedem limite; repetição não duplica reserva                    |
| F04 | P0         | Entregue  | Base eve                             | Agente e ferramenta tipada passam na checagem e compilação                            |
| F05 | P0         | Planejado | Studio conectado ao agente           | Uma solicitação autenticada recebe eventos reais e erros visíveis                     |
| F06 | P0         | Planejado | Identidade e isolamento multiusuário | Usuário sem permissão não lê projeto, execução, arquivo ou stream de outro            |
| F07 | P0         | Planejado | Worker de código em sandbox          | Gerar e executar um app próprio; cancelamento encerra processos e recursos            |
| F08 | P0         | Planejado | Git por mudança                      | Branch, diff e commit verificáveis; conflito não sobrescreve alterações               |
| F09 | P0         | Planejado | Preview com dados separados          | Escrita em um preview não aparece no ambiente principal nem em outro preview          |
| F10 | P0         | Planejado | Evidência automatizada               | Teste real, saída, código de retorno, commit, ambiente e artefatos relacionados       |
| F11 | P0         | Planejado | Orçamento transacional conectado     | Reservar antes do provedor; tolerar retry e crash sem dupla cobrança                  |
| F12 | P1         | Planejado | Publicação e recuperação             | Publicação identifica versão; plano de dados separado de rollback do código           |
| F13 | P1         | Planejado | Memória auditável                    | Histórico, escopo e resolução explícita de conflito de regras                         |
| F14 | P1         | Planejado | Adaptadores Craft Anything / REA     | Evidência de artefato próprio, versão fixada, recursos limitados e efeitos declarados |
| F15 | P2         | Planejado | Monitoramento reproduzível           | Incidente permite repetir cenário e anexar regressão antes de sugerir correção        |

## Ordem

F05 + F06 antes de expor qualquer fluxo ao público. F07 + F08 antes de anunciar construção de aplicativos. F09 + F10 antes de anunciar previews seguros e verificação automática. F11 antes de oferecer orçamento controlando chamadas reais. F12 somente depois de validar recuperação de código e estratégia de dados.

## Medidas de produto

Medir custo por mudança aceita, tempo até entrega verificável, taxa de regressão, tempo de recuperação e intervenções humanas. Ainda não há números de desempenho nem comparação experimental com Lovable. Não usar porcentagens promocionais sem benchmark equivalente.

## Ampliação v0.2 — requisitos derivados de pesquisa pública

| ID  | Prioridade | Estado    | Entrega                          | Aceitação                                                                                                   |
| --- | ---------- | --------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| F16 | P0         | Entregue  | Exportação verificável           | Download contém projeto e histórico; alteração de conteúdo falha no verificador                             |
| F17 | P0         | Parcial   | Restauração e migração de backup | Importar sem executar conteúdo; detectar versão inválida e colisões; preservar origem manual das evidências |
| F18 | P0         | Planejado | Preflight e parada sem progresso | Runtime pronto antes de chamada paga; tentativas limitadas e motivo visível                                 |
| F19 | P1         | Planejado | Checkpoint fora do runtime       | Recuperar trabalho após indisponibilidade/exclusão do ambiente de execução                                  |
| F20 | P1         | Planejado | Custos discriminados             | Separar modelo, build, execução e hospedagem com reconciliação por operação                                 |

Dev container adicionado para configurar o desenvolvimento. A criação real em Codespaces e o acesso remoto autenticado não foram verificados. Fontes e ressalvas: [pesquisa ampliada](research/v0-vercel-codespaces.md).

## Ampliação v0.3

F17: recuperação do formato 1 entregue na interface e API. Cria nova cópia, rejeita backups inconsistentes e exige nova revisão das evidências importadas. Migração entre versões de formato ainda não implementada.

Acesso Vercel autenticado verificado em leitura; isso não implica acesso ao código da plataforma nem acesso à sessão do v0 no navegador. A inspeção visual autenticada do v0 permanece não verificada por ausência da ferramenta de navegador nesta sessão.
