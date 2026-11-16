# AVG — execução de REA e Craft Anything

Atualização: o instalador online oficial foi posteriormente obtido e analisado. Veja [análise nativa e cobertura](avg-native.md). A indisponibilidade descrita abaixo corresponde à etapa anterior.

REA 6.9.0 e Craft Anything CLI 0.6.1 foram instalados e executados sobre o recorte AVG da captura HTTP pública já registrada. As duas operações terminaram com código de saída zero.

## Comandos executados

```sh
rea inspect-web-network-capture /workspace/work/avg-analysis/avg-public.har har --json
craft-anything-cli --deep web-recording-show --path /workspace/work/avg-analysis/avg-public.har --format har --limit 20
```

## Resultado e cobertura

Foram examinadas duas respostas históricas: `GET https://www.avg.com/` retornou 302 para `https://www.avg.com/pt-br/homepage`, que retornou 200. A captura não retém corpos de páginas, cookies ou credenciais. Não foram executados scripts do site. Tempos são observações do coletor HTTP, não benchmarks de navegador.

Os [resultados completos e hashes](evidence/antivirus/avg/manifest.json) acompanham a captura e permitem conferir o que foi efetivamente processado. A instalação do Craft veio da release oficial v0.6.1; o SHA-256 do arquivo de distribuição coincidiu com o checksum publicado: `83ec0730c9117f399122b315c63ed4c3a8d31ac55bddd74cb8b33cd2f76ef704`.

## Limite da análise do antivírus

O arquivo `avg_antivirus_free_setup.exe` não estava disponível no ambiente. A imagem fornecida mostra nomes e tamanhos de seções, mas não disponibiliza seus bytes. Não foi feita análise PE, extração de recursos, descompilação ou execução do instalador. O nome de um instalador não determina sua versão nem comprova que contenha o motor completo.

O resultado HTTP não sustenta conclusões sobre detecção de malware, assinaturas, quarentena ou proteção em tempo real. Nenhum desses recursos foi implementado no Forge nesta etapa. A próxima análise estática depende do envio do executável ou dos arquivos extraídos.
