# Ambiente reproduzível

O dev container usa Node 24 e `npm ci`. Pode ser aberto no VS Code com Dev Containers ou usado para configurar um Codespace do próprio repositório. Esta entrega não criou Codespaces nem consumiu computação hospedada para validar a configuração.

A imagem usa tag versionada de família, não digest imutável; uma reprodução bit a bit requer fixar e revisar o digest. O lockfile controla as dependências npm.

O Studio continua escutando somente em loopback. A configuração não abre porta pública nem altera os controles Host/Origin. Acesso por preview remoto exige projetar autenticação e proxy adequados; não basta encaminhar a porta e remover a validação.

A pasta `.data` não está no Git. Commit e push preservam código, não o histórico local do Studio. Para preservar o projeto, use **Exportar backup do projeto** e guarde o arquivo fora do ambiente antes de excluí-lo. O arquivo inclui objetivos e evidências manuais; trate-o como privado.

```sh
npm run backup:verify -- /caminho/forge-project-ID.json
```

A verificação detecta alteração de conteúdo em relação ao checksum exportado. Ela não autentica a origem, não executa os testes descritos e não restaura automaticamente o estado. A interface restaura backups dos formatos 1 e 2 como novas cópias (até 2 MiB). Conteúdo, identidades e hashes são validados antes de gravar; evidências importadas não contam como revisão atual. Migração entre versões de formato e recuperação remota seguem no roadmap.

O formato 2 preserva histórico de aceite e exige v0.5 ou posterior. Aceites importados não autorizam a revisão atual.
