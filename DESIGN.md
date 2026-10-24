---
name: Varden — Valheim
description: Interface escura de códice para planejar construções em Valheim.
colors:
  gold-accent: "#d6ab62"
  night-bg: "#141715"
  sidebar-bg: "#101310"
  forest-surface: "#1c211d"
  parchment: "#eee8db"
  sage-muted: "#a9ada3"
  moss-border: "#30362f"
  success-sage: "#a8c29e"
  error-rose: "#f0b5a8"
typography:
  display:
    fontFamily: "Cinzel, serif"
    fontSize: "40px"
    fontWeight: 400
    lineHeight: 1.45
  title:
    fontFamily: "Cinzel, serif"
    fontSize: "20px"
    lineHeight: 1.375
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "16px"
    fontWeight: 400
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    letterSpacing: "0.16em"
rounded:
  sm: "2px"
  md: "4px"
  lg: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.gold-accent}"
    textColor: "{colors.night-bg}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "#e8bf79"
    textColor: "{colors.night-bg}"
  card:
    backgroundColor: "{colors.forest-surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "{colors.night-bg}"
    textColor: "{colors.parchment}"
    rounded: "{rounded.md}"
    padding: "12px"
---

# Design System: Varden — Valheim

## Overview

**Creative North Star: "O Códice da Floresta"**

Varden combina a atmosfera de um códice de construção com uma interface de trabalho legível: fundos de carvão esverdeado e superfícies de floresta sustentam a navegação, enquanto o dourado envelhecido destaca ações, seleção e progresso. Cinzel dá caráter aos títulos; Inter mantém formulários e informação operacional claros.

A composição é funcional e densa sem abandonar respiros consistentes: painéis delimitados por bordas discretas, capas ilustradas nas listas e acentos de cor reservados para estado e ação. A interface responde a larguras menores reorganizando a navegação e as grades, em vez de comprimir o conteúdo em uma única coluna rígida.

**Key Characteristics:**
- Fundo escuro de carvão com matiz verde e superfícies próximas em tonalidade.
- Dourado quente como acento de ação; verde-sálvia e rosa suave comunicam estados.
- Títulos serifados em Cinzel combinados com texto utilitário em Inter.
- Contornos finos e cantos discretamente arredondados, sem sombras de elevação.

## Colors

A paleta mantém baixo contraste de matiz entre as superfícies escuras e reserva o dourado para guiar a atenção; tons de sálvia e rosa aparecem em estados semânticos.

### Primary
- **Dourado de construção** (`#d6ab62`): ação principal, foco, seleção, progresso incompleto e pequenos destaques de navegação.

### Secondary
- **Rosa de erro** (`#f0b5a8`): mensagem de erro sobre superfície de alerta escura.

### Tertiary
- **Sálvia de conclusão** (`#a8c29e`): progresso concluído e estado compartilhado.

### Neutral
- **Carvão-floresta** (`#141715`): fundo geral e fundos de campos.
- **Sombra da navegação** (`#101310`): superfície da barra lateral.
- **Verde de superfície** (`#1c211d`): cartões e painéis sobre o fundo.
- **Papel-pergaminho** (`#eee8db`): texto principal e títulos claros.
- **Sálvia de apoio** (`#a9ada3`): texto descritivo sobre fundos escuros.
- **Borda musgo** (`#30362f`): contornos e divisores discretos.

### Named Rules
**The Acento de Forja Rule.** Use o dourado para ações e estados ativos, não como preenchimento indiscriminado de grandes superfícies.

## Typography

**Display Font:** Cinzel (com serif)
**Body Font:** Inter (com sans-serif)
**Label/Mono Font:** Inter também é usado nos rótulos; não há família monoespaçada recorrente.

**Character:** Cinzel empresta uma voz editorial e temática aos títulos e a alguns números; Inter contrasta com formas neutras e leitura direta na interface cotidiana.

### Hierarchy
- **Display** (400, 40px, line-height 1.45): títulos principais sem classe de tamanho utilitária, conforme a regra global de `h1`.
- **Title** (regular, 18–24px): títulos de cartões e subtítulos destacados em Cinzel.
- **Body** (400, 16px): descrições, instruções e conteúdo principal em Inter.
- **Label** (600, 12–14px, caixa alta em rótulos selecionados): nomes de seção, status e metadados curtos; o rastreamento varia conforme o contexto.

### Named Rules
**The Hierarquia de Códice Rule.** Reserve Cinzel para títulos e destaques curtos; mantenha textos de leitura, controles e descrições em Inter.

