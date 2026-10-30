# Direção de animação · Les Lignes Vivantes

**Não produzir vídeo.** O movimento é implementável em SVG, CSS e Web Animations.
A timeline exata está em `motion/timeline.json`; o site já inclui uma execução
leve da direção proposta. Não prometer rotação 3D, filme ou imagens intermediárias.

## Abertura

Começar com o papel, logo, navegação e CTA acessíveis. A imagem entra por uma
máscara diagonal que parte da esquerda e abre o retrato à direita. Em 2000 ms,
a foto passa de cinza a cor e opacidade .5 a 1, ease
`cubic-bezier(.2,.65,.25,1)`. A linha SVG faz contraponto, desenhada de offset 1
para 0 em 1700 ms; a segunda linha atrasa 120 ms. O título desloca apenas 14 px
e opacidade .45→1, em 850 ms com atraso de 160 ms.

Esperar fontes e `decode()` do Hero sem esconder controles ou bloquear o
documento. Se houver rolagem antes de começar, mostrar o estado final. Cancelar
o efeito quando a rolagem ultrapassa 3,5% da altura do Hero. Pausa e aba oculta
também restauram o estado estático. Não prender o usuário numa introdução.

## Rolagem e continuidade

- Hero: imagem y0→15 px e escala 1→1.012 durante a saída. Cursor fino acrescenta
  até ±3 px; as linhas respondem com metade do movimento no sentido oposto.
- Friso: desktop x−7→7 px, y−6→6 px, escala 1.018. Celular x0, y−2→2 px,
  escala 1.006. Os três serviços permanecem reconhecíveis e clicáveis.
- Localização: o 14 sobe/desce no máximo 5 px; desenho urbano até ±4 px em x.
  Texto e endereço não se deslocam junto com a decoração.
- Encerramento: desktop y±9 px e escala 1.018; celular y±2,5 px e escala 1.004.
  Título, telefone e botão permanecem estáveis.

O progresso da cena é `(alturaViewport - topoCena)/(alturaViewport + alturaCena)`,
limitado a 0–1. Atualizar em requestAnimationFrame solicitado por eventos,
somente quando a página está visível. Não manter um loop contínuo nem capturar
a rolagem. Usar a tipografia para ritmo, não grandes efeitos de blur ou zoom.

## Divisões

O traço do Hero deve encontrar a borda orgânica do friso. A transição do friso
para petróleo usa uma segunda borda clara, como intervalo de desenho. A curva
de saída do 14 retoma o açafrão e termina na textura de papel do macro. Paths
diferentes, sem repetir um componente genérico de onda em todas as junções.

## Acessibilidade e mobile

`prefers-reduced-motion`, `saveData` e pausa manual retiram máscara, fades,
deslocamentos e transições. Sem JS, mostrar o estado final completo. Não existe
runway extra, sticky prolongado ou espaço vazio quando o movimento é desligado.
As letras, serviços e CTAs não dependem de um frame específico para funcionar.

O roteiro descreve o comportamento planejado e implementado no código. Sua
fluidez visual, teclado e performance ainda precisam de browser QA real.
