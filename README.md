# Forge Studio

Plataforma original para transformar objetivos em software com critérios de aceitação e evidências de verificação. **Nome provisório; protótipo local v0.6.0.**

Esta primeira entrega contém um Studio funcional de planejamento e registro de evidências, uma base de agente eve e pesquisa competitiva rastreável. **Ainda não é um gerador de aplicativos equivalente ao Lovable.**

## Executar o Studio

Requer Node.js 24 ou 26 e npm.

```sh
npm ci
npm start
# http://127.0.0.1:4173
```

Sem conta, chave de IA ou serviço externo para o fluxo local. `npm run dev` ativa reinício por alterações. O servidor escuta apenas em loopback; é um protótipo de usuário único, sem autenticação e sem suporte a proxy público.

1. Crie um projeto com nome e objetivo.
2. Descreva uma mudança e configure seu limite em reais.
3. Gere um plano local, baseado em regras por palavras-chave.
4. Registre evidências manuais dos critérios funcional, visual e isolamento de dados.
5. Acompanhe a condição de revisão. Uma evidência de falha mais recente volta a bloquear o critério.

Os dados são gravados em `.data/store.json` (ignorado no Git). Use `FORGE_DATA_PATH` para um arquivo diferente e `PORT` para outra porta. Rode um único processo por arquivo. Não há banco transacional multiusuário nem coordenação entre processos. A gravação usa arquivo temporário + rename; não promete durabilidade diante de falha de energia.

## O que funciona nesta versão

- Criação e listagem de projetos, persistidas localmente.
- Planos locais com sugestões de módulos e critérios de aceitação.
- Identidade SHA-256 da especificação associada a cada registro de evidência.
- Histórico de evidências e critérios para revisão humana.
- Exportação e recuperação de backups do formato 1, em nova cópia sem sobrescrever projetos.
- Núcleo de reserva e liquidação de orçamento com testes de idempotência e gastos concorrentes lógicos.
- Agente eve separado com ferramenta tipada de avaliação de requisitos.

## Limites explícitos

| Área                                 | Estado                                                               |
| ------------------------------------ | -------------------------------------------------------------------- |
| IA no Studio                         | Não conectada; o planejador local é determinístico                   |
| Agente eve                           | Scaffold e ferramenta de requisitos; processo separado do Studio     |
| Geração de código / execução isolada | Não implementadas                                                    |
| Testes de aplicativos gerados        | Não implementados; registros atuais são declarações manuais          |
| Isolamento de banco por preview      | Decisão de arquitetura, ainda não provisionado                       |
| Custos reais de provedores           | Sem chamadas pagas; limite configurado não é cobrança nem estimativa |
| Reserva de orçamento                 | Módulo de domínio testado; não conectado a um provedor               |
| GitHub no produto                    | Integração futura; este repositório armazena o código do produto     |
| Publicação de aplicativos            | Não implementada                                                     |
| Multiusuário e autenticação          | Não implementados; não expor o Studio à internet                     |

## Agente de requisitos

O scaffold utiliza eve `1.0.0-rc.18` e o modelo padrão produzido pelo init, sem credenciais no repositório.

```sh
npm run agent:dev
npm run agent:build
# Em ambientes com proxy HTTP(S), pode ser necessário NODE_USE_ENV_PROXY=1.
```

A execução de uma conversa exige autenticação de modelo configurada no eve. O agente tem instruções para declarar limitações e uma ferramenta `assess_requirements` de leitura. O Studio não encaminha mensagens a ele nesta versão. O orçamento do Studio **não limita** chamadas feitas diretamente ao processo eve.

## Verificação

```sh
npm run check
npm run format:check
npx playwright install chromium
npm run test:browser
```

