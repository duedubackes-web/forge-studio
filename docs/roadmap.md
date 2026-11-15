# Roadmap

Legenda: entregue = funciona na base atual; planejado = falta implementação e comprovação.

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
