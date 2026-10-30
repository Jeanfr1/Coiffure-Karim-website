# Coiffure Karim · Kit completo · Modelo 3

**Les Lignes Vivantes — seleção de 30/10/2026.**

O kit reúne o site editável em francês, identidade completa, logo PNG com
transparência real, SVGs nativos, fontes locais com licenças, imagens mestres,
guia visual, README e roteiros. **Não contém vídeo nem sequência de frames.**

## Começar

1. Descompacte todo o ZIP, preservando as pastas.
2. Abra `site/index.html` no navegador. O site é estático, sem instalação,
   build, CDN, API, formulário ou servidor de aplicação. Também pode ser
   servido como pasta estática em uma hospedagem.
3. Abra `docs/GUIA-VISUAL.html` para consultar a marca, a referência e os assets.
4. Leia `roteiros/01-implementacao.md` antes de integrar o projeto a outra base.

O site não foi publicado. A configuração local de hospedagem não contém
identificador de Site, domínio, credenciais ou endereço público inventado.

## Modelo aprovado

| Ordem | Cena | Composição |
|---|---|---|
| 1 | Hero | Retrato, desenho e pintura; “L’art de la ligne.” |
| 2 | Les coupes | Friso contínuo Homme / Enfant / Barbe; “Trois gestes.” |
| 3 | Nous trouver | Único fundo liso principal, petróleo; número 14 em forma de pente |
| 4 | Contact | Macro de corte; “Le prochain trait, c’est le vôtre.” |

A referência canônica é a **imagem anexada na escolha do usuário**, preservada
em `references/Modelo-3-Aprovado.png`. Ela inclui o pequeno motivo urbano da
localização. A implementação mantém esse detalhe como desenho decorativo livre,
sem afirmar que representa uma vista, monumento ou fachada real.

Hero e seções pertencem ao modelo 3. As propostas 1 e 2 não integram este kit.
Textos e botões são HTML editável; a prancha aprovada é uma referência visual,
não uma captura da implementação.

## O que existe em cada pasta

| Pasta | Conteúdo |
|---|---|
| `site/` | Página completa, CSS, JS, SVGs, WebP e fontes WOFF locais |
| `brand/` | Logos petróleo/marfim PNG e SVG, K, assinatura, avatar, número 14, motivo urbano e tokens |
| `brand/source/` | PNG original da proposta, preservado sem alteração |
| `fonts/` | Fontes TTF estáticas, originais variáveis e licenças OFL |
| `images/master/` | Quatro imagens de campanha PNG sem textos ou botões |
| `references/` | Escolha anexada, conceito e informações recebidas |
| `motion/` | Timeline numérica e regras da animação, sem vídeo |
| `roteiros/` | Seis instruções de implementação, movimento, marca, conteúdo, QA e briefing |
| `docs/` | Guia visual, textos franceses, fontes, seleção, inventário e resultado de QA |
| `tools/` | Exportador opcional e verificador do kit |

## Identidade e tipografia

- Petróleo `#172A36`, papel `#F3EFE4`, açafrão `#EBA247`, verde-petróleo
  `#1D7F83`, coral `#CE543A`. O lettering de leitura sobre papel usa o tom
  escurecido `#BD662A`.
- O K e a assinatura Karim são lettering autoral convertido em contornos SVG.
  O pente surge no braço inferior do K. Não se trata de uma fonte de alfabeto completo.
- Títulos: **Bricolage Grotesque** 600/700. Texto e interface: **DM Sans**
  400/500/600. Acentos manuscritos: **Caveat** 500/600.
- As três famílias são distribuídas localmente com suas licenças OFL.
- Logos PNG: **1774 × 887 px, RGBA**. Os SVGs são vetores com paths reais,
  sem imagens raster embutidas. O PNG original também está preservado.
- Para cabeçalho/rodapé, usar os SVGs com viewBox ajustado de `site/assets/`;
  a geometria da marca é a mesma, com menos margem vazia.

## Imagens

As imagens do site são **campanhas ilustradas geradas para esta identidade**.
Não são fotos documentais do proprietário, equipe, clientes, trabalhos reais
ou interior do salão. O retrato do Hero não identifica Karim.

O arquivo de informações recebido contém uma pequena foto externa dentro de
uma captura de diretório; ela foi mantida como fonte de informações e não
transformada em fotografia de alta resolução do estabelecimento.

Há um Hero horizontal e uma composição própria para celular. O friso mantém
os três serviços numa imagem contínua. A cena final foi criada com área clara
para o texto vivo. Todos os mestres e seus formatos WebP estão incluídos.

## Movimento e controles

A abertura revela o retrato com máscara diagonal e passagem de cinza para cor;
a linha SVG aparece como desenho. Depois, pequenos movimentos de planos
acompanham a rolagem. As três divisões de cena têm paths diferentes.

Não há scroll capturado, vídeo, áudio, loop permanente, canvas ou biblioteca
externa. O Hero não bloqueia o acesso aos botões. O modo reduzido do sistema,
economia de dados e pausa manual retiram os efeitos. O site continua legível
com JS desativado. A preferência manual é a única informação persistida localmente.

Homme, Enfant e Barbe abrem detalhes acessíveis com abas. Sem JS, esses links
continuam apontando ao telefone. Telefone e itinerário são destinos reais
acionados pelo visitante. Não há calendário, reserva online simulada ou
formulário de coleta. A página consultada no Planity não oferecia reserva online.

## Dados e alterações

Endereço: **14 rue Maurice Sambron, 44160 Pontchâteau**.
Telefone: **07 58 12 73 70** / `tel:+33758127370`.

`site/content.js` centraliza as descrições das categorias e o contato usado
pelos scripts. Para alterar telefone/endereço, atualizar também os links HTML,
metadados JSON-LD e textos, depois executar o verificador. Não trocar pelos
dados de Aymen ou Au Fil du Style, que são outros projetos.

Horários, preços atuais, avaliações, redes sociais, e-mail, SIRET e nomes da
equipe não foram publicados sem confirmação para esta implementação.

## Verificação

`docs/qa-results.json` registra os checks estáticos. O ZIP é conferido por CRC e
comparação dos arquivos; `MANIFEST.sha256` lista o conteúdo distribuído.

**Browser QA: UNVERIFIED.** O serviço de prévia está indisponível neste ambiente.
Não houve revisão de layout final, cliques, teclado ou desempenho em navegador.
Medições de fontes e verificações de código não substituem essa revisão.
O roteiro `roteiros/05-validacao.md` lista os testes necessários no ambiente real.

Para conferir os arquivos localmente, com as dependências opcionais instaladas:

```bash
python tools/conferir-kit.py
```

O verificador não muda arquivos por padrão. `--atualizar-relatorio` grava o
resultado de QA. O site não depende de Python. O exportador `preparer-assets.py`
reproduz vetores, formatos web e fontes a partir dos arquivos incluídos, sem
download implícito e sem editar as referências originais.
