# Aprender como biblioteca: cursos da Poppy e de outras fontes

Data: 2026-09-30. Complementa o [plano do Aprender](aprender-plano.md) e os [recursos de acessibilidade e vídeo](aprender-acessibilidade-e-video.md). É um desenho: **nada disto está implementado além do que a seção 7 diz.**

> **Em uma frase:** o Aprender vira uma escola aberta e colaborativa, focada em acessibilidade, onde convivem cursos escritos pela Poppy (Ori, Aipo e o que vier) e cursos gratuitos de outras fontes, curados por nós, com atribuição clara, transcrição e um caminho de estudo que o site organiza.

---

## 1. O que muda no site

- A **ênfase** do site passa a ser dupla: mostrar os projetos e **ensinar**. Já refletido na navbar (Aprender primeiro) e na home.
- O Aprender deixa de ser "a documentação com exercícios" e passa a ser um catálogo de **cursos**, de qualquer assunto que ajude a aprender de forma acessível.
- A pessoa tem **um só lugar** para progresso, anotações e comentários, seja o curso da Poppy ou de fora.

## 2. Tipos de curso

| Tipo | Quem escreve | Como aparece | Exemplo |
|---|---|---|---|
| **Poppy** | Nós (e colaboradores) | Lições completas no site, com apostila | Pensar em código |
| **Curadoria com embed** | Outra pessoa ou instituição; nós montamos o caminho | Vídeo incorporado (clique para carregar), transcrição, guia de estudo e exercícios escritos por nós | Um curso do YouTube com licença que permite |
| **Curadoria só com link** | Outra fonte | Página do curso com resumo, para quem é, o que falta em acessibilidade e link para fora | Um curso em site de terceiros sem permissão de incorporar |
| **Colaborativo** | Comunidade, revisado por nós | Igual ao da Poppy, com créditos de quem escreveu | Um guia escrito por uma pessoa contribuidora |

## 3. Como um curso de fora entra no catálogo

Cada curso ganha os campos abaixo (o catálogo vira uma lista de "cursos" com origem):

- `source`: `poppy`, `curated` ou `community`
- `provider`, `authors`, `url` de origem, `language`, `level`, `topics`
- `license` (texto e link) e `attribution` (como deve ser creditado)
- `embed`: `allowed` (com provedor), `link-only`
- `accessibility`: legendas em português (sim/não), transcrição (nossa ou do autor), descrição de imagens, teclado
- `ourAdditions`: o que a Poppy acrescenta (guia de estudo, resumo em linguagem simples, exercícios, transcrição revisada)
- `review`: data e quem revisou

## 4. Regras de curadoria

1. **Licença antes de tudo.** Só incorporamos o que a licença ou os termos do provedor permitem. Na dúvida, entra como link. Nunca copiamos o conteúdo de um curso sem licença que permita.
2. **Atribuição sempre visível:** autor, fonte, licença e link, na página do curso e em cada lição.
3. **Acessibilidade mínima:** legendas ou transcrição em português. Sem isso, entra só se escrevermos a transcrição (respeitando a licença) ou fica de fora.
4. **Qualidade e cuidado:** conteúdo correto, sem incentivo a golpes, sem discurso de ódio, sem exigir pagamento oculto ("gratuito" tem de ser gratuito de verdade).
5. **Valor que acrescentamos:** o curso de fora ganha um guia de estudo próprio, resumo em linguagem simples e um espaço de anotações e comentários.
6. **Revisão periódica:** links quebrados e mudanças de licença são conferidos a cada seis meses.
7. **Retirada:** quem tiver um conteúdo seu no catálogo e quiser sair, sai. Um endereço de contato e um prazo de resposta ficam na página.

## 5. Como a comunidade colabora

- **Sugerir um curso** por um formulário ou por PR no repositório (arquivo de catálogo), com os campos da seção 3.
- **Revisar acessibilidade** de um curso: legendas, transcrição, contraste, teclado.
- **Escrever guias de estudo** e exercícios, com crédito no perfil (badge de contribuidor, já previsto).
- **Comentários e anotações** por lição, como já existem hoje.
- **Moderação** com as regras que já estão no ar.

## 6. Riscos e cuidados

| Risco | Cuidado |
|---|---|
| Direitos autorais | Só licença que permite, atribuição visível, contato para retirada |
| Segurança (iframes de terceiros) | Lista curta de provedores, `frame-src` na CSP, clique para carregar, revisão de segurança |
| Privacidade e LGPD | Nada de terceiros carregando antes do clique; texto de privacidade atualizado; sem rastreio |
| Qualidade desigual | Curadoria com revisão; selo de "revisado" com data |
| Conteúdo desatualizado | Data de revisão visível; verificação periódica |
| Confusão entre "curso da Poppy" e "de fora" | Etiqueta clara em cada curso e lição |
| Carga de trabalho da equipe | Começar com poucos cursos, bem escolhidos |

## 7. O que já existe e o que vem

Já existe: o catálogo de cursos da Poppy (`courses.ts`) que alimenta a página, o painel de conteúdo, o marcador de progresso e a apostila; contas, progresso, anotações e comentários; estrutura da lição com espaço reservado para vídeo.

Ordem sugerida:
1. Campos de origem no catálogo (`source`, licença, atribuição) e etiqueta visível.
2. Contêiner de vídeo com clique para carregar e CSP (veja o [documento de acessibilidade](aprender-acessibilidade-e-video.md)).
3. **Um** curso de fora como piloto, escolhido por você, com licença conferida.
4. Página de sugestão de cursos.
5. Busca e filtros por assunto, nível e acessibilidade.
6. Fórum e ranking (já desenhados em [comunidade](aprender-comunidade.md)).

## 8. Decisões que dependem de você

- Qual será o **primeiro curso de fora**? (Precisamos conferir a licença e as legendas antes de qualquer coisa.)
- Aceitamos cursos que não são de programação? A recomendação é sim, desde que tenham relação com **acessibilidade, tecnologia ou aprender a aprender**, para manter o foco.
- Quem assume a curadoria e a revisão periódica?
- Queremos uma **revisão jurídica** (direitos autorais e LGPD) antes de publicar o primeiro curso de fora? Recomendação: sim.
