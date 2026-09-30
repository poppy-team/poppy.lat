# Auditoria de acessibilidade do site poppy.lat

Data: 2026-09-30. Escopo: o site inteiro (home, projetos, blog, Aprender e as lições, conta, documentação importada de Ori, Aipo, Oride e Prumo, página não encontrada), em português e inglês, nos temas claro e escuro, em tela de computador (1280 px) e de celular (390 px). Complementa o [plano de recursos de acessibilidade](aprender-acessibilidade-e-video.md).

> **Resultado em uma frase:** a varredura automática encontrou problemas reais de contraste, de marcos de página (landmarks), de "pular para o conteúdo" e da barra lateral da documentação. Todos os que uma ferramenta acha foram corrigidos, e agora um teste automático impede que voltem. O que uma ferramenta não consegue ver (leitor de tela de verdade, pessoas usando o site) continua pendente e está listado no fim.

---

## 1. Como foi feita

**Automática, com axe-core** (a biblioteca de testes de acessibilidade mais usada), nas regras do WCAG 2.0, 2.1 e 2.2 níveis A e AA e nas boas práticas do axe. Foram **25 páginas** (uma de cada tipo, mais as páginas de documentação de cada projeto) × **4 combinações** (computador claro, computador escuro, celular claro, celular escuro), 100 varreduras no total.

**Verificações manuais com script**, em 10 páginas:
- um único `h1` por página e ordem dos títulos sem saltos;
- imagens com texto alternativo (`alt`);
- idioma da página declarado (`lang`) e correto nas páginas em inglês;
- reflow em 320 px de largura (equivale a ampliar 400%), sem rolagem horizontal;
- espaçamento de texto do WCAG 1.4.12 (linha 1,5, letras 0,12 em, palavras 0,16 em, parágrafos 2 em) sem perder conteúdo nem rolar para o lado;
- indicador de foco visível ao navegar por Tab nas páginas principais;
- tamanho dos alvos de toque (mínimo de 24 px do WCAG 2.2) e nome acessível em links e botões;
- `prefers-reduced-motion`: nenhuma animação roda quando a pessoa pede menos movimento.

---

## 2. O que foi encontrado e corrigido

| # | Problema | Gravidade | Onde | Correção |
|---|---|---|---|---|
| 1 | **Caixas "Checkpoint" ilegíveis no tema escuro** (texto claro sobre fundo verde claro, contraste de 1,67:1). Causa: o campo `project` da lição (nome do programa que ela constrói) era lido como se fosse o identificador de um projeto da equipe, e o site aplicava a cor do Ori. | Séria | Todas as lições, tema escuro | O site só marca a página com um projeto se o valor for mesmo um projeto da equipe (`ori`, `aipo`, `oride`, `prumo`). |
| 2 | **Cores do código abaixo de 4,5:1**: comentários (4,4:1 no claro e 3,1:1 no escuro), palavras-chave em vermelho (4,2:1) e laranja (3,2:1). | Séria | Documentação e lições (centenas de trechos) | As cores foram trocadas por tons mais escuros (tema claro) ou mais claros (tema escuro), do mesmo matiz, todos acima de 4,5:1. |
| 3 | **Texto cinza-médio abaixo de 4,5:1** sobre fundos de papel, verde e azul claros (3,8:1 a 4,3:1): notas de origem, numeração das seções, rodapé legal. | Séria | Home, documentação, rodapé | O cinza-médio foi escurecido (de `#6b6c62` para `#5f6057`), agora no mínimo 4,5:1 em todos os fundos. |
| 4 | **Código dentro das caixas de aviso** em amarelo sobre marrom (4,4:1) no tema escuro. | Moderada | Lições, tema escuro | O código dentro das caixas usa a cor do texto. |
| 5 | **Páginas sem marco principal (`main`)**: leitores de tela não tinham como pular direto para o conteúdo nas páginas de home, projetos, blog, Aprender, conta, documentação (índices) e página não encontrada. | Moderada | 80 ocorrências | Cada uma dessas páginas agora tem um `main` único. |
| 6 | **Dois marcos de topo (`banner`) e dois de rodapé (`contentinfo`)** na mesma página. | Moderada | Blog, Aprender, conta, documentação | Com o `main` correto, o cabeçalho do conteúdo deixou de ser um `banner`; o rodapé de navegação da documentação deixou de ser um segundo `contentinfo`. |
| 7 | **Marcos sem nome único**: o menu principal e o do rodapé tinham o mesmo nome ("Navegação principal"). | Moderada | Todas as páginas | O menu do rodapé agora se chama "Navegação do rodapé" (e "Footer navigation" em inglês). |
| 8 | **"Pular para o conteúdo" apontando para nada** nas páginas de conta. | Moderada | `/conta/*` | As páginas de conta têm o destino do link. |
| 9 | **Dois links de "pular"**, um em inglês ("Skip to content") do VitePress, além do nosso. | Menor | Documentação e lições | O link em inglês foi removido; fica o nosso, no idioma da página. |
| 10 | **Barra lateral da documentação com botão dentro de botão** (o grupo e a seta de abrir/fechar), o que confunde leitores de tela. Além disso a seta se chamava "toggle section" em inglês e o estado aberto/fechado não era dito. | Séria | 208 ocorrências na documentação | O grupo continua sendo o botão; a seta virou decoração; o estado (`aria-expanded`) passou a ser anunciado e o rótulo foi traduzido. É uma correção nossa sobre uma limitação do VitePress. |
| 11 | **Conteúdo fora de marcos** no cabeçalho de documentação e de lição. | Menor | Documentação e lições | Cada faixa virou uma região com nome ("Documentação do projeto", "Sobre esta lição"). |

