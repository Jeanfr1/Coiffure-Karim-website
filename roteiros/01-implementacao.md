# Implementação · Modelo 3

Usar o conteúdo de `site/` como base completa. A entrega é local e estática;
publicação não faz parte desta etapa. Não iniciar outro projeto temático ou
substituir o CSS por um template de barbearia preto/dourado.

## Ordem obrigatória

1. `#accueil`: logo, navegação, retrato à direita, “L’art” + “de la ligne.”,
   Homme · Enfant · Barbe e itinerário.
2. `#les-coupes`: friso único com os três temas. O título `#le-geste` mantém
   “Trois gestes.” e “Une même attention.”. Os nomes são links sobre a imagem.
3. `#nous-trouver`: único fundo liso, petróleo. O 14-pente fica à esquerda;
   endereço, telefone e itinerário à direita. Motivo urbano desenhado discreto.
4. `#contact`: macro de corte e área clara de leitura; título, marca, telefone
   e Appeler. Rodapé dentro da mesma cena.

Não acrescentar outra seção comercial ou mover os serviços para três cards.
Os detalhes de categoria ficam no diálogo, não numa quinta cena.

## Assets e texto

Os quatro PNGs em `images/master/` são os mestres. O site consome WebP de
qualidade 94. O Hero usa `<picture>` para escolher o retrato vertical em telas
até 700 px; as dimensões HTML reservam espaço. Os textos não são parte das fotos.

Manter nomes relativos e fontes locais. Todo o site funciona sem build ou
CDN. O único JS de conteúdo é `content.js`; `app.js` cuida de movimento, menu
e diálogo. Não introduzir dependência de fetch para abrir o arquivo localmente.

## Divisões

As três costuras são SVGs inline distintos. Hero: contorno fino de cabelo;
friso: dupla borda clara sobre entrada petróleo; localização: curva ampla com
linha açafrão e linha de grafite. As áreas vazadas são preenchidas pela cor
papel ou petróleo da cena seguinte, sem revelar branco de uma página externa.

As proporções e o peso da imagem seguem a referência. No celular, o macro final
fica acima do texto para preservar mãos, ferramenta e área de leitura. Não
reduzir a página inteira a uma imagem; links e textos precisam continuar reais.

## Interações

- Menu móvel: `<details>` nativo, fecha ao seguir um link e com Escape.
- Categorias: `<dialog>` nativo, três abas com setas, Home/End, Escape e retorno
  de foco. Sem suporte ao diálogo ou sem JS, o link original chama o telefone.
- Botões de itinerário abrem Maps com o endereço completo; links externos têm
  `noopener noreferrer`.
- Botão de movimento: pausa manual, preferência persistida, respeito a redução
  do sistema e economia de dados. Não insistir em ligar movimento bloqueado pelo sistema.

Conferir sintaxe e integridade antes de publicar. Browser QA não foi executado
nesta entrega; seguir o roteiro 05 em ambiente com navegador funcional.
