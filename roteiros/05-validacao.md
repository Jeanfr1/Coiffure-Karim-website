# Validação antes de publicar

## Verificado nesta entrega

Executar `python tools/conferir-kit.py` a partir da pasta raiz. O verificador
avalia seleção, sequência das quatro cenas, único fundo liso, referências locais,
identidade, alfa, SVGs, fontes/licenças, links de telefone/Maps, JSON-LD, sintaxe
JS, dados de serviço, mestres, ausência de vídeo e integridade do inventário.

O ZIP é lido por CRC e os arquivos extraídos são comparados com os originais
do kit. O resultado consta em `docs/qa-results.json`; o conteúdo é registrado
em `MANIFEST.sha256`.

## Browser QA ainda não executado

O serviço de prévia retornou `sites-previewd mailbox is unavailable` tanto no
início quanto no diagnóstico. Nenhum navegador alternativo foi improvisado.
Não houve screenshot da implementação ou teste real de cliques/teclado/performance.

No ambiente de integração, conferir:

1. 320, 360, 375, 390, 430, 700, 768, 1024 e 1440 px. Examinar todos os títulos,
   ausência de overflow horizontal, face do Hero, três serviços e texto final.
2. Fontes locais carregadas, ausência de imagens quebradas, nenhuma substituição
   silenciosa por fonte de sistema. Comparar composição com a prancha aprovada.
3. Botões de Maps e telefone; menu móvel; categorias e abas com clique, Enter,
   setas, Home/End e Escape; retorno do foco e fechamento do diálogo.
4. Movimento normal, pausa, reload com pausa mantida, redução do sistema,
   economia de dados e JS desativado. Nenhum conteúdo pode ficar invisível.
5. Entrada com rolagem restaurada e aba oculta: a introdução deve ser cancelada;
   não deve haver loop, scroll preso ou CTA esperando uma animação acabar.
6. Zoom 200%, foco visível, leitura de títulos e ordem do documento. Rever
   contraste sobre as imagens reais carregadas, especialmente no celular.
7. Conexão lenta e aparelho real: layout shift, memória, pintura, fluidez e
   preferência por redução. Não afirmar metas de desempenho sem medir.

Corrigir problemas observados e repetir apenas os testes afetados. Não tratar
uma medição estática de fonte como prova de layout final no navegador.
