# Verificação da base v0.1.0

Executada em 15 de novembro de 2026, no ambiente de desenvolvimento, com Node.js 24.22.1 e Chromium 156.

## História verificada

Criar projeto no navegador → enviar objetivo e limite à API → persistir plano → registrar evidências → mudar condição de revisão → recarregar e recuperar o mesmo histórico.

| Verificação                                                             | Resultado observado                                                  |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `npm run check`                                                         | TypeScript passou; 9 testes de domínio/API passaram                  |
| `npm run format:check`                                                  | Passou após a formatação final                                       |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser` | 2 testes passaram                                                    |
| Persistência após recarga                                               | Projeto, plano e falha posterior recuperados no navegador            |
| Origem da evidência                                                     | Registros com `operator-declared` e hash da especificação            |
| Falha posterior                                                         | Um critério antes aprovado volta a bloquear a revisão                |
| Entrada semelhante a HTML                                               | Nome exibido como texto, sem criação de elemento `img`               |
| Tela móvel                                                              | Fluxo acessível a 390 × 844, sem rolagem horizontal                  |
| Console do fluxo principal                                              | Nenhum `pageerror` observado                                         |
| `NODE_USE_ENV_PROXY=1 npm run agent:build`                              | Compilação eve passou, inclusive após desabilitar ferramentas padrão |
| Conversa real com modelo                                                | Não executada; sem medição de custos ou qualidade do modelo          |
| CI remoto                                                               | Configurado no workflow; ainda depende de envio ao GitHub            |

A primeira tentativa do build eve falhou ao consultar metadados do modelo porque o fetch do Node não usava o proxy do ambiente. A opção documentada do Node `NODE_USE_ENV_PROXY=1` permitiu o build, preservando a validação TLS. O build preparou um template de sandbox local; não gerou nem testou aplicativos de usuário.

Os testes do produto não significam que o produto já testa aplicativos gerados. Nesta versão, a evidência adicionada na interface continua sendo manual.

## Fronteiras

- UI → API: criação, validação e mensagens verificadas pelo Playwright.
- API → arquivo: testes de API e recuperação com nova instância do Store.
- Arquivo → UI: recarga e reabertura confirmadas.
- IA e serviços externos: não conectados ao Studio.
- GitHub: tentativas de criação via GraphQL e REST retornaram falta de permissão da integração. Não houve repositório remoto criado por essas chamadas.

O workflow foi preparado para Node 24 e 26; a execução local registrada aqui usou Node 24. Não alegamos execução local em Node 26.

## Ampliação v0.2

- `npm run check`: TypeScript e 12 testes de domínio/API passaram.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser`: 3 testes passaram, incluindo download e verificação independente do backup.
- REA 6.9.0 e Craft Anything 0.6.1: análise offline de 4 registros HTTP concluída. Uma primeira codificação com -1 nos campos obrigatórios de tempo foi rejeitada pelo REA; o HAR foi adaptado com placeholders documentados, sem alegar medição de fases.
- Pesquisa ampliada: 27 URLs selecionadas, 26 respostas HTTP 200 e uma 404. Coleta não comprova testes dos produtos.
- O histórico e a licença MIT do repositório criado pelo usuário foram preservados; o envio ao GitHub foi concluído. O bloqueio para criá-lo na v0.1 é histórico.
- Nenhum teste autenticado de v0/Vercel/Codespaces, benchmark comparativo ou Codespace hospedado foi executado.
- Configuração de dev container preparada; sua inicialização hospedada não foi testada.

## Ampliação v0.3

- `npm run check`: checagem de tipos e 14 testes de domínio/API passaram.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser`: 4 testes passaram.
- Fluxo novo: exportar, importar via seletor de arquivo, recuperar em uma nova cópia e manter o original.
- Backups alterados, versões desconhecidas, execução de outro projeto e hashes de especificação divergentes são recusados sem alterar a persistência.
- Duas importações não colidem; reexportar e restaurar uma cópia também funciona.
- Aprovações importadas não satisfazem critérios atuais; novas declarações podem concluir a revisão.
- Acesso autenticado Vercel confirmado pelo conector com leituras de identidade, equipes e metadados de projetos. Não foram lidos segredos, dados de aplicação ou arquivos privados para publicar no repositório.
- Não houve inspeção de sessão autenticada do v0, chamada paga de modelo, implantação ou criação de recursos externos nesta etapa.

## Ampliação v0.4

- `npm run check`: tipos e 16 testes de domínio/API/inspeção Git passaram.
- Inspeção Git: commit, mudanças staged/unstaged/untracked, HEAD destacado, repositório vazio, caminho inválido e normalização de subdiretório cobertos.
- REA e Craft Anything concluíram a análise de dois registros HTTP, com o identificador da sessão local removido antes da análise. Manifestos e arquivos estão em `docs/research/evidence/codex/`.
- Fonte pública Codex fixada no commit declarado no manifesto; nenhum código privado ou binário local do usuário foi extraído.
- A UI só recebeu atualização do número da versão; os quatro fluxos de navegador seguem no CI.
