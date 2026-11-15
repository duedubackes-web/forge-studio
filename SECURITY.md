# Segurança

Esta versão é um protótipo local, de usuário único. Execute em 127.0.0.1 e não exponha por túnel, proxy público ou container com encaminhamento externo. Não há login, autorização multiusuário, criptografia de dados em repouso ou rate limiting.

Não inclua senhas, tokens ou dados pessoais em objetivos e evidências. `.data`, arquivos de ambiente, caches, logs e artefatos de execução são ignorados pelo Git.

O servidor valida Host e Origin, limita corpos JSON, usa CSP sem scripts inline e serve somente arquivos estáticos enumerados. Isso não transforma o protótipo em serviço de produção.

O agente eve é um processo separado, com configuração de autenticação do scaffold. Nenhuma conversa paga foi necessária para testar o Studio. Não use o limite configurado no Studio como proteção de gastos do processo eve.

Para produção, concluir os itens P0 do roadmap, revisar autenticação de rotas e streams e executar testes de acesso entre usuários. Não executar código importado no processo da API.

Relate problemas privadamente ao proprietário do repositório, sem incluir credenciais ou dados reais em issues públicas.
