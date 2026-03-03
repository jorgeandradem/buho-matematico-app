export const worldTourData = [
  // --- AMÉRICA ---
  {
    id: "am_01",
    continente: "América",
    color: "#2D5A27",
    historia: "Había 15 loros en una rama. De repente, 5 volaron al río. Luego, cada loro que quedó llamó a 2 amigos más.",
    pregunta: "¿Cuántos loros nuevos llegaron a la rama?",
    pasos: [
      { a: 15, op: "-", b: 5, res: 10 },
      { a: 10, op: "x", b: 2, res: 20 }
    ]
  },
  {
    id: "am_02",
    continente: "América",
    color: "#E74C3C",
    historia: "Un teleférico subió con 8 personas. En la cima, se duplicó la cantidad de pasajeros. Antes de bajar, 5 personas se quedaron arriba.",
    pregunta: "¿Cuántos pasajeros bajaron en el teleférico?",
    pasos: [
      { a: 8, op: "x", b: 2, res: 16 },
      { a: 16, op: "-", b: 5, res: 11 }
    ]
  },
  {
    id: "am_03",
    continente: "América",
    color: "#2980B9",
    historia: "En un estadio había 12 bates. Los jugadores trajeron 8 más. Si hay 10 jugadores y cada uno usa 2 bates.",
    pregunta: "¿Cuántos bates usaron en total los 10 jugadores?",
    pasos: [
      { a: 12, op: "+", b: 8, res: 20 },
      { a: 10, op: "x", b: 2, res: 20 }
    ]
  },
  {
    id: "am_04",
    continente: "América",
    color: "#F1C40F",
    historia: "Un mariachi tenía 3 guitarras. Compró otras 3 para sus alumnos. Si cada guitarra nueva tiene 6 cuerdas.",
    pregunta: "¿Cuántas cuerdas hay en total en las guitarras nuevas?",
    pasos: [
      { a: 3, op: "+", b: 3, res: 6 },
      { a: 6, op: "x", b: 6, res: 36 }
    ]
  },
  {
    id: "am_05",
    continente: "América",
    color: "#27AE60",
    historia: "Viste 20 coatíes en el camino. 12 se fueron al bosque. Los que quedaron encontraron 3 trozos de fruta cada uno.",
    pregunta: "¿Cuántos trozos de fruta recolectaron en total?",
    pasos: [
      { a: 20, op: "-", b: 12, res: 8 },
      { a: 8, op: "x", b: 3, res: 24 }
    ]
  },
  {
    id: "am_06",
    continente: "América",
    color: "#8E44AD",
    historia: "Había 5 llamas en las ruinas. Llegaron otras 5 para pastar. Si cada llama come 4 kilos de pasto al día.",
    pregunta: "¿Cuántos kilos de pasto comen las 10 llamas?",
    pasos: [
      { a: 5, op: "+", b: 5, res: 10 },
      { a: 10, op: "x", b: 4, res: 40 }
    ]
  },
  {
    id: "am_07",
    continente: "América",
    color: "#2C3E50",
    historia: "En la NASA había 4 cohetes. Duplicaron la flota para una misión. Si cada cohete nuevo lleva 3 astronautas.",
    pregunta: "¿Cuántos astronautas viajarán en los nuevos cohetes?",
    pasos: [
      { a: 4, op: "x", b: 2, res: 8 },
      { a: 8, op: "x", b: 3, res: 24 }
    ]
  },
  {
    id: "am_08",
    continente: "América",
    color: "#6E4B1F",
    historia: "Un camión llevaba 40 sacos de café. Descargó 20 en la bodega. Los sacos restantes se triplicaron con una nueva cosecha.",
    pregunta: "¿Cuántos sacos de café tiene el camión ahora?",
    pasos: [
      { a: 40, op: "-", b: 20, res: 20 },
      { a: 20, op: "x", b: 3, res: 60 }
    ]
  },
  {
    id: "am_09",
    continente: "América",
    color: "#5DADE2",
    historia: "En el Salto Ángel había 10 botes. Llegaron 5 botes más. Si cada bote nuevo lleva 4 turistas.",
    pregunta: "¿Cuántos turistas hay en los 15 botes?",
    pasos: [
      { a: 10, op: "+", b: 5, res: 15 },
      { a: 15, op: "x", b: 4, res: 60 }
    ]
  },
  {
    id: "am_10",
    continente: "América",
    color: "#AED6F1",
    historia: "Había 12 pingüinos en el hielo. 4 saltaron al agua fría. Los que quedaron pescaron 5 peces cada uno.",
    pregunta: "¿Cuántos peces pescaron en total los 8 pingüinos?",
    pasos: [
      { a: 12, op: "-", b: 4, res: 8 },
      { a: 8, op: "x", b: 5, res: 40 }
    ]
  },

  // --- EUROPA ---
  {
    id: "eu_01",
    continente: "Europa",
    color: "#E67E22",
    historia: "En París había 6 panaderías. Cada una horneó 10 cruasanes. Por la mañana se vendieron 15 cruasanes.",
    pregunta: "¿Cuántos cruasanes quedan en total en la ciudad?",
    pasos: [
      { a: 6, op: "x", b: 10, res: 60 },
      { a: 60, op: "-", b: 15, res: 45 }
    ]
  },
  {
    id: "eu_02",
    continente: "Europa",
    color: "#3498DB",
    historia: "Viste 5 góndolas en Venecia. En cada una subieron 4 personas. Al llegar al puente, bajaron 6 personas.",
    pregunta: "¿Cuántas personas quedan en las góndolas ahora?",
    pasos: [
      { a: 5, op: "x", b: 4, res: 20 },
      { a: 20, op: "-", b: 6, res: 14 }
    ]
  },
  {
    id: "eu_03",
    continente: "Europa",
    color: "#C0392B",
    historia: "Un autobús de Londres tenía 10 pasajeros. Se triplicó la cantidad en la estación. Luego bajaron 12 personas.",
    pregunta: "¿Cuántos pasajeros quedan en el autobús?",
    pasos: [
      { a: 10, op: "x", b: 3, res: 30 },
      { a: 30, op: "-", b: 12, res: 18 }
    ]
  },
  {
    id: "eu_04",
    continente: "Europa",
    color: "#2C3E50",
    historia: "En el castillo había 8 guardias. Llegaron 4 más para el turno. Si cada guardia tiene 2 lanzas de plata.",
    pregunta: "¿Cuántas lanzas hay en total en la muralla?",
    pasos: [
      { a: 8, op: "+", b: 4, res: 12 },
      { a: 12, op: "x", b: 2, res: 24 }
    ]
  },
  {
    id: "eu_05",
    continente: "Europa",
    color: "#2ECC71",
    historia: "Viste 4 establos en los Alpes. En cada uno hay 5 vacas. Si 7 vacas salieron a pastar fuera.",
    pregunta: "¿Cuántas vacas se quedaron dentro de los establos?",
    pasos: [
      { a: 4, op: "x", b: 5, res: 20 },
      { a: 20, op: "-", b: 7, res: 13 }
    ]
  },
  {
    id: "eu_06",
    continente: "Europa",
    color: "#F39C12",
    historia: "Un vikingo tenía 3 barcos. En cada barco puso 8 escudos. Durante una batalla perdió 5 escudos.",
    pregunta: "¿Cuántos escudos le quedan en total en su flota?",
    pasos: [
      { a: 3, op: "x", b: 8, res: 24 },
      { a: 24, op: "-", b: 5, res: 19 }
    ]
  },
  {
    id: "eu_07",
    continente: "Europa",
    color: "#1ABC9C",
    historia: "En Grecia había 10 olivos. Cada uno dio 5 kilos de aceitunas. Usaron 20 kilos para hacer aceite.",
    pregunta: "¿Cuántos kilos de aceitunas quedaron sin usar?",
    pasos: [
      { a: 10, op: "x", b: 5, res: 50 },
      { a: 50, op: "-", b: 20, res: 30 }
    ]
  },
  {
    id: "eu_08",
    continente: "Europa",
    color: "#9B59B6",
    historia: "Había 15 ramos de lavanda. Duplicaron la cosecha hoy. Si vendieron 10 ramos en el mercado.",
    pregunta: "¿Cuántos ramos quedan para vender mañana?",
    pasos: [
      { a: 15, op: "x", b: 2, res: 30 },
      { a: 30, op: "-", b: 10, res: 20 }
    ]
  },
  {
    id: "eu_09",
    continente: "Europa",
    color: "#D35400",
    historia: "En el Coliseo había 6 gladiadores. Cada uno trajo a 2 compañeros. Si 5 se fueron a entrenar fuera.",
    pregunta: "¿Cuántos gladiadores quedan en la arena?",
    pasos: [
      { a: 6, op: "x", b: 3, res: 18 },
      { a: 18, op: "-", b: 5, res: 13 }
    ]
  },
  {
    id: "eu_10",
    continente: "Europa",
    color: "#2D5A27",
    historia: "En un campo de fútbol había 2 equipos de 11 jugadores. Si 4 jugadores recibieron tarjeta roja.",
    pregunta: "¿Cuántos jugadores quedan en the campo de juego?",
    pasos: [
      { a: 2, op: "x", b: 11, res: 22 },
      { a: 22, op: "-", b: 4, res: 18 }
    ]
  },

  // --- ASIA ---
  {
    id: "as_01",
    continente: "Asia",
    color: "#C0392B",
    historia: "Viste 4 dragones en el festival. Cada uno tenía 5 linternas. Si se apagaron 6 linternas por el viento.",
    pregunta: "¿Cuántas linternas quedaron encendidas?",
    pasos: [
      { a: 4, op: "x", b: 5, res: 20 },
      { a: 20, op: "-", b: 6, res: 14 }
    ]
  },
  {
    id: "as_02",
    continente: "Asia",
    color: "#27AE60",
    historia: "Un panda comió 3 sacos de bambú. Cada saco tenía 8 ramas. Si luego encontró 10 ramas más.",
    pregunta: "¿Cuántas ramas de bambú tiene en total ahora?",
    pasos: [
      { a: 3, op: "x", b: 8, res: 24 },
      { a: 24, op: "+", b: 10, res: 34 }
    ]
  },
  {
    id: "as_03",
    continente: "Asia",
    color: "#F1C40F",
    historia: "En el templo había 5 salas. En cada sala había 4 monjes. Si llegaron 8 monjes más de visita.",
    pregunta: "¿Cuántos monjes hay ahora en total en el templo?",
    pasos: [
      { a: 5, op: "x", b: 4, res: 20 },
      { a: 20, op: "+", b: 8, res: 28 }
    ]
  },
  {
    id: "as_04",
    continente: "Asia",
    color: "#3498DB",
    historia: "Una fábrica hizo 6 robots. Cada robot fabricó 5 tuercas. Si se perdieron 12 tuercas en el taller.",
    pregunta: "¿Cuántas tuercas quedan en la fábrica?",
    pasos: [
      { a: 6, op: "x", b: 5, res: 30 },
      { a: 30, op: "-", b: 12, res: 18 }
    ]
  },
  {
    id: "as_05",
    continente: "Asia",
    color: "#E67E22",
    historia: "Un mercado tenía 10 puestos de arroz. Cada puesto vendió 4 sacos. Si el camión trajo 15 sacos nuevos.",
    pregunta: "¿Cuántos sacos hay en total para vender?",
    pasos: [
      { a: 10, op: "x", b: 4, res: 40 },
      { a: 40, op: "+", b: 15, res: 55 }
    ]
  },
  {
    id: "as_06",
    continente: "Asia",
    color: "#FFB6C1",
    historia: "Había 4 árboles de cerezo. De cada uno cayeron 10 pétalos. El viento sopló y se llevó 15 pétalos.",
    pregunta: "¿Cuántos pétalos quedaron en el suelo?",
    pasos: [
      { a: 4, op: "x", b: 10, res: 40 },
      { a: 40, op: "-", b: 15, res: 25 }
    ]
  },
  {
    id: "as_07",
    continente: "Asia",
    color: "#8E44AD",
    historia: "En una clase de yoga había 3 filas de 6 personas. Si 5 personas terminaron y se fueron.",
    pregunta: "¿Cuántas personas quedan en la clase de yoga?",
    pasos: [
      { a: 3, op: "x", b: 6, res: 18 },
      { a: 18, op: "-", b: 5, res: 13 }
    ]
  },
  {
    id: "as_08",
    continente: "Asia",
    color: "#BDC3C7",
    historia: "Hiciste 5 grullas de papel. Tu amigo hizo el triple. Si regalaste 6 de las grullas que tenían.",
    pregunta: "¿Cuántas grullas de papel quedan en total?",
    pasos: [
      { a: 5, op: "x", b: 3, res: 15 },
      { a: 15, op: "-", b: 6, res: 9 }
    ]
  },
  {
    id: "as_09",
    continente: "Asia",
    color: "#F39C12",
    historia: "Viste 2 caravanas de 10 camellos cada una. En un oasis, 7 camellos se quedaron descansando.",
    pregunta: "¿Cuántos camellos siguieron el viaje por el desierto?",
    pasos: [
      { a: 2, op: "x", b: 10, res: 20 },
      { a: 20, op: "-", b: 7, res: 13 }
    ]
  },
  {
    id: "as_10",
    continente: "Asia",
    color: "#C0392B",
    historia: "En un dojo había 4 maestros. Cada uno entrenaba a 6 alumnos. Si 10 alumnos ya se graduaron.",
    pregunta: "¿Cuántos alumnos quedan entrenando en el dojo?",
    pasos: [
      { a: 4, op: "x", b: 6, res: 24 },
      { a: 24, op: "-", b: 10, res: 14 }
    ]
  },

  // --- ÁFRICA ---
  {
    id: "af_01",
    continente: "África",
    color: "#D35400",
    historia: "Había 4 manadas de 5 leones cada una. Si 6 leones se fueron a cazar al río.",
    pregunta: "¿Cuántos leones quedaron en la sabana?",
    pasos: [
      { a: 4, op: "x", b: 5, res: 20 },
      { a: 20, op: "-", b: 6, res: 14 }
    ]
  },
  {
    id: "af_02",
    continente: "África",
    color: "#F1C40F",
    historia: "Viste 3 pirámides con 10 pasadizos cada una. Si los arqueólogos cerraron 12 pasadizos.",
    pregunta: "¿Cuántos pasadizos quedan abiertos para visitar?",
    pasos: [
      { a: 3, op: "x", b: 10, res: 30 },
      { a: 30, op: "-", b: 12, res: 18 }
    ]
  },
  {
    id: "af_03",
    continente: "África",
    color: "#27AE60",
    historia: "En la selva había 6 familias de 4 gorilas. Si nacieron 5 gorilas bebés nuevos.",
    pregunta: "¿Cuántos gorilas hay ahora en total en la selva?",
    pasos: [
      { a: 6, op: "x", b: 4, res: 24 },
      { a: 24, op: "+", b: 5, res: 29 }
    ]
  },
  {
    id: "af_04",
    continente: "África",
    color: "#3498DB",
    historia: "En el río Nilo había 8 hipopótamos. Cada uno tuvo 2 crías. Si 5 crías se fueron a nadar.",
    pregunta: "¿Cuántas crías de hipopótamo quedan con sus padres?",
    pasos: [
      { a: 8, op: "x", b: 2, res: 16 },
      { a: 16, op: "-", b: 5, res: 11 }
    ]
  },
  {
    id: "af_05",
    continente: "África",
    color: "#E67E22",
    historia: "Viste 5 grupos de 6 cebras. Si 12 cebras se asustaron y corrieron rápido.",
    pregunta: "¿Cuántas cebras se quedaron tranquilas en el grupo?",
    pasos: [
      { a: 5, op: "x", b: 6, res: 30 },
      { a: 30, op: "-", b: 12, res: 18 }
    ]
  },
  {
    id: "af_06",
    continente: "África",
    color: "#BDC3C7",
    historia: "Había 3 elefantes grandes. Cada uno llevaba 8 litros de agua. Si tiraron 10 litros jugando.",
    pregunta: "¿Cuántos litros de agua les quedan en total?",
    pasos: [
      { a: 3, op: "x", b: 8, res: 24 },
      { a: 24, op: "-", b: 10, res: 14 }
    ]
  },
  {
    id: "af_07",
    continente: "África",
    color: "#16A085",
    historia: "En el mercado había 10 máscaras. El artesano duplicó la cantidad hoy. Si vendió 8 máscaras.",
    pregunta: "¿Cuántas máscaras le quedan por vender al artesano?",
    pasos: [
      { a: 10, op: "x", b: 2, res: 20 },
      { a: 20, op: "-", b: 8, res: 12 }
    ]
  },
  {
    id: "af_08",
    continente: "África",
    color: "#F39C12",
    historia: "Viste 4 jirafas comiendo. Cada una comió 10 hojas de acacia. Si luego encontraron 15 hojas más.",
    pregunta: "¿Cuántas hojas comieron en total las jirafas?",
    pasos: [
      { a: 4, op: "x", b: 10, res: 40 },
      { a: 40, op: "+", b: 15, res: 55 }
    ]
  },
  {
    id: "af_09",
    continente: "África",
    color: "#2C3E50",
    historia: "En el desierto había 5 pozos. De cada pozo sacaron 6 baldes de agua. Si usaron 20 baldes.",
    pregunta: "¿Cuántos baldes de agua sobraron en el campamento?",
    pasos: [
      { a: 5, op: "x", b: 6, res: 30 },
      { a: 30, op: "-", b: 20, res: 10 }
    ]
  },
  {
    id: "af_10",
    continente: "África",
    color: "#9B59B6",
    historia: "Había 2 baobabs grandes. En cada uno vivían 12 pájaros. Si 10 pájaros volaron al sur.",
    pregunta: "¿Cuántos pájaros quedaron en los árboles baobab?",
    pasos: [
      { a: 2, op: "x", b: 12, res: 24 },
      { a: 24, op: "-", b: 10, res: 14 }
    ]
  },

  // --- OCEANÍA ---
  {
    id: "oc_01",
    continente: "Oceanía",
    color: "#F39C12",
    historia: "Viste 6 canguros saltando. Cada uno llevaba 2 crías en su bolsa. Si 4 crías saltaron fuera.",
    pregunta: "¿Cuántas crías quedan dentro de las bolsas?",
    pasos: [
      { a: 6, op: "x", b: 2, res: 12 },
      { a: 12, op: "-", b: 4, res: 8 }
    ]
  },
  {
    id: "oc_02",
    continente: "Oceanía",
    color: "#3498DB",
    historia: "En el arrecife había 5 corales. En cada uno vivían 10 peces. Si 15 peces se fueron a otro arrecife.",
    pregunta: "¿Cuántos peces se quedaron en sus corales?",
    pasos: [
      { a: 5, op: "x", b: 10, res: 50 },
      { a: 50, op: "-", b: 15, res: 35 }
    ]
  },
  {
    id: "oc_03",
    continente: "Oceanía",
    color: "#2ECC71",
    historia: "Había 4 koalas comiendo. Cada uno comió 8 hojas. Si un koala encontró 5 hojas extra.",
    pregunta: "¿Cuántas hojas de eucalipto comieron entre todos?",
    pasos: [
      { a: 4, op: "x", b: 8, res: 32 },
      { a: 32, op: "+", b: 5, res: 37 }
    ]
  },
  {
    id: "oc_04",
    continente: "Oceanía",
    color: "#1ABC9C",
    historia: "Viste 3 grupos de 6 surfistas en el mar. Si 10 surfistas ya salieron a la arena.",
    pregunta: "¿Cuántos surfistas quedan todavía en el mar?",
    pasos: [
      { a: 3, op: "x", b: 6, res: 18 },
      { a: 18, op: "-", b: 10, res: 8 }
    ]
  },
  {
    id: "oc_05",
    continente: "Oceanía",
    color: "#BDC3C7",
    historia: "En el puerto había 5 barcos. Cada barco tenía 6 velas. Si bajaron 12 velas para guardarlas.",
    pregunta: "¿Cuántas velas quedaron puestas en los barcos?",
    pasos: [
      { a: 5, op: "x", b: 6, res: 30 },
      { a: 30, op: "-", b: 12, res: 18 }
    ]
  },
  {
    id: "oc_06",
    continente: "Oceanía",
    color: "#E67E22",
    historia: "Un granjero tenía 4 cercados. En cada uno puso 10 ovejas. Si vendió 15 ovejas hoy.",
    pregunta: "¿Cuántas ovejas le quedan en la granja ahora?",
    pasos: [
      { a: 4, op: "x", b: 10, res: 40 },
      { a: 40, op: "-", b: 15, res: 25 }
    ]
  },
  {
    id: "oc_07",
    continente: "Oceanía",
    color: "#2980B9",
    historia: "Viste 2 equipos de 8 bailarines Maoríes. Si se unieron 10 bailarines más al final de la danza.",
    pregunta: "¿Cuántos bailarines hay ahora en el escenario?",
    pasos: [
      { a: 2, op: "x", b: 8, res: 16 },
      { a: 16, op: "+", b: 10, res: 26 }
    ]
  },
  {
    id: "oc_08",
    continente: "Oceanía",
    color: "#E74C3C",
    historia: "Un artesano hizo 5 bumeranes. Cada uno costaba 10 monedas. Si te hizo un descuento de 12 monedas.",
    pregunta: "¿Cuánto pagaste finalmente por todos los bumeranes?",
    pasos: [
      { a: 5, op: "x", b: 10, res: 50 },
      { a: 50, op: "-", b: 12, res: 38 }
    ]
  },
  {
    id: "oc_09",
    continente: "Oceanía",
    color: "#34495E",
    historia: "Había 3 botes de buceo. En cada bote había 10 tanques. Si usaron 18 tanques en total.",
    pregunta: "¿Cuántos tanques llenos quedan en los botes?",
    pasos: [
      { a: 3, op: "x", b: 10, res: 30 },
      { a: 30, op: "-", b: 18, res: 12 }
    ]
  },
  {
    id: "oc_10",
    continente: "Oceanía",
    color: "#2D5A27",
    historia: "Viste 4 árboles de papaya. De cada uno recogiste 6 frutas. Si regalaste 9 papayas.",
    pregunta: "¿Cuántas papayas te quedaron a ti después del regalo?",
    pasos: [
      { a: 4, op: "x", b: 6, res: 24 },
      { a: 24, op: "-", b: 9, res: 15 }
    ]
  },

  // --- ANTÁRTIDA ---
  {
    id: "an_01",
    continente: "Antártida",
    color: "#EBF5FB",
    historia: "Viste 5 bloques de hielo. En cada bloque había 4 focas. Si 6 focas saltaron al agua.",
    pregunta: "¿Cuántas focas quedaron descansando sobre el hielo?",
    pasos: [
      { a: 5, op: "x", b: 4, res: 20 },
      { a: 20, op: "-", b: 6, res: 14 }
    ]
  },
  {
    id: "an_02",
    continente: "Antártida",
    color: "#D6EAF8",
    historia: "En la base había 3 mesas. En cada mesa había 6 investigadores. Si llegaron 10 personas más.",
    pregunta: "¿Cuántas personas hay ahora en total en la base?",
    pasos: [
      { a: 3, op: "x", b: 6, res: 18 },
      { a: 18, op: "+", b: 10, res: 28 }
    ]
  },
  {
    id: "an_03",
    continente: "Antártida",
    color: "#AED6F1",
    historia: "Había 4 grupos de 10 pingüinos. Si 15 pingüinos se fueron a buscar comida al mar.",
    pregunta: "¿Cuántos pingüinos se quedaron en la nieve?",
    pasos: [
      { a: 4, op: "x", b: 10, res: 40 },
      { a: 40, op: "-", b: 15, res: 25 }
    ]
  },
  {
    id: "an_04",
    continente: "Antártida",
    color: "#85C1E9",
    historia: "Viste 2 aviones de carga. Cada uno trajo 12 cajas. Si los científicos abrieron 10 cajas.",
    pregunta: "¿Cuántas cajas quedan todavía cerradas por abrir?",
    pasos: [
      { a: 2, op: "x", b: 12, res: 24 },
      { a: 24, op: "-", b: 10, res: 14 }
    ]
  },
  {
    id: "an_05",
    continente: "Antártida",
    color: "#5DADE2",
    historia: "En el mar había 6 orcas. Cada una cazó 5 peces. Si luego compartieron 10 peces con las crías.",
    pregunta: "¿Cuántos peces les quedaron para ellas?",
    pasos: [
      { a: 6, op: "x", b: 5, res: 30 },
      { a: 30, op: "-", b: 10, res: 20 }
    ]
  },
  {
    id: "an_06",
    continente: "Antártida",
    color: "#3498DB",
    historia: "Había 4 estantes en la base. En cada estante había 10 latas de sopa. Si usaron 15 latas hoy.",
    pregunta: "¿Cuántas latas de sopa quedan en total?",
    pasos: [
      { a: 4, op: "x", b: 10, res: 40 },
      { a: 40, op: "-", b: 15, res: 25 }
    ]
  },
  {
    id: "an_07",
    continente: "Antártida",
    color: "#2874A6",
    historia: "Viste 3 grupos de 6 motos de nieve. Si 5 motos se rompieron por el frío extremo.",
    pregunta: "¿Cuántas motos quedan listas para la expedición?",
    pasos: [
      { a: 3, op: "x", b: 6, res: 18 },
      { a: 18, op: "-", b: 5, res: 13 }
    ]
  },
  {
    id: "an_08",
    continente: "Antártida",
    color: "#1B4F72",
    historia: "En un nido había 4 pingüinos. Cada uno puso 2 huevos. Si llegaron 5 huevos más de otro nido.",
    pregunta: "¿Cuántos huevos hay en total ahora en the nido?",
    pasos: [
      { a: 4, op: "x", b: 2, res: 8 },
      { a: 8, op: "+", b: 5, res: 13 }
    ]
  },
  {
    id: "an_09",
    continente: "Antártida",
    color: "#EAF2F8",
    historia: "Había 10 trineos. Cada trineo llevaba 4 perros huskies. Si 12 perros se fueron a descansar.",
    pregunta: "¿Cuántos perros quedan trabajando en los trineos?",
    pasos: [
      { a: 10, op: "x", b: 4, res: 40 },
      { a: 40, op: "-", b: 12, res: 28 }
    ]
  },
  {
    id: "an_10",
    continente: "Antártida",
    color: "#A9CCE3",
    historia: "Viste 5 banderas. Cada bandera tenía 6 estrellas bordadas. Si se borraron 8 estrellas.",
    pregunta: "¿Cuántas estrellas quedan todavía visibles en las banderas?",
    pasos: [
      { a: 5, op: "x", b: 6, res: 30 },
      { a: 30, op: "-", b: 8, res: 22 }
    ]
  }
];