# PLAZA 2001

Jogo de skate 3D low-poly, com cara de PS2, numa cidade do interior. A turma (K.F., Manu, Kauã,
Gabi, Kauane e a Julie) anda pela pista, pela cidade e pela ladeira. Tem missões dos moradores,
desafios de cada skatista e a história do K.F. com a Julie. Dá pra entrar na lan house e na loja
de discos a pé. Tem também câmera digital, filmadora e a rádio de cada skatista.

## Jogar

Precisa do [Node.js](https://nodejs.org) instalado. Na pasta do projeto:

```
npm run dev
```

Depois abra **http://localhost:3000** no navegador. Abrir o `index.html` direto (dando dois
cliques) também funciona, mas aí a rádio e os discos não tocam, porque o YouTube só toca por
`http://`.

## Como o projeto é organizado

```
src/            código do jogo (um arquivo pra cada parte)
  page.html     a página: menus, HUD, telas da loja e da lan
  engine2.js    motor 3D (WebGL 1, contorno preto, sombra em faixas)
  art.js        atlas de grafites, placas e letreiros
  chars.js      personagens: corpo, roupas, cabelos, rostos, poses
  city.js       a cidade: ruas, prédios, ladeira, estação, feira
  level.js      a pista e o que junta tudo
  game.js       física do skate, manobras, missões, história, NPCs, lojas por dentro
  inside.js     a loja de discos e a lan house por dentro
  radio.js      rádio dos skatistas e os discos da loja (YouTube)
  music.js      trilha sintetizada (quando não tem rádio)
  discman.js    o discman 3D do canto da tela
build.js        junta tudo de src/ no index.html
server.js       servidor local simples (porta 3000)
index.html      o jogo pronto (gerado pelo build)
```

Pra mudar o jogo: edite os arquivos de `src/` e rode `npm run build` (ou `npm run dev`).

## Discos da loja

Os discos ficam em `src/radio.js`, na lista `ALBUNS`. Cada um tem artista, título, ano, a capa
(foto) e as faixas. Um disco toca de um destes jeitos: por uma playlist oficial do álbum (`pl`),
por um vídeo só com o álbum inteiro (`um`, com o segundo em que cada faixa começa) ou por um
vídeo pra cada faixa. Os discos da lista `ALBUNS` ficam na parede da loja. O resto vai pras
gôndolas.

## Controles

Setas ou WASD movem. Espaço segura e solta o ollie. J faz flip, K faz grind, L faz grab e E solta
o especial. C troca a câmera, F abre a câmera digital, R liga a filmadora e Enter aceita missões.
Dentro das lojas: as setas andam, Enter mexe nas coisas e F põe o fone nas cabines.
