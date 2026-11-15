# Arquitetura

## Decisão inicial

Separar especificação, execução e comprovação. Um estado de "planejado" nunca significa "construído"; uma evidência declarada não equivale a uma execução automatizada verificada.

## Implementado

```text
Browser (public/) → HTTP local (src/server.mjs) → Store → arquivo JSON
                          ↓
                  plano local + hash da especificação
                          ↓
                  evidências manuais → revisão humana

Agent eve (agent/) → ferramenta tipada de requisitos
                    processo independente, não conectado ao Studio
```

`domain.mjs` valida entradas, gera planos locais, determina critérios pendentes e contém o núcleo puro de orçamento. `store.mjs` mantém o estado de um processo e publica arquivos completos por rename. A API valida host/origin, limita o corpo JSON e serve somente três arquivos estáticos permitidos. Valores informados pelo usuário são renderizados via DOM/textContent, nunca interpolados em HTML.

Os registros de verificação recebem origem `operator-declared` e o hash da especificação. Uma especificação nova cria outra execução; evidências antigas não são transferidas. A avaliação usa o último registro por critério. O resultado máximo é `ready-for-human-review`, nunca autorização de publicação.

## Arquitetura de produção proposta

1. Identidade, workspaces e autorização por recurso.
2. API e persistência transacional para projetos, versões, execuções e evidências.
3. Orquestrador durável com cancelamento, checkpoint e deduplicação de operações.
4. Workspace isolado por execução, com limites de CPU/memória/tempo e política de rede.
5. Branch/worktree por mudança, commit identificado e preview próprio.
6. Dados sintéticos ou ambiente de dados separado por preview; nunca dados reais por padrão.
7. Verificadores funcionais, visuais e de dados produzindo artefatos vinculados ao commit e ao ambiente.
8. Revisão e publicação como etapas distintas, com recuperação de código e de dados tratadas separadamente.

Nenhum item dessa lista deve aparecer como implementado antes de existir um fluxo real e verificável.

## Orçamento

O núcleo de domínio reserva o custo máximo de uma operação antes de executá-la. Reserva com a mesma chave e valor é idempotente; outra quantia sob a mesma chave falha. Reservas em andamento contam no limite. A liquidação não pode exceder a reserva. A dupla liquidação é rejeitada.

Em produção, essas operações precisam de transação/concorrência no banco e reconciliação com custos do provedor. O módulo atual não é um controle financeiro distribuído. Nenhuma chamada do eve está integrada a esse controle.

## Reuso das ferramentas investigadas

Craft Anything e REA são candidatos a adaptadores opcionais de investigação de artefatos autorizados. Ainda não são executados pelo produto. Antes de integrar: fixar versão, revisar licenças de distribuição, declarar efeitos, limitar recursos, preservar proveniência e testar contra um artefato próprio. Saídas serão dados não confiáveis, não instruções para o agente.