Para usar um Chromium já instalado:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
```

Os testes de navegador iniciam um servidor próprio e usam dados temporários separados. Confira [o registro de verificação](docs/verification.md) para os comandos efetivamente executados nesta entrega e seus limites.

## Backup portável

Abra um projeto e use **Exportar backup do projeto**. O JSON inclui planos e evidências, com checksum SHA-256. Valide com `npm run backup:verify -- arquivo.json`. O checksum verifica integridade, não autenticidade. Na página de projetos, abra **Restaurar um projeto de backup**, selecione um JSON de até 2 MiB e restaure como nova cópia. O original é preservado e todas as evidências importadas exigem nova revisão. São aceitos os formatos 1 e 2; não há migração automática de versões futuras. Backups com histórico de aceite usam formato 2 e exigem Forge v0.5 ou posterior. Guarde o arquivo fora do runtime e em local privado. Importações usam identidades novas para evitar colisões entre projetos, execuções e evidências.

## Aceite manual de revisão

Após registrar aprovação manual para os três critérios, use **Aceitar revisão**. O aceite registra especificação, evidências e data. Nova evidência exige novo aceite; uma falha volta a bloquear a revisão. Repetir a mesma solicitação não duplica o registro. Na recuperação de backup, aceites antigos ficam no histórico importado e não aprovam a cópia.

Esse fluxo é local e de usuário único: não comprova execução automatizada de testes, identidade multiusuário ou publicação de um aplicativo.

## Dossiê para implementação

Em cada tarefa, use **Exportar dossiê Markdown**. O arquivo inclui contexto, objetivo, módulos, etapas, critérios, evidências, histórico de aceite e identidade da especificação. O estado vigente é recalculado; aceite histórico não aparece como aprovação atual após uma falha.

O documento pode acompanhar uma solicitação a um agente externo, mas não inicia execução nem autoriza ações. O orçamento local não controla esse agente. Dados fornecidos pelo operador aparecem em blocos de referência; ainda devem ser tratados como conteúdo não confiável pelo leitor. O cabeçalho HTTP `X-Artifact-SHA256` identifica os bytes entregues, sem autenticar autoria.

Veja um [exemplo com dados sintéticos](docs/examples/dossier-example.md). Guarde dossiês reais em local privado: podem conter objetivos e evidências do projeto.

## Inspecionar a base Git

```sh
npm run repo:inspect -- /caminho/do/repositorio
```

Registra commit, branch e alterações locais, sem executar código do projeto ou modificar Git. Estado sujo não é uma base pronta para verificação por commit. O hash cobre metadados; não lê nem preserva conteúdo de arquivos. A ferramenta é CLI local e ainda não está conectada ao agente.

## Pesquisa e implementação

- [VS Code: artefatos oficiais e arquitetura](docs/research/vscode.md)
- [Fonte pública VS Code por referência fixada](references/README.md)
- [Claude Duet: investigação pública e requisitos](docs/research/claude-duet.md)
- [Codex: fontes públicas e limites da análise](docs/research/codex.md)
- [v0, Vercel, Codespaces e relatos públicos](docs/research/v0-vercel-codespaces.md)
- [Ambiente reproduzível](docs/development-environment.md)
- [Análise competitiva e oportunidades](docs/research/competitive-analysis.md)
- [Catálogo das 342 páginas públicas](docs/research/source-manifest.json)
- [Arquitetura e fronteiras atuais](docs/architecture.md)
- [Backlog priorizado](docs/roadmap.md)
- [Como reproduzir a coleta](docs/research/methodology.md)
- [Política de segurança](SECURITY.md)

A pesquisa usa documentação pública e leitura autorizada; não recupera o código privado, os prompts internos ou os modelos do Lovable. Não incorporamos código, marcas, imagens ou textos de interface do Lovable, Craft Anything ou REA. As referências são fontes de análise e ferramentas avaliadas, não dependências integradas do produto.

Licença MIT, conforme o arquivo LICENSE criado pelo proprietário do repositório. Dependências mantêm suas licenças. Nenhuma hospedagem ou serviço pago foi provisionado por esta entrega.
