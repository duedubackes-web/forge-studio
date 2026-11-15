# Visual Studio Code — análise de artefatos e arquitetura

Data: 15 de novembro de 2026.

## O que foi obtido

A API oficial de atualizações informou a distribuição Linux x64 estável **1.146.0**, commit `69047191fc427f2f92828279aae1d90d8eeda7ab`. O arquivo de 409.004.073 bytes foi baixado e seu SHA-256 conferido contra o valor publicado pela API: `cbdb7bde3d358c7297cf1d9d6adc16dfb1d0179501fb2c152df48593e39e3600`.

Da distribuição foram extraídos somente `resources/app/package.json` e `resources/app/out/bootstrap-fork.js`. O segundo tem 124.259 bytes. O editor e seus scripts não foram executados. Não foram lidos extensões instaladas, configurações, contas, arquivos ou credenciais pessoais.

Separadamente, foram consultados oito arquivos públicos do repositório Microsoft no mesmo commit da release. [Manifesto das fontes](evidence/vscode/source-manifest.json). O código público completo é acessível pelo [submódulo fixado](../../references/README.md); não foi copiado para dentro do código autoral do Forge.

## REA e Craft Anything aplicados de fato

| Ferramenta           | Operação                                                             | Resultado e limite                                                                                            |
| -------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| REA 6.9.0            | `analyze-javascript-application`, seleção de `out/bootstrap-fork.js` | 1 JavaScript analisado, 21.182 nós de AST visitados, 0 falhas de parsing; grafo retido de 24 nós e 40 arestas |
| Craft Anything 0.6.1 | `js-app-map`, no diretório contendo os dois arquivos selecionados    | 2/2 entradas examinadas; 1 módulo de código analisado                                                         |

O REA informou cobertura incompleta: limite de expansão de aliases atingido, referências dinâmicas não resolvidas e um arquivo inventariado fora da seleção de código. O Craft classificou o recorte como pacote Node. Essa classificação e os totais valem apenas para o recorte, não para todo o VS Code.

Nenhuma ausência de janela, canal IPC ou endpoint encontrada nesse bootstrap deve ser interpretada como ausência desses recursos no editor. Não houve teste dinâmico, descompilação de binários nativos ou auditoria integral de segurança.

[Resumo estrutural e limitações das ferramentas](evidence/vscode/static-analysis-summary.json). Os grafos brutos ficam fora do repositório: contêm fragmentos de fonte, são volumosos e não são necessários para redistribuir as conclusões. Seus hashes estão registrados. [Identidade do arquivo de release](evidence/vscode/archive-identity.json), [arquivos selecionados](evidence/vscode/selected-artifacts.json), [hashes dos registros publicados](evidence/vscode/manifest.json).

## Arquitetura pública: princípios para o Forge

| Referência observada                                           | Proposta original para o Forge                                                                 | Estado                                                              |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Organização em camadas de base, plataforma, editor e workbench | Separar contratos, runtime, interface e adaptadores; não colocar execução no componente visual | Separação inicial parcial                                           |
| Extension host e protocolos explícitos entre hosts             | Plugins com capacidades declaradas e um contrato de comunicação                                | Não implementado; processo separado não basta para garantir sandbox |
| Serviços de instanciação por interface                         | Adaptadores de agentes e verificadores substituíveis                                           | Não implementado                                                    |
| Ciclo de vida e descarte de recursos em `lifecycle.ts`         | Cancelamento só concluído após encerrar processos e liberar recursos                           | Não implementado para tarefas de agente                             |
| Interfaces de confiança do workspace                           | Distinguir abrir/ler um projeto de autorizar execução                                          | Não implementado como fluxo multiusuário                            |
| Modelo de tarefas no workbench                                 | Estados e eventos próprios para execução, erro e conclusão                                     | O Forge só tem planejamento, evidências e aceite manual             |

Fontes: [organização oficial](https://github.com/microsoft/vscode/wiki/Source-Code-Organization) e os caminhos específicos no manifesto fixado: `lifecycle.ts`, `instantiation.ts`, `workspaceTrust.ts`, `extHost.protocol.ts`, `extensions.ts` e `tasks.ts`. A leitura foi direcionada a contratos e responsabilidades, não uma auditoria de todos esses arquivos ou seus consumidores.

## Fonte aberta e distribuição Microsoft

O repositório `microsoft/vscode` é disponibilizado sob MIT. A distribuição Microsoft tem licença e condições próprias, além de diferenças de marca, configuração e componentes. A própria [FAQ oficial](https://code.visualstudio.com/docs/supporting/faq) distingue essas superfícies. Referenciar Code - OSS não concede acesso ao código de serviços proprietários, Copilot, Marketplace ou infraestrutura hospedada.

Esta entrega registra identidade, resumos estruturais, conclusões originais e uma referência Git reproduzível. Não redistribui o pacote de instalação, logotipos, arquivos de usuário ou fragmentos dos grafos brutos.

## Reproduzir a análise do recorte

1. Obter a release pelo endereço oficial registrado em `archive-identity.json` e verificar seu SHA-256.
2. Extrair somente os dois membros registrados em `selected-artifacts.json`, preservando `package.json` e `out/bootstrap-fork.js` em um diretório próprio.
3. Com as versões indicadas, executar:

```sh
rea analyze-javascript-application /caminho/recorte \
  --source-path out/bootstrap-fork.js \
  --max-semantic-nodes 20000 --max-semantic-nodes-per-file 10000 \
  --max-heap-mb 512 --analysis-timeout-ms 20000 --format json

craft-anything-cli --deep js-app-map --input-path /caminho/recorte \
  --max-files 4 --max-nodes 10000 --max-file-bytes 1048576 \
  --max-total-bytes 2097152 --limit 10
```

Essa operação lê texto inerte. Não é necessário iniciar VS Code ou autenticar contas. Os limites das ferramentas fazem parte da evidência e não devem ser ocultados aumentando números até parecer completo.

## Próxima aplicação de produto

Priorizar um runtime de tarefas com cancelamento e limpeza verificável, antes de criar um sistema de extensões. Depois, definir capacidades de plugins e separar contexto confiável de conteúdo importado. Os fundamentos obtidos por engenharia reversa orientam requisitos; não tornam essas funções prontas no Forge.