Depois das correções a varredura completa retorna **zero violações** nas 100 combinações.

## 3. O que já estava bom

- Um `h1` por página, sem saltos na ordem dos títulos, em todas as páginas verificadas.
- Nenhuma imagem sem `alt`.
- `lang` correto em português e inglês.
- **Reflow em 320 px sem rolagem horizontal** e **espaçamento de texto aumentado sem perda de conteúdo**.
- Indicador de foco visível nos elementos navegáveis por teclado (o único sem indicador próprio é o botão de opção escondido das abas de código, cujo foco aparece no rótulo).
- Alvos de toque de tamanho adequado; links dentro de texto seguem a exceção do WCAG.
- **`prefers-reduced-motion` respeitado.**
- Leitura ajustável nas lições (tamanho, espaçamento, fonte de alta legibilidade, quebra de linha em código, modo foco), salva no navegador.
- Painel de conteúdo das lições com foco preso enquanto aberto e fechando com Escape.

## 4. Como isso fica protegido

Foi adicionado `tests/e2e/a11y.spec.ts`: roda o axe em 13 páginas nos dois temas e em 4 páginas no celular (30 testes) e falha se aparecer qualquer violação. Ele roda junto com os demais testes automáticos do projeto.

## 5. O que uma ferramenta não consegue ver (pendente)

As ferramentas automáticas pegam cerca de um terço dos problemas de acessibilidade. Falta:

1. **Teste com leitor de tela de verdade** (NVDA e Firefox no Windows, VoiceOver no iPhone e no Mac, TalkBack no Android) nas jornadas principais: abrir uma lição, usar o painel de conteúdo, marcar como concluída, escrever uma anotação, comentar.
2. **Teste com pessoas**: leitores de tela, baixa visão, TDAH, dislexia, autismo. Sugestão: convidar a comunidade a testar cada módulo antes de publicar.
3. **Editor de anotações** (WYSIWYG): a barra de ferramentas, a navegação por setas e o modo Markdown precisam de teste com leitor de tela.
4. **Modal de notificações e o painel de gestão** que virão: entram na rotina de teste desde o começo.
5. **Documentação importada**: o conteúdo vem dos repositórios de Ori, Aipo, Oride e Prumo. Tabelas sem cabeçalho, links "clique aqui" e imagens sem descrição dependem do texto de origem e devem ser corrigidos lá.
6. **Zoom de 200% com texto maior do sistema** e modo de alto contraste do Windows (`forced-colors`): ainda não foram testados.
7. **Vídeo e áudio**: quando entrarem, valem as regras do [plano](aprender-acessibilidade-e-video.md) (transcrição, legendas, clique para carregar).

## 6. Recomendações

- Repetir a varredura a cada mudança grande de interface (já acontece nos testes automáticos).
- Incluir "teste com teclado" e "teste com leitor de tela" na lista de conferência de cada PR que mexa em interface.
- Publicar uma **declaração de acessibilidade** no rodapé (o que foi feito, limites conhecidos, como avisar de um problema), o que também convida a comunidade a colaborar.
- Só aceitar vídeo de terceiros com legenda em português ou transcrição escrita por nós.
