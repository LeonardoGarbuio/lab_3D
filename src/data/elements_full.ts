// src/data/elements_full.ts
// Elementos faltantes (39-118) para completar a tabela periódica
import type { Element } from './elements'

type Cat = Element['category']
type Ph = Element['phase']
const S: Ph = 'solid', G: Ph = 'gas', L: Ph = 'liquid'
const TM: Cat = 'transition-metal', PT: Cat = 'post-transition', ML: Cat = 'metalloid'
const HG: Cat = 'halogen', NG: Cat = 'noble-gas'
const LN: Cat = 'lanthanide', AC: Cat = 'actinide'
const AE: Cat = 'alkaline-earth'

// [Z, sym, name, namePt, mass, cat, phase, EN, density, mp, bp, color, group, period]
type R = [number,string,string,string,number,Cat,Ph,number|null,number|null,number|null,number|null,string,number,number]

function e(d:R): Element {
  return { atomicNumber:d[0], symbol:d[1], name:d[2], namePt:d[3], atomicMass:d[4], category:d[5], phase:d[6], electronegativity:d[7], density:d[8], meltingPoint:d[9], boilingPoint:d[10], color:d[11], group:d[12], period:d[13] }
}

export const MISSING_ELEMENTS: Element[] = [
  // Período 5 completo (39-54)
  e([39,'Y','Yttrium','Ítrio',88.91,TM,S,1.22,4.47,1526,3336,'#94ffff',3,5]),
  e([40,'Zr','Zirconium','Zircônio',91.22,TM,S,1.33,6.51,1855,4409,'#94e0e0',4,5]),
  e([41,'Nb','Niobium','Nióbio',92.91,TM,S,1.6,8.57,2477,4744,'#73c2c9',5,5]),
  e([42,'Mo','Molybdenum','Molibdênio',95.95,TM,S,2.16,10.28,2623,4639,'#54b5b5',6,5]),
  e([43,'Tc','Technetium','Tecnécio',98,TM,S,1.9,11.5,2157,4265,'#3b9e9e',7,5]),
  e([44,'Ru','Ruthenium','Rutênio',101.07,TM,S,2.2,12.37,2334,4150,'#248f8f',8,5]),
  e([45,'Rh','Rhodium','Ródio',102.91,TM,S,2.28,12.41,1964,3695,'#0a7d8c',9,5]),
  e([46,'Pd','Palladium','Paládio',106.42,TM,S,2.2,12.02,1555,2963,'#006985',10,5]),
  e([48,'Cd','Cadmium','Cádmio',112.41,TM,S,1.69,8.65,321,767,'#ffd98f',12,5]),
  e([49,'In','Indium','Índio',114.82,PT,S,1.78,7.31,157,2072,'#a67573',13,5]),
  e([51,'Sb','Antimony','Antimônio',121.76,ML,S,2.05,6.70,631,1587,'#9e63b5',15,5]),
  e([52,'Te','Tellurium','Telúrio',127.60,ML,S,2.1,6.24,450,988,'#d47a00',16,5]),
  e([54,'Xe','Xenon','Xenônio',131.29,NG,G,2.6,0.006,-112,-108,'#429eb0',18,5]),

  // Período 6 (57-86)
  // Lantanídeos (57-71)
  e([57,'La','Lanthanum','Lantânio',138.91,LN,S,1.1,6.16,920,3464,'#70d4ff',3,6]),
  e([58,'Ce','Cerium','Cério',140.12,LN,S,1.12,6.77,799,3443,'#ffffc7',3,6]),
  e([59,'Pr','Praseodymium','Praseodímio',140.91,LN,S,1.13,6.77,931,3520,'#d9ffc7',3,6]),
  e([60,'Nd','Neodymium','Neodímio',144.24,LN,S,1.14,7.01,1021,3074,'#c7ffc7',3,6]),
  e([61,'Pm','Promethium','Promécio',145,LN,S,1.13,7.26,1042,3000,'#a3ffc7',3,6]),
  e([62,'Sm','Samarium','Samário',150.36,LN,S,1.17,7.52,1074,1794,'#8fffc7',3,6]),
  e([63,'Eu','Europium','Európio',151.96,LN,S,1.2,5.24,822,1529,'#61ffc7',3,6]),
  e([64,'Gd','Gadolinium','Gadolínio',157.25,LN,S,1.2,7.90,1313,3273,'#45ffc7',3,6]),
  e([65,'Tb','Terbium','Térbio',158.93,LN,S,1.2,8.23,1356,3230,'#30ffc7',3,6]),
  e([66,'Dy','Dysprosium','Disprósio',162.50,LN,S,1.22,8.55,1412,2567,'#1fffc7',3,6]),
  e([67,'Ho','Holmium','Hólmio',164.93,LN,S,1.23,8.80,1474,2700,'#00ff9c',3,6]),
  e([68,'Er','Erbium','Érbio',167.26,LN,S,1.24,9.07,1529,2868,'#00e675',3,6]),
  e([69,'Tm','Thulium','Túlio',168.93,LN,S,1.25,9.32,1545,1950,'#00d452',3,6]),
  e([70,'Yb','Ytterbium','Itérbio',173.05,LN,S,1.1,6.90,819,1196,'#00bf38',3,6]),
  e([71,'Lu','Lutetium','Lutécio',174.97,LN,S,1.27,9.84,1663,3402,'#00ab24',3,6]),

  // Período 6 transição (72-78, 81, 83-86)
  e([72,'Hf','Hafnium','Háfnio',178.49,TM,S,1.3,13.31,2233,4603,'#4dc2ff',4,6]),
  e([73,'Ta','Tantalum','Tântalo',180.95,TM,S,1.5,16.65,3017,5458,'#4da6ff',5,6]),
  e([74,'W','Tungsten','Tungstênio',183.84,TM,S,2.36,19.25,3422,5555,'#2194d6',6,6]),
  e([75,'Re','Rhenium','Rênio',186.21,TM,S,1.9,21.02,3186,5596,'#267dab',7,6]),
  e([76,'Os','Osmium','Ósmio',190.23,TM,S,2.2,22.59,3033,5012,'#266696',8,6]),
  e([77,'Ir','Iridium','Irídio',192.22,TM,S,2.2,22.56,2446,4428,'#175487',9,6]),
  e([78,'Pt','Platinum','Platina',195.08,TM,S,2.28,21.45,1768,3825,'#d0d0e0',10,6]),
  e([81,'Tl','Thallium','Tálio',204.38,PT,S,1.62,11.85,304,1473,'#a6544d',13,6]),
  e([83,'Bi','Bismuth','Bismuto',208.98,PT,S,2.02,9.78,271,1564,'#9e4fb5',15,6]),
  e([84,'Po','Polonium','Polônio',209,ML,S,2.0,9.20,254,962,'#ab5c00',16,6]),
  e([85,'At','Astatine','Astato',210,HG,S,2.2,7.0,302,337,'#754f45',17,6]),
  e([86,'Rn','Radon','Radônio',222,NG,G,null,0.010,-71,-62,'#428296',18,6]),

  // Período 7 (88-118)
  e([88,'Ra','Radium','Rádio',226,AE,S,0.9,5.5,700,1737,'#007d00',2,7]),
  // Actinídeos (89-103)
  e([89,'Ac','Actinium','Actínio',227,AC,S,1.1,10.07,1050,3198,'#70abfa',3,7]),
  e([90,'Th','Thorium','Tório',232.04,AC,S,1.3,11.72,1750,4788,'#00baff',3,7]),
  e([91,'Pa','Protactinium','Protactínio',231.04,AC,S,1.5,15.37,1572,4027,'#00a1ff',3,7]),
  e([93,'Np','Neptunium','Netúnio',237,AC,S,1.36,20.45,644,3902,'#0080ff',3,7]),
  e([94,'Pu','Plutonium','Plutônio',244,AC,S,1.28,19.82,640,3228,'#006bff',3,7]),
  e([95,'Am','Americium','Amerício',243,AC,S,1.3,12.0,1176,2011,'#545cf2',3,7]),
  e([96,'Cm','Curium','Cúrio',247,AC,S,1.3,13.51,1345,3110,'#785ce3',3,7]),
  e([97,'Bk','Berkelium','Berquélio',247,AC,S,1.3,14.78,1050,2627,'#8a4fe3',3,7]),
  e([98,'Cf','Californium','Califórnio',251,AC,S,1.3,15.1,900,1472,'#a136d4',3,7]),
  e([99,'Es','Einsteinium','Einstênio',252,AC,S,1.3,8.84,860,996,'#b31fd4',3,7]),
  e([100,'Fm','Fermium','Férmio',257,AC,S,1.3,null,1527,null,'#b31fba',3,7]),
  e([101,'Md','Mendelevium','Mendelévio',258,AC,S,1.3,null,827,null,'#b30da6',3,7]),
  e([102,'No','Nobelium','Nobélio',259,AC,S,1.3,null,827,null,'#bd0d87',3,7]),
  e([103,'Lr','Lawrencium','Laurêncio',266,AC,S,1.3,null,1627,null,'#c70066',3,7]),

  // Período 7 transição (104-118)
  e([104,'Rf','Rutherfordium','Rutherfórdio',267,TM,S,null,null,null,null,'#cc0059',4,7]),
  e([105,'Db','Dubnium','Dúbnio',268,TM,S,null,null,null,null,'#d1004f',5,7]),
  e([106,'Sg','Seaborgium','Seabórgio',269,TM,S,null,null,null,null,'#d90045',6,7]),
  e([107,'Bh','Bohrium','Bóhrio',270,TM,S,null,null,null,null,'#e00038',7,7]),
  e([108,'Hs','Hassium','Hássio',277,TM,S,null,null,null,null,'#e6002e',8,7]),
  e([109,'Mt','Meitnerium','Meitnério',278,TM,S,null,null,null,null,'#eb0026',9,7]),
  e([110,'Ds','Darmstadtium','Darmstádtio',281,TM,S,null,null,null,null,'#ff0000',10,7]),
  e([111,'Rg','Roentgenium','Roentgênio',282,TM,S,null,null,null,null,'#ff1a00',11,7]),
  e([112,'Cn','Copernicium','Copernício',285,TM,L,null,null,null,null,'#ff3300',12,7]),
  e([113,'Nh','Nihonium','Nihônio',286,PT,S,null,null,null,null,'#ff4d00',13,7]),
  e([114,'Fl','Flerovium','Fleróvio',289,PT,S,null,null,null,null,'#ff6600',14,7]),
  e([115,'Mc','Moscovium','Moscóvio',290,PT,S,null,null,null,null,'#ff8000',15,7]),
  e([116,'Lv','Livermorium','Livermório',293,PT,S,null,null,null,null,'#ff9900',16,7]),
  e([117,'Ts','Tennessine','Tennesso',294,HG,S,null,null,null,null,'#ffb300',17,7]),
  e([118,'Og','Oganesson','Oganessônio',294,NG,S,null,null,null,null,'#ffcc00',18,7]),
]
