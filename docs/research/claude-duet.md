# Claude Duet — investigação pública

Data: 15 de novembro de 2026.

## Execução real e limite

REA **6.9.0** (`inspect-web-network-capture`) e Craft Anything **0.6.1** (`web-recording-show`) analisaram uma captura HTTP de três páginas oficiais. Todas responderam 200. [Manifesto, hashes e fontes](evidence/claude-duet/manifest.json), [REA](evidence/claude-duet/rea.json), [Craft](evidence/claude-duet/craft.json).

A captura registra metadados de consultas anônimas, sem executar scripts ou guardar corpos, cookies e credenciais. Os campos de tempo têm as limitações declaradas pelo gravador. Cobertura de 3/3 registros não é varredura do aplicativo inteiro. Não houve acesso autenticado, análise de APK/IPA ou extração de backend, prompts privados ou modelos. As capacidades abaixo são declarações oficiais, não testes funcionais independentes.

Reprodução com as versões das ferramentas já instaladas:

```sh
python scripts/record-public-http.py work/duet.har \
  https://claude.com/resources/articles/claude-duet \
  https://support.claude.com/en/articles/17631495-get-started-with-claude-duet \
  https://claude.com/resources/articles/claude-duet-safety-privacy-and-security
rea inspect-web-network-capture "$PWD/work/duet.har" har --format json
craft-anything-cli --deep web-recording-show --path "$PWD/work/duet.har" --limit 20
```

## Achados úteis

| Capacidade documentada                                                                | Implicação proposta para o Forge                                             |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Trabalho em nuvem continua após fechar o app; há acompanhamento proativo              | Separar duração da tarefa da conexão da interface e mostrar última atividade |
| Tarefas e entregáveis têm áreas próprias                                              | Separar acompanhamento de execução e biblioteca de resultados                |
| Somente o usuário marca uma tarefa como concluída                                     | Distinguir resultado sugerido pelo agente de aceite do usuário               |
| Desconectar um aplicativo interrompe acesso futuro, mas não apaga o que foi aprendido | Oferecer controles distintos de revogação e exclusão de memória              |
| Atividade em segundo plano consome limites compartilhados                             | Mostrar consumo por rotina e permitir pausar cada uma                        |
| Aprovações e verificação de ações ficam fora do modelo principal                      | Validar escopo e autorização no executor, sem depender apenas do prompt      |

Fontes: [introdução oficial](https://claude.com/resources/articles/claude-duet), [guia de uso](https://support.claude.com/en/articles/17631495-get-started-with-claude-duet), [arquitetura de segurança declarada](https://claude.com/resources/articles/claude-duet-safety-privacy-and-security).

## Limitações relevantes da prévia

O guia informa acesso por convite para assinantes elegíveis nos EUA, ausência de visualização ou tomada de controle do navegador e verificações de contas em intervalos. Não se deve presumir resposta imediata a eventos urgentes. As condições podem mudar durante a prévia.

Não há comparação experimental que sustente superioridade do Forge. As propostas desta análise ainda não são funcionalidades implementadas nele. A base atual continua oferecendo planejamento local, evidências, recuperação e inspeção Git; agente integrado e execução hospedada permanecem no roadmap.

## Prioridade recomendada

Concluir o fluxo real de tarefa → execução → evidência → aceite antes de adicionar proatividade. Depois, avaliar rotinas pausáveis, custos por rotina e memória com origem e exclusão por fonte. Não assumir que isolamento de máquina, revogação de credencial e remoção de memória sejam a mesma operação.
