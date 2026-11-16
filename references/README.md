# Referências de código público

## Qubes OS

Os submódulos `qubes-core-admin/`, `qubes-core-qrexec/` e `qubes-core-admin-client/` fixam três árvores oficiais da linha `release4.3`. Consulte [o relatório, os commits e a cobertura](../docs/research/qubes-os.md). Preserve as licenças e avisos por componente; essas fontes são referências e não participam do build do Forge.

```sh
git submodule update --init references/qubes-core-admin \
  references/qubes-core-qrexec references/qubes-core-admin-client
```

## VS Code

`vscode/` é um submódulo de `https://github.com/microsoft/vscode`, fixado no commit `69047191fc427f2f92828279aae1d90d8eeda7ab`, correspondente à release examinada 1.146.0.

Para obter a fonte pública completa desse commit:

```sh
git submodule update --init --depth 1 references/vscode
```

O conteúdo do submódulo mantém sua licença MIT e seus avisos de terceiros. Isso não concede direito a marcas, componentes comerciais, serviços hospedados ou uso de Marketplace fora dos respectivos termos. Consulte a licença e os avisos presentes no upstream antes de distribuir derivados.

A referência não é dependência do Forge em execução, não participa do build e não foi modificada. Ela não contém a instalação pessoal de nenhum usuário. Os binários da distribuição Microsoft obtidos para análise não são redistribuídos neste repositório.

Referência à fonte completa não significa que todos os arquivos tenham sido auditados. A cobertura efetiva está no relatório de pesquisa.
