# AVG — análise estática do instalador oficial corrente

Em 16 de novembro de 2026, foi obtido o instalador online indicado pela página oficial de download do AVG AntiVirus Free para Windows. O arquivo servido tem 250.080 bytes, SHA-256 `c05adb8c993541a0f9137cc23c02affdb85f46275d7f34c4889fc27413a85b87`. A origem, a data e as identidades de todos os registros locais estão no [resumo verificável](evidence/antivirus/avg-native/summary.json).

## Identidade e atualidade

Os recursos de versão declaram **AVG Installer 2.1.137.0**, empresa Gen Digital Inc., nome interno `microstub`, nome original `microstub.exe`. Trata-se de PE32 x86, aplicação gráfica Windows, com indícios de compilação Microsoft Visual C++. É o instalador online servido pelo canal oficial na coleta; isso não comprova a versão mais recente do antivírus instalado, do motor ou das definições. Uma URL corrente pode distribuir um bootstrap antigo que obtém componentes novos.

## Ferramentas e cobertura

Craft Anything CLI 0.6.1 executou triagem, visão geral, inventário de recursos, busca temática de strings, inventário de funções e estudo de quatro funções. REA 6.9.0 executou inspeção de recursos, importações, load config, hardening e exports. A inspeção de certificados do REA falhou e sua falha foi preservada.

O inventário heurístico do Craft encontrou 680 funções candidatas, 42.119 instruções, 7.576 blocos básicos, 9.558 referências cruzadas, 1.962 strings e 202 importações. Esses números descrevem a interpretação do analisador, não uma reconstrução completa ou comprovada do código original. Foram estudadas quatro funções: não foi feita revisão semântica individual das 680.

## Extração integral dos bytes disponíveis

O script original `scripts/extract-pe-observations.py` extraiu localmente as seis seções e os 39 recursos inventariados. Também particionou o arquivo inteiro, incluindo cabeçalhos, padding e certificados. A concatenação das partições reconstruiu os 250.080 bytes com o mesmo SHA-256. Cada recurso foi conferido contra o hash produzido pelo Craft.

O [manifesto de extração](evidence/antivirus/avg-native/extraction-manifest.json) registra nomes lógicos, offsets, tamanhos e hashes. Cobertura de todos os bytes não significa entendimento de todos os mecanismos. Os bytes extraídos ficam locais; o GitHub recebe o extrator, manifestos, resultados estruturais e análise original. O instalador, ícones e código reconstruído não são incorporados ao runtime do Forge.

Reprodução, com o arquivo de mesmo hash e o relatório do Craft incluído no repositório:

```sh
python scripts/extract-pe-observations.py /caminho/avg_antivirus_free_setup.exe \
  docs/research/evidence/antivirus/avg-native/craft-resources.json \
  /caminho/novo-diretorio-de-extracao
```

As seis seções são `.text`, `.rdata`, `.data`, `.didat`, `.rsrc` e `.reloc`. `objdump -h` confirmou sua estrutura. O arquivo não foi executado; não foram feitos testes em Windows nem capturas de instalação.

## Mecanismos encontrados

| Área | Evidência | Conclusão e limite |
| --- | --- | --- |
| Download | Importações WinHttpOpen, WinHttpConnect, WinHttpOpenRequest, WinHttpSendRequest, WinHttpReceiveResponse e WinHttpReadData | Contém infraestrutura HTTP; não foi observado tráfego de execução |
| Proxy | Strings ProxySettings, ProxyType, Port, User, Password e AuthorizationType referenciadas na rotina 0x406020 | Há tratamento de configuração de proxy; nomes de campos não são credenciais extraídas |
| Instalação | Rotina 0x406020 referencia installer.exe e chama APIs de arquivos, processos e sincronização | Compatível com orquestração de instalação; a rotina tem quatro chamadas não resolvidas |
| Privilégios | Manifesto declara requireAdministrator e uiAccess=false | Solicita elevação; não significa bypass de UAC |
| Estatísticas | Rotina 0x404d20 monta campos de evento, sessão, SO e versões e referencia POST e v7event.stats.avast.com | Código compatível com envio de eventos; não prova envio efetivo, frequência ou consentimento |
| Assinaturas | Rotinas 0x409ab0 e 0x409e10 referenciam erros de assinatura, digest e inicialização de parâmetros DSA | Há caminhos de processamento criptográfico; a correção dos algoritmos e seu uso não foram comprovados |
| Integridade | Importações CryptCreateHash, CryptHashData e CryptGetHashParam | Uso potencial de hashing; a presença de APIs não comprova validação de todos os downloads |
| Interface | Ícones, PNG, strings em vários idiomas, versão e manifesto nos recursos | Recursos do instalador; não constituem a interface completa do antivírus |

Não foram enviados pedidos aos endpoints encontrados dentro do executável.

## Proteções e certificados

O REA observou flags de ASLR, NX e CFG, security cookie e tabela SafeSEH de 35 entradas. A tabela CFG declara 118 alvos. São propriedades estáticas: não comprovam aplicação das proteções em execução ou ausência de falhas.

A visão geral do Craft indicou `canary=false`, mas o REA identificou um endereço de security cookie e o pseudo-C contém referências a esse cookie. Portanto, não se conclui ausência de proteção de pilha com base na heurística resumida do Craft.

REA `inspect-pe-certificates` terminou com código 1 ao rejeitar padding PKCS#7. O bloco foi extraído separadamente e lido por `openssl pkcs7`, que mostrou certificados de Gen Digital Inc. e da cadeia Sectigo. Isso é leitura de certificados embutidos: não houve verificação Authenticode do digest, da cadeia, do carimbo de tempo ou de revogação. A divergência do parser não é apresentada como vulnerabilidade.

O pseudo-C é inferido a partir de registradores, pilha e condições aproximadas. Não corresponde ao código-fonte original. Grafos, assembly e pseudo-C brutos permanecem no diretório local de análise; o repositório recebe conclusões e hashes, sem redistribuir o instalador ou seu código reconstruído.

## Aplicação no Forge e cobertura restante

Os achados orientam requisitos originais: separar instalador e runtime, registrar versão e hash de cada componente, verificar integridade antes da execução, tratar proxy e erros de rede e documentar eventos de telemetria. São requisitos propostos; nenhum recurso novo foi implementado no Forge nesta análise.

Não foram examinados os componentes posteriormente baixados, drivers, serviços residentes, motor de varredura, assinaturas, análise comportamental, proteção web, quarentena ou serviços em nuvem. O microstub não permite afirmar como todos esses mecanismos funcionam. Para ampliar a cobertura, é necessário obter os pacotes completos ou um inventário de uma instalação atualizada em Windows e analisar seus artefatos individualmente, mantendo versão, hash e origem de cada um. Uma inspeção do bootstrap não equivale à engenharia reversa integral do AVG.
