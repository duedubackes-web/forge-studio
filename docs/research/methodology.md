# Metodologia

1. Obter `https://docs.lovable.dev/llms.txt` por HTTPS com validação de certificado.
2. Extrair somente os links explicitamente publicados nesse índice.
3. Coletar páginas públicas em Markdown, com concorrência limitada a quatro requisições, timeout e tamanho máximo de 2 MB por página.
4. Registrar URL original, URL final, código HTTP, tamanho e SHA-256. Não testar endpoints descobertos nem buscar conteúdo autenticado.
5. Separar capacidades documentadas, observações de execução, hipóteses e recomendações.
6. Revisar áreas centrais e limitações; não confundir cobertura de download com validação de produto.

O manifesto registra o snapshot desta pesquisa. O repositório inclui metadados e análise original; não redistribui o corpo completo da documentação coletada.

Repositórios de ferramentas examinados:

- https://github.com/storytold/craft-anything — commit `1d8a3b4f60ac8b6cd01b0609cbf2d4d6f65b3da8`
- https://github.com/morluto/rea — commit `b3cdbb92ee81d00787dd87aefa43c1cdacbe779c`

Os commits de fonte e as versões executáveis avaliadas são identidades diferentes. Os commits não são apresentados como a fonte exata dos binários de release executados.
