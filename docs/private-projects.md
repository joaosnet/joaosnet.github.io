# Importação seletiva de projetos privados

O fluxo público nunca consulta repositórios privados. Uma importação privada é um comando local separado e não publica conteúdo nem imagens.

1. Crie `.private-preview/allowlist.json`, um array JSON com os identificadores exatos dos repositórios que podem ser consultados. Essa pasta é ignorada e nunca copiada para `dist/`.
2. Disponibilize `PRIVATE_REPOS_TOKEN` somente no ambiente do processo local, com acesso de leitura restrito aos repositórios escolhidos. O script não carrega `.env`, não lê `.netrc` e não usa esse token no comando `public`.
3. Execute `uv run python update_projects.py private-preview owner/repository`. Apenas metadados básicos são salvos localmente; não há leitura automática do README, download de imagens ou tradução externa. O comando mostra um hash de revisão, não conteúdo privado.
4. Revise o arquivo local e escreva `.private-preview/editorial.json`: um array no mesmo formato editorial de `content/projects.json`, usando `visibility: "private"` e `reviewed: true`. O campo `repo` e quaisquer identificadores da origem privada devem ser omitidos. Escreva ambas as línguas, participação, limites e evidências que você pode divulgar. Use apenas visualizações locais já permitidas (`signal`, `mobile`, `optimization`). Não copie a resposta bruta da API.
5. Confira o conteúdo completo e calcule seu SHA-256: `Get-FileHash .private-preview/editorial.json -Algorithm SHA256`. Passe o hash em letras minúsculas para `uv run python update_projects.py approve .private-preview/editorial.json --digest HASH`.
6. O comando valida o documento e prepara `content/private-approved.json`. Qualquer edição posterior exige novo hash e revisão. Gere o site, examine a prévia e o diff antes de fazer commit.

Não use um PR público ou um artefato público para revisar dados ainda privados. O arquivo promovido já deve conter exclusivamente informações liberadas para divulgação. As permissões do GitHub não substituem sua autorização para divulgar conteúdo de colaboradores ou organizações.

Esta implementação não importou nenhum projeto privado novo e não criou allowlists usando nomes inferidos. As três páginas iniciais usam fontes públicas. O inventário histórico está em `security-review.md`.
