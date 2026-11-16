# Kaspersky e AVG — preparação da análise

Solicitação: aplicar REA e Craft Anything para orientar recursos originais do Forge Studio. Esta etapa prepara as fontes das ferramentas; não constitui análise dos motores antivírus.

## Estado verificável

- Forge Studio, REA e Craft Anything clonados em diretórios separados.
- Identidades dos commits registradas em [toolchain.json](evidence/antivirus/toolchain.json).
- Registradas quatro respostas HTTP públicas em [public-http.har](evidence/antivirus/public-http.har): dois redirecionamentos e duas respostas 200. Os destinos finais foram as páginas brasileiras. Não houve execução de JavaScript nem retenção dos corpos das páginas.
- Nenhum instalador, binário ou código interno de Kaspersky ou AVG foi obtido.
- Atualização: as versões executáveis foram instaladas e aplicadas ao recorte HTTP do AVG; veja [execução e limites](avg-executed.md). Os instaladores nativos continuam indisponíveis.
- Nenhuma função antivírus foi adicionada à interface.

## Recortes para implementação original

Esta tabela é uma proposta de requisitos, não uma observação dos produtos citados.

| Recurso proposto | Implementação necessária | Critério de aceite |
| --- | --- | --- |
| Painel de segurança | Resultados datados e identificados por verificador | Ausência de resultado aparece como desconhecido |
| Verificação de arquivo enviado | Backend isolado, limites de tamanho e tempo, motor de varredura | Timeout e arquivo rejeitado não aparecem como arquivo seguro |
| Histórico de detecções | Evidências com hash, versão do motor e estado | Resultado é ligado aos bytes efetivamente examinados |
| Quarentena | Armazenamento isolado sem servir arquivos como conteúdo ativo | Arquivo suspeito não pode ser executado ou publicado pelo fluxo normal |
| Proteção do computador | Agente nativo e permissões do sistema operacional | Navegador não promete acesso a arquivos ou processos locais |

O protótipo atual é local e de usuário único. Upload de amostras e exposição pública exigem arquitetura própria; não devem ser ligados diretamente ao servidor atual.

## Sequência de análise

1. Escolher plataforma e edição de cada antivírus e registrar versão, origem e SHA-256 dos artefatos obtidos.
2. Começar por páginas públicas e capturas sem autenticação; manter conteúdo coletado separado do código autoral.
3. Instalar versões executáveis das ferramentas, conferir ajuda e registrar suas versões independentemente dos commits de fonte.
4. Aplicar `rea inspect-web-network-capture /caminho/session.har har --json` a uma captura existente, conforme o guia do checkout. Uma captura HTTP não revela o motor antivírus.
5. Consultar a ajuda da versão instalada do Craft Anything antes de executar `web_recording_show`; a presença do identificador no código não comprova uma execução.
6. Para artefatos nativos, fazer primeiro inventário estático em diretório separado; qualquer teste de execução exige ambiente descartável adequado ao sistema alvo.
7. Registrar cobertura, erros e limitações. Implementar no Forge somente requisitos sustentados por evidência, com código original.

Não há resultado de engenharia reversa a atribuir aos antivírus nesta etapa. Os motores, assinaturas e serviços proprietários não são fornecidos pelos checkouts das ferramentas.