## Layout

O conteúdo autenticado reserva uma barra lateral de 256px em telas médias ou maiores; em telas menores, a navegação muda para uma faixa superior com altura máxima de 52vh. O conteúdo principal usa margens responsivas e padding horizontal de 16px em telas estreitas e 40px em desktop.

As páginas de listagem e detalhe limitam o conteúdo a 1440px; formulários de criação limitam a 768px e a tela de acesso, a 448px. Cartões de lista passam de uma coluna para duas em `md` e três em `xl`; resumos usam três colunas a partir de `md`. Formulários e cabeçalhos reorganizam grupos horizontalmente em `sm`, preservando empilhamento em telas pequenas.

O ritmo recorrente segue incrementos de 4px: controles usam padding de 8–16px, painéis usam normalmente 16–24px e separações entre seções são tipicamente 24px. Esses valores vêm dos utilitários de espaçamento efetivamente usados.

## Elevation & Depth

O sistema é plano: não há vocabulário recorrente de sombras. A profundidade vem de superfícies em tons próximos, bordas finas e imagens de capa. Interações mudam cor de borda ou preenchimento; campos mostram foco com borda e anel dourados.

### Named Rules
**The Camadas Tonais Rule.** Diferencie painéis do fundo com os tons escuros existentes e bordas discretas, não com sombras projetadas.

## Shapes

As formas são retangulares e contidas: controles usam cantos de 2–4px, cartões podem chegar a 6px e badges usam contornos finos. Imagens de capa são recortadas para preencher seus quadros; barras de progresso usam extremidades totalmente arredondadas. Não há linguagem visual de grandes pílulas como padrão.

## Components

### Buttons
- **Caráter:** ações compactas e claramente identificadas, com dourado sólido para a ação principal.
- **Shape:** cantos discretos (2px no botão compartilhado; variantes locais também usam 4px).
- **Primary:** fundo dourado e texto carvão, com padding típico de 12px 16px; controles compactos podem reduzir para 8px 12px.
- **Hover / Focus:** o botão compartilhado clareia o dourado e a borda; o foco visível usa contorno dourado com offset. O hover e o padding variam entre a diretiva de botão e botões locais.
- **Secondary / Ghost:** ações secundárias usam texto dourado ou neutro, ou borda musgo/dourada sem preenchimento dominante.

### Cards / Containers
- **Corner Style:** cantos de 4–6px.
- **Background:** superfície verde-floresta sobre o fundo carvão.
- **Shadow Strategy:** sem sombra; borda de 1px distingue o contêiner.
- **Border:** musgo discreto, com algumas variantes de estado usando borda dourada ou sálvia.
- **Internal Padding:** normalmente 16px; formulários chegam a 24px.

### Inputs / Fields
- **Style:** fundo carvão, texto claro, borda musgo e cantos de 4px; padding comum de 12px.
- **Focus:** borda e anel de 1px dourados.
- **Error / Disabled:** erros usam texto rosa sobre fundo vinho escuro e borda avermelhada; estados desabilitados reduzem opacidade.

### Navigation
- **Style:** barra lateral escura com links em Inter; grupos de seção e itens ativos recebem Cinzel e/ou dourado.
- **Default / Hover / Active:** texto sálvia ou cinza-esverdeado; hover acrescenta uma superfície verde discreta; ativo realça o texto com dourado ou pergaminho.
- **Mobile:** a barra lateral passa a ocupar o topo e limita sua altura; a lista interna permanece rolável.

### Chips / Status
- **Style:** etiquetas compactas em caixa alta, com fundo transparente e borda colorida.
- **State:** lista privada recebe dourado; compartilhada ou concluída recebe sálvia; progresso em andamento usa o dourado.

## Do's and Don'ts

### Do:
- **Do** mantenha fundos, painéis e contornos nas famílias de carvão e verde escuro já aplicadas.
- **Do** use o dourado existente para ações, foco e estado ativo, com texto escuro em botões preenchidos.
- **Do** use Cinzel em títulos curtos e Inter para texto corrido, rótulos e controles.
- **Do** preserve contorno de foco visível e contraste entre texto e superfície.

### Don't:
- **Don't** introduza sombras como substituto das bordas e camadas tonais existentes.
- **Don't** substitua o dourado por uma cor de ação saturada alheia à paleta.
- **Don't** use Cinzel em blocos longos de texto ou Inter como substituto genérico dos títulos serifados já usados.
