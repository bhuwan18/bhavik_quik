import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Each entry: question text (exact match) → { explanation, readMoreUrl }
const EXPLANATIONS: Record<string, { explanation: string; readMoreUrl: string }> = {
  // ── PHYSICS INTRO ────────────────────────────────────────────────────────
  "What is the unit of force?": {
    explanation: "The Newton (N) is the SI unit of force, named after Sir Isaac Newton. One Newton equals the force required to accelerate a 1 kg mass at 1 m/s².",
    readMoreUrl: "https://en.wikipedia.org/wiki/Newton_(unit)",
  },
  "What does E=mc² mean?": {
    explanation: "Einstein's famous equation shows that mass and energy are interchangeable — a tiny amount of mass can release enormous energy when multiplied by c² (≈9×10¹⁶ m²/s²). It is the basis of nuclear energy.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Mass%E2%80%93energy_equivalence",
  },
  "What is gravity?": {
    explanation: "Gravity is a fundamental force that attracts any two objects with mass toward each other. On Earth it gives objects weight, keeps us on the ground, and holds the Moon in orbit.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Gravity",
  },
  "What is the unit of electrical current?": {
    explanation: "The Ampere (A) is the SI base unit of electric current, defined as the flow of one Coulomb of charge per second through a conductor. Named after physicist André-Marie Ampère.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Ampere",
  },
  "What travels at the speed of light?": {
    explanation: "All electromagnetic waves — visible light, radio waves, X-rays, gamma rays, and more — travel at approximately 299,792,458 m/s in a vacuum. This is the universal speed limit.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Speed_of_light",
  },

  // ── CLASSICAL MECHANICS ───────────────────────────────────────────────────
  "What is Newton's First Law?": {
    explanation: "Newton's First Law (the Law of Inertia) states that an object remains at rest or moves in a straight line at constant speed unless an external net force acts on it.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Newton%27s_laws_of_motion",
  },
  "What is momentum?": {
    explanation: "Momentum (p = mv) is a vector quantity equal to mass × velocity. It is conserved in closed systems — the principle behind rocket propulsion, collisions, and recoil.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Momentum",
  },
  "What is the unit of energy?": {
    explanation: "The Joule (J) is the SI unit of energy. One Joule equals the work done when a 1 Newton force moves an object 1 metre in the direction of the force.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Joule",
  },
  "What does friction do?": {
    explanation: "Friction is a force that opposes relative motion between surfaces in contact. It converts kinetic energy into heat and is essential for walking, driving, and braking.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Friction",
  },
  "What is the formula for kinetic energy?": {
    explanation: "Kinetic energy KE = ½mv² is the energy an object has due to its motion. Doubling the speed quadruples kinetic energy — which is why high-speed collisions are so destructive.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Kinetic_energy",
  },

  // ── ELECTROMAGNETISM ──────────────────────────────────────────────────────
  "What is Ohm's Law?": {
    explanation: "Ohm's Law (V = IR) states that voltage equals current × resistance. It describes how electrical current flows through conductors and is fundamental to circuit design.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Ohm%27s_law",
  },
  "What type of wave is light?": {
    explanation: "Light is an electromagnetic wave — it consists of oscillating electric and magnetic fields perpendicular to each other and to the direction of travel. It requires no medium to propagate.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Electromagnetic_radiation",
  },
  "What particle carries electric charge in a wire?": {
    explanation: "In metallic conductors, free electrons carry the electric charge. They drift slowly (~1 mm/s) but the electric field signal propagates near the speed of light.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Electric_current",
  },
  "What is magnetic flux?": {
    explanation: "Magnetic flux (Φ = B·A·cosθ) measures the total magnetic field passing through a surface. Faraday's Law states that a changing magnetic flux induces an electromotive force (voltage).",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magnetic_flux",
  },
  "What is the frequency unit?": {
    explanation: "Hertz (Hz) is the SI unit of frequency, defined as one cycle per second. Named after Heinrich Hertz, who first experimentally confirmed the existence of electromagnetic waves.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Hertz",
  },

  // ── QUANTUM PHYSICS ───────────────────────────────────────────────────────
  "What is Schrödinger's cat thought experiment about?": {
    explanation: "Schrödinger's cat illustrates quantum superposition: a cat in a sealed box is simultaneously alive and dead until observed. It was devised to highlight the strangeness of quantum measurement.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Schr%C3%B6dinger%27s_cat",
  },
  "What principle says you can't know position and momentum exactly?": {
    explanation: "Heisenberg's Uncertainty Principle states that the more precisely you know a particle's position, the less precisely you can know its momentum — this is a fundamental limit of nature, not a measurement imperfection.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Uncertainty_principle",
  },
  "What is a photon?": {
    explanation: "A photon is the elementary particle of light and all electromagnetic radiation. It has zero rest mass, always travels at c, and carries energy E = hf (h = Planck's constant, f = frequency).",
    readMoreUrl: "https://en.wikipedia.org/wiki/Photon",
  },
  "What does the wave function describe?": {
    explanation: "The wave function (ψ) encodes all information about a quantum system. Its squared magnitude |ψ|² gives the probability of finding the particle at a given location when measured.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Wave_function",
  },
  "What is quantum tunnelling?": {
    explanation: "Quantum tunnelling allows particles to pass through energy barriers that classical physics forbids. It powers nuclear fusion in stars, enables radioactive decay, and is the basis of tunnel diodes and scanning tunnelling microscopes.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Quantum_tunnelling",
  },

  // ── RELATIVITY & COSMOLOGY ────────────────────────────────────────────────
  "What is time dilation?": {
    explanation: "Time dilation (from special and general relativity) means time passes more slowly for objects moving at high speeds or in strong gravitational fields. GPS satellites must correct for this effect to stay accurate.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Time_dilation",
  },
  "What is the Schwarzschild radius?": {
    explanation: "The Schwarzschild radius is the critical radius at which escape velocity equals the speed of light, forming a black hole's event horizon. For Earth, it would be about 9 mm.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Schwarzschild_radius",
  },
  "What does general relativity describe?": {
    explanation: "Einstein's General Theory of Relativity (1915) describes gravity not as a force but as the curvature of spacetime caused by mass and energy. It accurately predicts black holes, gravitational waves, and planetary orbits.",
    readMoreUrl: "https://en.wikipedia.org/wiki/General_relativity",
  },
  "What is Hawking radiation?": {
    explanation: "Proposed by Stephen Hawking in 1974, Hawking radiation is thermal radiation that black holes emit due to quantum effects near the event horizon, causing them to slowly lose mass and eventually evaporate.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Hawking_radiation",
  },
  "What is the cosmological constant?": {
    explanation: "Einstein's cosmological constant (Λ) represents the energy density of empty space. It is now associated with dark energy — the mysterious force driving the accelerating expansion of the universe.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Cosmological_constant",
  },

  // ── THERMODYNAMICS ────────────────────────────────────────────────────────
  "What is the First Law of Thermodynamics?": {
    explanation: "The First Law is the law of conservation of energy: the total energy of an isolated system is constant. Energy can change forms (heat ↔ work) but can never be created or destroyed.",
    readMoreUrl: "https://en.wikipedia.org/wiki/First_law_of_thermodynamics",
  },
  "What is entropy a measure of?": {
    explanation: "Entropy (S) measures the number of possible microscopic configurations of a system — essentially its disorder. A shuffled deck has higher entropy than an ordered one; the universe's entropy always increases over time.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Entropy",
  },
  "What is absolute zero in Celsius?": {
    explanation: "Absolute zero (0 Kelvin = −273.15°C) is the lowest theoretically possible temperature, where particles have minimal thermal motion. It is physically impossible to reach but can be approached within nanokelvins.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Absolute_zero",
  },
  "What does the Second Law of Thermodynamics state?": {
    explanation: "The Second Law states that in any spontaneous process, total entropy of an isolated system always increases. This is why heat flows from hot to cold (never the reverse) and why perpetual-motion machines are impossible.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Second_law_of_thermodynamics",
  },
  "What is the unit of temperature in the SI system?": {
    explanation: "The Kelvin (K) is the SI base unit of temperature, starting at absolute zero. Unlike Celsius or Fahrenheit, it has no negative values and is used in all scientific and engineering calculations.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Kelvin",
  },
  "What process transfers heat without mass movement through direct contact?": {
    explanation: "Conduction is heat transfer through direct contact — vibrations pass from atom to atom without any bulk movement of material. Metals are excellent conductors due to their free electrons.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Thermal_conduction",
  },
  "What is the efficiency of a Carnot engine based on?": {
    explanation: "The Carnot engine achieves the maximum theoretical efficiency: η = 1 − (T_cold / T_hot), depending only on the absolute temperatures of the hot and cold reservoirs. No real engine can exceed this.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Carnot_heat_engine",
  },
  "What state of matter has the highest entropy?": {
    explanation: "Plasma has the highest entropy of the four states of matter — its particles are fully ionized, highly energetic, and moving randomly at extreme temperatures (e.g., the Sun's interior).",
    readMoreUrl: "https://en.wikipedia.org/wiki/Plasma_(physics)",
  },
  "What happens to gas pressure when volume is halved (constant temperature)?": {
    explanation: "Boyle's Law (PV = constant at constant temperature) states that pressure and volume are inversely proportional. Halving the volume doubles the pressure because the same gas particles collide more frequently with the smaller walls.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Boyle%27s_law",
  },
  "What is the zeroth law of thermodynamics about?": {
    explanation: "The Zeroth Law states that if system A is in thermal equilibrium with C, and B is also in equilibrium with C, then A and B are in equilibrium with each other. This defines temperature as a consistent measurable quantity.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Zeroth_law_of_thermodynamics",
  },

  // ── FOOTBALL BASICS ───────────────────────────────────────────────────────
  "How many players are on a football team?": {
    explanation: "A standard association football team fields 11 players: one goalkeeper and 10 outfield players. Both teams together put 22 players on the pitch at kick-off.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Association_football",
  },
  "How long is a standard football match?": {
    explanation: "A standard match consists of two 45-minute halves with a 15-minute half-time interval, totalling 90 minutes of regulation play. Injury time is added at the referee's discretion.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Association_football",
  },
  "Which country invented football?": {
    explanation: "Modern association football was codified in England in 1863 when the Football Association was established. Earlier folk football games existed across Europe, but England standardised the rules.",
    readMoreUrl: "https://en.wikipedia.org/wiki/History_of_association_football",
  },
  "What shape is a football?": {
    explanation: "A regulation football is spherical — a truncated icosahedron design (32 panels) designed to roll and bounce consistently. Its circumference must be 68–70 cm per FIFA rules.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Football_(association_football)",
  },
  "Where is the FIFA World Cup trophy kept between tournaments?": {
    explanation: "The original FIFA World Cup trophy is kept at FIFA's headquarters in Zurich, Switzerland. Winning nations receive a gold-plated replica to keep permanently.",
    readMoreUrl: "https://en.wikipedia.org/wiki/FIFA_World_Cup_Trophy",
  },

  // ── WORLD CUP HISTORY ─────────────────────────────────────────────────────
  "Which country has won the most FIFA World Cups?": {
    explanation: "Brazil has won the FIFA World Cup a record 5 times (1958, 1962, 1970, 1994, 2002), making them the most successful nation in the tournament's history.",
    readMoreUrl: "https://en.wikipedia.org/wiki/FIFA_World_Cup",
  },
  "In which year was the first World Cup held?": {
    explanation: "The inaugural FIFA World Cup was held in Uruguay in 1930. Uruguay won the tournament as hosts, beating Argentina 4–2 in the final. 13 nations participated.",
    readMoreUrl: "https://en.wikipedia.org/wiki/1930_FIFA_World_Cup",
  },
  "Who scored the most goals in a single World Cup?": {
    explanation: "Just Fontaine of France scored 13 goals at the 1958 World Cup in Sweden — a record that still stands today. France finished third in that tournament.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Just_Fontaine",
  },
  "Which country hosted the 2022 World Cup?": {
    explanation: "Qatar became the first Middle Eastern country to host the FIFA World Cup in November–December 2022. Argentina won the tournament, beating France on penalties in the final.",
    readMoreUrl: "https://en.wikipedia.org/wiki/2022_FIFA_World_Cup",
  },
  "The 'Hand of God' goal was scored by whom?": {
    explanation: "Diego Maradona punched the ball into the net with his left hand in the 1986 World Cup quarter-final against England. He later described it as 'the hand of God', scored alongside his legendary solo dribble in the same game.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Hand_of_God_(goal)",
  },

  // ── PREMIER LEAGUE CHALLENGE ──────────────────────────────────────────────
  "Which club has won the most Premier League titles?": {
    explanation: "Manchester United have won 13 Premier League titles since the competition's formation in 1992, making them the most successful club in the Premier League era.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Premier_League",
  },
  "Who is the all-time top scorer in the Premier League?": {
    explanation: "Alan Shearer scored 260 Premier League goals for Blackburn Rovers (112) and Newcastle United (148), a record that has stood since his retirement in 2006.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Alan_Shearer",
  },
  "In which year was the Premier League formed?": {
    explanation: "The Premier League was founded in 1992 when the top-flight clubs broke away from the Football League to negotiate their own television deals. The first season kicked off in August 1992.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Premier_League",
  },
  "Which team was relegated in the first Premier League season (1992/93)?": {
    explanation: "Swindon Town was promoted to the Premier League in 1993 after winning the Division One play-offs and was immediately relegated after finishing bottom of the 1993/94 season.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Swindon_Town_F.C.",
  },
  "Who scored the fastest Premier League hat-trick?": {
    explanation: "Robbie Fowler scored the fastest hat-trick in Premier League history, netting 3 goals in just 4 minutes 33 seconds for Liverpool against Arsenal on 28 August 1994.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Robbie_Fowler",
  },

  // ── CHAMPIONS LEAGUE MASTERS ──────────────────────────────────────────────
  "Which player has won the most Champions League titles?": {
    explanation: "Marcelo won the Champions League 5 times with Real Madrid (2014, 2016, 2017, 2018, 2022), the most by any outfield player in the competition's history.",
    readMoreUrl: "https://en.wikipedia.org/wiki/UEFA_Champions_League",
  },
  "What was the Champions League called before 1992?": {
    explanation: "The UEFA Champions League was known as the European Cup from its first edition in 1955–56. It was rebranded in 1992 to include a group stage and allow multiple clubs per country.",
    readMoreUrl: "https://en.wikipedia.org/wiki/UEFA_Champions_League",
  },
  "Who scored the winning goal in the 1999 Champions League final?": {
    explanation: "Ole Gunnar Solskjaer scored Manchester United's injury-time winner against Bayern Munich in the 1999 Champions League final, completing a dramatic comeback from 1–0 down to win 2–1.",
    readMoreUrl: "https://en.wikipedia.org/wiki/1999_UEFA_Champions_League_final",
  },
  "Which country has the most Champions League winning clubs?": {
    explanation: "Spain has the most Champions League winning clubs, led by Real Madrid (14 titles) and Barcelona (5 titles). Spanish clubs have dominated the competition in recent decades.",
    readMoreUrl: "https://en.wikipedia.org/wiki/UEFA_Champions_League",
  },
  "How many times has Liverpool won the Champions League?": {
    explanation: "Liverpool have won the European Cup/Champions League 6 times: 1977, 1978, 1981, 1984 (European Cup) and 2005, 2019 (Champions League era).",
    readMoreUrl: "https://en.wikipedia.org/wiki/Liverpool_F.C._in_European_football",
  },

  // ── FOOTBALL LEGENDS ──────────────────────────────────────────────────────
  "How many Ballon d'Or awards has Lionel Messi won (as of 2024)?": {
    explanation: "Lionel Messi has won 8 Ballon d'Or awards (2009, 2010, 2011, 2012, 2015, 2019, 2021, 2023), the most of any player in history, with his 8th coming after Argentina's 2022 World Cup win.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Ballon_d%27Or",
  },
  "What year did Pele win his third World Cup?": {
    explanation: "Pelé won his third and final World Cup in 1970 in Mexico with Brazil, widely regarded as one of the greatest football teams ever assembled. His two previous titles came in 1958 and 1962.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Pel%C3%A9",
  },
  "Which club did Johan Cruyff famously refuse to join due to a sponsor conflict?": {
    explanation: "Johan Cruyff refused to join Real Madrid because their kit sponsor Admirals had ties to a military regime he opposed on principle. He joined Barcelona instead and became a club legend.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Johan_Cruyff",
  },
  "What is Zinedine Zidane's nickname?": {
    explanation: "Zinedine Zidane is universally known as 'Zizou', derived from his first name. He is widely regarded as one of the greatest midfielders of all time, winning the World Cup (1998) and Champions League (×3 as manager).",
    readMoreUrl: "https://en.wikipedia.org/wiki/Zinedine_Zidane",
  },
  "Which team did Diego Maradona play for when banned from football in 1991?": {
    explanation: "Maradona was banned for 15 months in 1991 after testing positive for cocaine while playing for SSC Napoli in Italy. He had led Napoli to two Serie A titles in 1987 and 1990.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Diego_Maradona",
  },

  // ── FOOTBALL TRANSFERS & RECORDS ──────────────────────────────────────────
  "Who was the most expensive football transfer of all time (as of 2024)?": {
    explanation: "Neymar's transfer from Barcelona to Paris Saint-Germain in August 2017 for €222 million remains the most expensive transfer in football history, more than double any previous record at the time.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Neymar",
  },
  "Which club sold Neymar to PSG for €222m?": {
    explanation: "Barcelona sold Neymar to Paris Saint-Germain in 2017 for a world-record €222 million after PSG triggered his release clause. Neymar had spent 4 years at Barcelona winning the treble in 2015.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Neymar",
  },
  "Who won the Ballon d'Or in 2023?": {
    explanation: "Lionel Messi won his 8th Ballon d'Or in October 2023, widely recognised for his inspirational role in Argentina's 2022 FIFA World Cup triumph in Qatar.",
    readMoreUrl: "https://en.wikipedia.org/wiki/2023_Ballon_d%27Or",
  },
  "Which player holds the record for most international goals (as of 2024)?": {
    explanation: "Cristiano Ronaldo holds the record for most international goals, surpassing 100 goals for Portugal and continuing to add to his tally. He broke Ali Daei's record of 109 in 2021.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Cristiano_Ronaldo",
  },
  "Which club has appeared in the most Champions League finals?": {
    explanation: "Real Madrid have appeared in the most Champions League/European Cup finals (17 as of 2024) and have the most titles (14), making them the undisputed kings of European football.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Real_Madrid_CF",
  },
  "Who holds the Premier League record for goals in a single season?": {
    explanation: "Mohamed Salah scored 32 Premier League goals in the 2017–18 season for Liverpool, setting a new record for a 38-game Premier League season. He won the Golden Boot by a wide margin.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Mohamed_Salah",
  },
  "Which country won Euro 2020 (played in 2021)?": {
    explanation: "Italy won Euro 2020 (delayed to 2021 due to COVID-19), beating England 3–2 on penalties at Wembley after a 1–1 draw. It was Italy's second European Championship title.",
    readMoreUrl: "https://en.wikipedia.org/wiki/UEFA_Euro_2020",
  },
  "Who is the all-time top scorer in Champions League history?": {
    explanation: "Cristiano Ronaldo is the all-time top scorer in Champions League history with 140+ goals, scored across spells at Manchester United, Real Madrid, and Juventus.",
    readMoreUrl: "https://en.wikipedia.org/wiki/UEFA_Champions_League",
  },
  "How many times has Ronaldo won the Champions League?": {
    explanation: "Cristiano Ronaldo has won the Champions League 5 times: once with Manchester United (2008) and four times with Real Madrid (2014, 2016, 2017, 2018).",
    readMoreUrl: "https://en.wikipedia.org/wiki/Cristiano_Ronaldo",
  },
  "Which manager has won the most Premier League titles?": {
    explanation: "Sir Alex Ferguson won 13 Premier League titles managing Manchester United from 1992 to 2013 — an unmatched record. His next closest rival has won just 4.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Alex_Ferguson",
  },

  // ── EURO CUP SPECIAL ──────────────────────────────────────────────────────
  "Which country has won the most European Championships?": {
    explanation: "Spain has won the UEFA European Championship a record 4 times (1964, 2008, 2012, 2024), including an unprecedented three consecutive titles from 2008 to 2012.",
    readMoreUrl: "https://en.wikipedia.org/wiki/UEFA_European_Championship",
  },
  "In which year was the first European Championship held?": {
    explanation: "The first UEFA European Championship (then called the European Nations' Cup) was held in 1960 in France. The Soviet Union won the inaugural tournament, beating Yugoslavia 2–1 in the final.",
    readMoreUrl: "https://en.wikipedia.org/wiki/UEFA_Euro_1960",
  },
  "Who scored the winning goal in the Euro 2016 final?": {
    explanation: "Eder, a substitute, scored the winning goal for Portugal in extra time of the Euro 2016 final against France, giving Portugal their first major international trophy. Ronaldo had gone off injured early.",
    readMoreUrl: "https://en.wikipedia.org/wiki/UEFA_Euro_2016_final",
  },
  "Which country hosted Euro 2016?": {
    explanation: "France hosted UEFA Euro 2016, which was expanded to 24 teams for the first time. Despite being hosts and favourites, France lost the final 1–0 to Portugal in extra time.",
    readMoreUrl: "https://en.wikipedia.org/wiki/UEFA_Euro_2016",
  },
  "How often is the European Championship held?": {
    explanation: "The UEFA European Championship is held every four years, in the even-numbered years between FIFA World Cups. The 2020 edition was exceptionally delayed to 2021 due to the COVID-19 pandemic.",
    readMoreUrl: "https://en.wikipedia.org/wiki/UEFA_European_Championship",
  },
  "Which player holds the record for most goals in European Championship history (as of 2024)?": {
    explanation: "Cristiano Ronaldo holds the record for most goals in European Championship history with 14 goals scored across 6 tournaments (2004–2024), ahead of Michel Platini's 9.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Cristiano_Ronaldo",
  },
  "Which country beat England in the Euro 2020 final?": {
    explanation: "Italy beat England in the Euro 2020 final at Wembley on 11 July 2021. After a 1–1 draw, Italy won 3–2 on penalties. England have still never won a major international tournament since 1966.",
    readMoreUrl: "https://en.wikipedia.org/wiki/UEFA_Euro_2020_final",
  },
  "Who was the Golden Boot winner at Euro 2020?": {
    explanation: "Cristiano Ronaldo won the Golden Boot at Euro 2020 with 5 goals in the group stage, including two in Portugal's opening game. Portugal were eliminated in the round of 16 by Belgium.",
    readMoreUrl: "https://en.wikipedia.org/wiki/UEFA_Euro_2020",
  },
  "Denmark won the European Championship in which year despite qualifying as a last-minute replacement?": {
    explanation: "Denmark famously won Euro 1992 after being called up as a last-minute replacement for Yugoslavia (excluded due to the Yugoslav Wars). They beat Germany 2–0 in the final, one of football's greatest upsets.",
    readMoreUrl: "https://en.wikipedia.org/wiki/UEFA_Euro_1992",
  },
  "Which British nation has never qualified for the European Championship?": {
    explanation: "Northern Ireland has never qualified for the UEFA European Championship finals. Scotland, Wales, and the Republic of Ireland have all appeared at least once.",
    readMoreUrl: "https://en.wikipedia.org/wiki/UEFA_European_Championship",
  },

  // ── NUCLEAR PHYSICS ───────────────────────────────────────────────────────
  "What force holds the nucleus together?": {
    explanation: "The strong nuclear force is one of the four fundamental forces, acting over very short distances (~1 femtometre) to bind protons and neutrons together despite the electromagnetic repulsion between protons.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Strong_interaction",
  },
  "What is nuclear fission?": {
    explanation: "Nuclear fission splits a heavy atomic nucleus (like Uranium-235) into smaller nuclei, releasing enormous energy plus neutrons that can trigger further fissions. This is the principle behind nuclear power plants and atomic bombs.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Nuclear_fission",
  },
  "What is nuclear fusion?": {
    explanation: "Nuclear fusion combines light nuclei (like hydrogen isotopes) into heavier ones, releasing even more energy per unit mass than fission. It powers the Sun and stars, and is the goal of fusion energy research (e.g., ITER).",
    readMoreUrl: "https://en.wikipedia.org/wiki/Nuclear_fusion",
  },
  "What particle is emitted in alpha decay?": {
    explanation: "Alpha decay emits an alpha particle — identical to a helium-4 nucleus (2 protons + 2 neutrons). Alpha particles are relatively heavy and stopped by a sheet of paper, but are highly ionising and dangerous if inhaled.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Alpha_decay",
  },
  "What is a chain reaction in nuclear physics?": {
    explanation: "A nuclear chain reaction occurs when neutrons released from each fission event strike other nuclei, triggering further fissions. When each event triggers on average one more, the reactor is 'critical' and sustains a steady reaction.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Nuclear_chain_reaction",
  },
  "What does E=mc² tell us about nuclear reactions?": {
    explanation: "In nuclear reactions, a tiny 'mass defect' is converted to energy via E=mc². Because c² ≈ 9×10¹⁶, even a microgram of mass converts to ~9 gigajoules — the source of nuclear power's incredible energy density.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Mass%E2%80%93energy_equivalence",
  },
  "Which element is most commonly used in nuclear power plants?": {
    explanation: "Uranium-235 is the primary fuel for nuclear reactors because it is fissile — it readily splits when struck by a slow (thermal) neutron. Natural uranium contains only 0.7% U-235; reactor fuel is enriched to 3–5%.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Uranium-235",
  },
  "What is radioactive half-life?": {
    explanation: "The half-life is the time for half the atoms in a radioactive sample to decay. Carbon-14 has a half-life of ~5,730 years, making it ideal for dating ancient organic material (radiocarbon dating).",
    readMoreUrl: "https://en.wikipedia.org/wiki/Half-life",
  },
  "Where did the world's first nuclear reactor go critical?": {
    explanation: "Chicago Pile-1 (CP-1) achieved the first controlled nuclear chain reaction on December 2, 1942, beneath the stands of Stagg Field at the University of Chicago — a key milestone of the Manhattan Project.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Chicago_Pile-1",
  },
  "What is antimatter?": {
    explanation: "Antimatter consists of antiparticles with the same mass as normal matter but opposite quantum properties (e.g., positrons have positive charge vs electrons' negative). When matter meets antimatter, both annihilate and release pure energy.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Antimatter",
  },

  // ── TECHNOLOGY ────────────────────────────────────────────────

  // Tech Basics (difficulty 1)
  "What does CPU stand for?": {
    explanation: "CPU stands for Central Processing Unit — the primary chip in a computer that executes instructions. It performs arithmetic, logic, control, and input/output operations as directed by the program.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Central_processing_unit",
  },
  "What does 'WWW' stand for?": {
    explanation: "WWW stands for World Wide Web — the system of interlinked hypertext documents and resources accessed via the internet. It was invented by Tim Berners-Lee in 1989 at CERN.",
    readMoreUrl: "https://en.wikipedia.org/wiki/World_Wide_Web",
  },
  "Which company made the iPhone?": {
    explanation: "Apple Inc. created the iPhone, first unveiled by Steve Jobs on January 9, 2007. It revolutionised the smartphone industry by combining a phone, iPod, and internet communicator in a single touchscreen device.",
    readMoreUrl: "https://en.wikipedia.org/wiki/IPhone",
  },
  "What is the most popular programming language for web browsers?": {
    explanation: "JavaScript is the only programming language natively understood by web browsers, making it the universal language of the web. It enables interactive UI, dynamic content, and is now also used server-side via Node.js.",
    readMoreUrl: "https://en.wikipedia.org/wiki/JavaScript",
  },
  "How many bits are in one byte?": {
    explanation: "One byte consists of 8 bits. A bit is the smallest unit of data (0 or 1), while a byte can represent 256 different values (2⁸). Most character encodings and memory sizes are measured in bytes.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Byte",
  },

  // Internet & Networks (difficulty 2)
  "What does HTTP stand for?": {
    explanation: "HTTP stands for HyperText Transfer Protocol — the foundation of data communication on the Web. It defines how messages are formatted and transmitted between browsers and servers.",
    readMoreUrl: "https://en.wikipedia.org/wiki/HTTP",
  },
  "What is an IP address?": {
    explanation: "An IP (Internet Protocol) address is a unique numerical label assigned to each device on a network, used to identify and locate it. IPv4 addresses look like 192.168.1.1; IPv6 uses a longer hexadecimal format.",
    readMoreUrl: "https://en.wikipedia.org/wiki/IP_address",
  },
  "What does DNS stand for?": {
    explanation: "DNS stands for Domain Name System — the internet's 'phone book' that translates human-readable domain names (e.g., google.com) into IP addresses that computers use to route traffic.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Domain_Name_System",
  },
  "What port does HTTPS use by default?": {
    explanation: "HTTPS uses port 443 by default. Ports are virtual endpoints that direct traffic to the right service on a server — HTTP uses port 80, while HTTPS (the encrypted version) uses 443.",
    readMoreUrl: "https://en.wikipedia.org/wiki/HTTPS",
  },
  "What is a firewall?": {
    explanation: "A firewall is a network security system that monitors and controls incoming and outgoing network traffic based on predetermined rules. It acts as a barrier between trusted internal networks and untrusted external networks.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Firewall_(computing)",
  },

  // Programming Concepts (difficulty 3)
  "What is a 'null' value?": {
    explanation: "Null represents the intentional absence of any object value — it's a special marker meaning 'no value' or 'unknown'. It differs from zero or an empty string, which are actual values.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Null_pointer",
  },
  "What does OOP stand for?": {
    explanation: "OOP stands for Object-Oriented Programming — a paradigm that organises code into 'objects' that bundle data (attributes) and behaviour (methods). Key principles include encapsulation, inheritance, and polymorphism.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Object-oriented_programming",
  },
  "What is a 'function' in programming?": {
    explanation: "A function is a named, reusable block of code that performs a specific task. Functions accept inputs (parameters), execute logic, and optionally return a value — promoting code reuse and modularity.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Function_(computer_programming)",
  },
  "What does 'API' stand for?": {
    explanation: "API stands for Application Programming Interface — a set of rules and protocols that allows different software applications to communicate. APIs define the methods and data formats apps use to request and exchange information.",
    readMoreUrl: "https://en.wikipedia.org/wiki/API",
  },
  "Which data structure uses LIFO order?": {
    explanation: "A Stack uses LIFO (Last In, First Out) order — the last item pushed onto the stack is the first to be popped off. Think of a stack of plates: you add and remove from the top. Used in undo operations, call stacks, and parsing.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Stack_(abstract_data_type)",
  },

  // Databases & Cloud (difficulty 4)
  "What does SQL stand for?": {
    explanation: "SQL stands for Structured Query Language — the standard language for managing and querying relational databases. Commands like SELECT, INSERT, UPDATE, and DELETE allow you to interact with data stored in tables.",
    readMoreUrl: "https://en.wikipedia.org/wiki/SQL",
  },
  "What is a NoSQL database?": {
    explanation: "NoSQL (non-relational) databases store data in formats other than tables — such as documents (MongoDB), key-value pairs (Redis), or graphs (Neo4j). They're optimised for scalability and flexible schemas.",
    readMoreUrl: "https://en.wikipedia.org/wiki/NoSQL",
  },
  "What does AWS stand for?": {
    explanation: "AWS stands for Amazon Web Services — Amazon's cloud computing platform offering 200+ services including compute (EC2), storage (S3), databases (RDS), and AI tools. Launched in 2006, it's the world's largest cloud provider.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Amazon_Web_Services",
  },
  "What is 'containerisation' in computing?": {
    explanation: "Containerisation is OS-level virtualisation that packages an application and its dependencies into a self-contained 'container'. Docker is the most popular tool; containers are lighter than VMs as they share the host OS kernel.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Containerization_(computing)",
  },
  "What is a CDN?": {
    explanation: "A CDN (Content Delivery Network) is a geographically distributed network of servers that deliver web content to users from the nearest location, reducing latency and speeding up load times. Examples include Cloudflare and Akamai.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Content_delivery_network",
  },

  // AI & Cybersecurity (difficulty 5)
  "What does LLM stand for in AI?": {
    explanation: "LLM stands for Large Language Model — a type of AI trained on massive text datasets to understand and generate human language. GPT-4, Claude, and Gemini are examples. They use the transformer architecture.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Large_language_model",
  },
  "What is a zero-day vulnerability?": {
    explanation: "A zero-day vulnerability is a software flaw that is unknown to the vendor and therefore unpatched. Attackers can exploit it before a fix is released — 'zero days' refers to the time developers have had to address it.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Zero-day_vulnerability",
  },
  "What type of ML trains on unlabelled data?": {
    explanation: "Unsupervised learning trains on data without predefined labels. The model finds hidden patterns, clusters, or structure by itself — used in customer segmentation, anomaly detection, and generative models.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Unsupervised_learning",
  },
  "What does 'HTTPS' protect against compared to HTTP?": {
    explanation: "HTTPS uses TLS/SSL encryption to protect data in transit, preventing man-in-the-middle attacks where an attacker intercepts communication between browser and server. It also authenticates the server's identity via certificates.",
    readMoreUrl: "https://en.wikipedia.org/wiki/HTTPS",
  },
  "What is a 'transformer' in AI context?": {
    explanation: "In AI, a transformer is a neural network architecture introduced in the 2017 paper 'Attention Is All You Need'. It uses self-attention mechanisms to process sequences in parallel, becoming the foundation for GPT, BERT, and most modern LLMs.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Transformer_(deep_learning_architecture)",
  },

  // ── CRICKET ───────────────────────────────────────────────────

  // Cricket for Beginners (difficulty 1)
  "How many players are in a cricket team?": {
    explanation: "A cricket team consists of 11 players. Both the batting and fielding sides field 11 players each. A team is all out when 10 wickets fall (the 11th batter has no partner to continue).",
    readMoreUrl: "https://en.wikipedia.org/wiki/Cricket",
  },
  "What do you call it when a batsman scores 100 runs?": {
    explanation: "Scoring 100 runs in a single innings is called a 'century' — one of cricket's most celebrated personal milestones. A score of 50 is a 'half-century'. Sachin Tendulkar holds the record with 100 international centuries.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Century_(cricket)",
  },
  "How many balls are in one over?": {
    explanation: "An over consists of 6 legitimate deliveries bowled by the same bowler from one end. Wide balls and no-balls do not count and must be re-bowled. The concept dates back to 1889 when the standard moved from 5 to 6 balls.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Over_(cricket)",
  },
  "What is the shape of a cricket bat?": {
    explanation: "A cricket bat has a flat front face and a raised spine on the back, with a cylindrical handle — giving it a distinctive flat-with-a-handle profile. The blade is traditionally made from willow wood for its combination of strength and lightness.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Cricket_bat",
  },
  "Which country invented cricket?": {
    explanation: "Cricket originated in England, with the earliest definite reference dating to 1598 in Guildford, Surrey. It was popularised in the 18th century and spread globally through the British Empire.",
    readMoreUrl: "https://en.wikipedia.org/wiki/History_of_cricket",
  },

  // International Cricket (difficulty 2)
  "Which country has won the most Cricket World Cups?": {
    explanation: "Australia has won the ICC Cricket World Cup five times (1987, 1999, 2003, 2007, 2023) — more than any other nation. India and West Indies have each won it twice.",
    readMoreUrl: "https://en.wikipedia.org/wiki/ICC_Cricket_World_Cup",
  },
  "Who scored the first ever ODI century?": {
    explanation: "Dennis Amiss of England scored the first ODI century (103) against Australia in Melbourne on January 5, 1971 — in the very first One Day International ever played.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Dennis_Amiss",
  },
  "In which year was the first Cricket World Cup held?": {
    explanation: "The first Cricket World Cup was held in England in 1975. West Indies, captained by Clive Lloyd, defeated Australia in the final at Lord's. The tournament was officially called the Prudential Cup.",
    readMoreUrl: "https://en.wikipedia.org/wiki/1975_Cricket_World_Cup",
  },
  "Which format lasts 5 days?": {
    explanation: "Test cricket is the longest format, played over up to 5 days with each team batting twice. It is considered the pinnacle of the sport, testing players' technique, concentration, and endurance.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Test_cricket",
  },
  "What is a 'duck' in cricket?": {
    explanation: "A duck means a batsman is dismissed without scoring any runs. The term comes from the shape of a '0' resembling a duck's egg. A 'golden duck' is being dismissed on the very first ball faced.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Duck_(cricket)",
  },

  // IPL Knowledge (difficulty 3)
  "Which team has won the most IPL titles?": {
    explanation: "Mumbai Indians have won the IPL a record 5 times (2013, 2015, 2017, 2019, 2020), making them the most successful franchise in IPL history.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Mumbai_Indians",
  },
  "In which year did IPL start?": {
    explanation: "The Indian Premier League (IPL) was founded by the BCCI in 2007 and its inaugural season was played in 2008. It was conceived by Lalit Modi and has since become the world's most-watched T20 league.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Indian_Premier_League",
  },
  "Who has hit the most sixes in IPL history?": {
    explanation: "Chris Gayle holds the record for most sixes in IPL history. The Jamaican opener, famous for his explosive batting, hit over 350 sixes across his IPL career with Royal Challengers Bangalore and other teams.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Chris_Gayle",
  },
  "What is the maximum overs in an IPL match per side?": {
    explanation: "Each team bats for a maximum of 20 overs in an IPL match, making it a T20 (Twenty20) format. This shorter format was designed for fast-paced, high-scoring entertainment compared to ODI (50 overs) or Test cricket.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Twenty20",
  },
  "Which ground is known as the 'Home of Cricket' in India?": {
    explanation: "Eden Gardens in Kolkata is often called the 'Home of Cricket' in India and is Asia's largest cricket stadium, with a capacity of around 68,000. It hosted India's famous 2001 Test victory over Australia.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Eden_Gardens",
  },

  // Cricket Records (difficulty 4)
  "Who holds the record for the highest Test innings score?": {
    explanation: "Brian Lara scored 400 not out for West Indies against England in Antigua in April 2004 — the highest individual score in Test cricket history. He also held the previous record of 375, set in 1994.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Brian_Lara",
  },
  "What is Brian Lara's record Test score?": {
    explanation: "Brian Lara scored 400 not out against England at the Recreation Ground, Antigua, in 2004. He reclaimed the record from Matthew Hayden (380) who had briefly held it. Lara batted for over 12 hours.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Brian_Lara",
  },
  "Who was the first to score 10,000 ODI runs?": {
    explanation: "Sachin Tendulkar was the first cricketer to score 10,000 runs in ODI cricket, achieving the milestone in 1999. He went on to score 18,426 ODI runs — a record that still stands today.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Sachin_Tendulkar",
  },
  "Which bowler has taken the most Test wickets ever?": {
    explanation: "Muttiah Muralitharan of Sri Lanka holds the record with 800 Test wickets. The off-spinner retired in 2010 after taking his 800th wicket on his home ground in Galle — on the last ball of his final Test.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Muttiah_Muralitharan",
  },
  "How many Test hundreds did Don Bradman score?": {
    explanation: "Don Bradman scored 29 Test centuries in 80 innings across 52 Tests. His extraordinary consistency contributed to his batting average of 99.94 — still the highest in Test cricket history by a massive margin.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Don_Bradman",
  },

  // Cricket Legends Expert (difficulty 5)
  "What is Don Bradman's Test batting average?": {
    explanation: "Don Bradman's Test batting average of 99.94 is widely regarded as the greatest statistical achievement in any major sport. The next best all-time average is around 60. He needed just 4 runs in his final innings to average 100, but was dismissed for a duck.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Don_Bradman",
  },
  "Which bowler took a hat-trick in the 2019 World Cup final?": {
    explanation: "Trent Boult of New Zealand took a hat-trick during the 2019 World Cup final against England at Lord's. Despite this, England won the trophy on boundary count after a Super Over tie — one of cricket's most dramatic finishes.",
    readMoreUrl: "https://en.wikipedia.org/wiki/2019_Cricket_World_Cup_Final",
  },
  "In which year did India win their first Cricket World Cup?": {
    explanation: "India won their first Cricket World Cup in 1983 under Kapil Dev's captaincy, defeating the two-time defending champions West Indies in the final at Lord's. It was a huge upset and transformed cricket's popularity in India.",
    readMoreUrl: "https://en.wikipedia.org/wiki/1983_Cricket_World_Cup",
  },
  "Who was the first cricketer to be inducted into the ICC Hall of Fame?": {
    explanation: "Sir Garfield Sobers of West Indies was among the inaugural inductees into the ICC Cricket Hall of Fame in 2009. He is widely regarded as the greatest all-rounder in cricket history, also famous for hitting 6 sixes in a single over.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Garfield_Sobers",
  },
  "What is the fastest recorded delivery in cricket history (km/h)?": {
    explanation: "Shoaib Akhtar of Pakistan bowled the fastest delivery in recorded cricket history at 161.3 km/h (100.2 mph) against England in the 2003 World Cup. He was the first bowler to officially breach the 100 mph barrier.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Shoaib_Akhtar",
  },

  // ── HARRY POTTER: WELCOME TO HOGWARTS (Difficulty 1) ─────────────────────
  "What school does Harry Potter attend?": {
    explanation: "Hogwarts School of Witchcraft and Wizardry is a fictional British boarding school of magic in J.K. Rowling's series, located in Scotland. Harry receives his acceptance letter on his 11th birthday.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Hogwarts",
  },
  "What is Harry's owl called?": {
    explanation: "Hedwig is Harry's snowy owl, given to him as a birthday present by Hagrid. She serves as Harry's mail carrier and companion throughout the series, and is among the most beloved characters in the books.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magical_creatures_in_Harry_Potter#Hedwig",
  },
  "What house is Harry Potter sorted into?": {
    explanation: "The Sorting Hat places Harry in Gryffindor, the house known for bravery and courage. Harry's qualities of daring and nerve outweigh the Hat's temptation to place him in Slytherin.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Hogwarts#Houses",
  },
  "Who is Harry Potter's best friend?": {
    explanation: "Ron Weasley becomes Harry's first and closest friend on the Hogwarts Express in their first year. Together with Hermione Granger, they form the iconic trio at the heart of the series.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Ron_Weasley",
  },
  "What is the spell for disarming someone?": {
    explanation: "Expelliarmus (the Disarming Charm) forces the target to drop whatever they are holding, usually their wand. Harry famously uses it as his go-to spell and ultimately defeats Voldemort with it.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magic_in_Harry_Potter#Expelliarmus",
  },

  // ── HARRY POTTER: SPELLS AND POTIONS (Difficulty 2) ──────────────────────
  "What does the spell 'Lumos' do?": {
    explanation: "Lumos is a wand-lighting charm that produces a beam of light from the tip of the caster's wand. Its counter-charm is Nox, which extinguishes the light.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magic_in_Harry_Potter#Lumos",
  },
  "What potion makes you look like someone else?": {
    explanation: "Polyjuice Potion transforms the drinker into another person for up to one hour. It requires a piece of the target's body (e.g., a hair). First brewed by Hermione in Book 2 using Moaning Myrtle's bathroom.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magical_objects_in_Harry_Potter#Polyjuice_Potion",
  },
  "What plant is used to cure Petrification?": {
    explanation: "Mandrake (Mandragora) roots are the key ingredient in the Restorative Draught that reverses Petrification. Their cry is lethal to humans, so students wear earmuffs when handling them in Herbology.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magical_plants_in_Harry_Potter#Mandrake",
  },
  "What does Alohomora do?": {
    explanation: "Alohomora is the Unlocking Charm that opens locked doors and windows. Hermione uses it to save the trio from Filch in their first year. The name derives from the Sidiki dialect of West Africa meaning 'friendly to thieves'.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magic_in_Harry_Potter#Alohomora",
  },
  "Who teaches Potions in the first few books?": {
    explanation: "Professor Severus Snape teaches Potions for the first six books, though he covets the Defence Against the Dark Arts position. He is later revealed to be a double agent working for Dumbledore.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Severus_Snape",
  },

  // ── HARRY POTTER: CHARACTERS OF HOGWARTS (Difficulty 3) ──────────────────
  "What is Hermione Granger's Patronus?": {
    explanation: "Hermione's Patronus takes the form of an otter, J.K. Rowling's favourite animal. A Patronus is a positive force conjured with the spell Expecto Patronum to repel Dementors; its shape reflects the caster's personality.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Hermione_Granger",
  },
  "Who is the Half-Blood Prince?": {
    explanation: "Severus Snape coined the nickname 'the Half-Blood Prince' because his mother was a witch named Eileen Prince and his father a Muggle named Tobias Snape. He wrote advanced spells and annotations in his old Potions textbook.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Severus_Snape",
  },
  "What is the name of Neville's toad?": {
    explanation: "Trevor is Neville Longbottom's toad, which he misplaces at the start of term in their first year — causing Hermione to meet Harry and Ron. Toads were an old-fashioned wizard's pet even by Hogwarts standards.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Neville_Longbottom",
  },
  "Which Weasley is the oldest?": {
    explanation: "Bill Weasley (William Arthur Weasley) is the eldest of the seven Weasley children. He works as a Curse-Breaker for Gringotts in Egypt and later marries Fleur Delacour.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Weasley_family",
  },
  "What subject does Sybill Trelawney teach?": {
    explanation: "Professor Sybill Trelawney teaches Divination at Hogwarts, claiming to predict the future through crystal balls, tea leaves, and star charts. Despite her frequent inaccuracies, she did make two genuine prophecies.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Sybill_Trelawney",
  },

  // ── HARRY POTTER: DEATHLY HALLOWS (Difficulty 4) ─────────────────────────
  "What are the three Deathly Hallows?": {
    explanation: "The three Deathly Hallows are the Elder Wand (most powerful wand ever made), the Resurrection Stone (brings back shades of the dead), and the Cloak of Invisibility (renders the wearer fully invisible). Together, they supposedly make the owner the Master of Death.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magical_objects_in_Harry_Potter#Deathly_Hallows",
  },
  "Who originally owned the Elder Wand before Dumbledore?": {
    explanation: "The Elder Wand was originally created by Death (in legend) and later owned by Antioch Peverell. Its ownership passed through many hands — including Gregorovitch and Grindelwald — before Dumbledore won it in their 1945 duel.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magical_objects_in_Harry_Potter#Elder_Wand",
  },
  "How does Harry survive Voldemort's killing curse as a baby?": {
    explanation: "Lily Potter's self-sacrificial love created an ancient magical protection — a 'blood magic' charm — that caused Voldemort's Avada Kedavra to rebound. Love as the ultimate magic is the central theme of the series.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Harry_Potter_(character)",
  },
  "What is the final Horcrux Voldemort unknowingly created?": {
    explanation: "When Voldemort's Killing Curse rebounded on the night he murdered the Potters, a fragment of his shattered soul latched onto the only living thing in the room — baby Harry — making him an unintentional Horcrux.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magical_objects_in_Harry_Potter#Horcruxes",
  },
  "Which spell does Harry use to defeat Voldemort in the final battle?": {
    explanation: "Harry uses Expelliarmus against Voldemort's Avada Kedavra. Because Harry was the true master of the Elder Wand, the curse rebounded and killed Voldemort. Harry's choice to disarm rather than kill underscores his character.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magic_in_Harry_Potter#Expelliarmus",
  },

  // ── HARRY POTTER: POTTER EXPERT (Difficulty 5) ───────────────────────────
  "What is the incantation for the Imperius Curse?": {
    explanation: "Imperio is one of the three Unforgivable Curses. It places the victim under the complete control of the caster. During Voldemort's first rise, many Death Eaters claimed they acted under the Imperius Curse to escape Azkaban.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magic_in_Harry_Potter#Unforgivable_Curses",
  },
  "What dragon did Harry face in the Triwizard Tournament?": {
    explanation: "Harry drew the Hungarian Horntail in the first task of the Triwizard Tournament — considered the most dangerous breed. He summoned his Firebolt with Accio and retrieved the golden egg by outflying it.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magical_creatures_in_Harry_Potter#Dragons",
  },
  "What is the name of the Marauder who was secretly a Death Eater?": {
    explanation: "Peter Pettigrew (Wormtail) was the fourth Marauder who secretly became a Death Eater and betrayed the Potters to Voldemort. He faked his own death, framed Sirius Black, and hid as Ron's pet rat Scabbers for 12 years.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Peter_Pettigrew",
  },
  "Which Hogwarts ghost was once the Fat Friar?": {
    explanation: "The Fat Friar is the ghost of Hufflepuff House. He was a medieval friar who could cure the pox with a touch and pull rabbits from hats, but was executed by senior church members who grew suspicious of his abilities.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Ghosts_in_Harry_Potter#The_Fat_Friar",
  },
  "What is the core of Voldemort's wand?": {
    explanation: "Voldemort's wand (13½ inches, yew) contained a phoenix feather from Fawkes — the same phoenix that provided the core for Harry's wand. This 'twin cores' connection caused Priori Incantatem when the two wands met.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Lord_Voldemort",
  },

  // ── HARRY POTTER: HOGWARTS CLASSES & SPELLS (Difficulty 2 extra) ─────────
  "What spell unlocks doors?": {
    explanation: "Alohomora is the Unlocking Charm. It can open most locked doors and was introduced by Hermione in Book 1 to help the trio escape Filch. Some magically reinforced doors are immune to it.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magic_in_Harry_Potter#Alohomora",
  },
  "Who teaches Transfiguration at Hogwarts?": {
    explanation: "Professor Minerva McGonagall teaches Transfiguration — the art of changing one object into another. She is also Head of Gryffindor House, Deputy Headmistress, and an unregistered Animagus who transforms into a tabby cat.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Minerva_McGonagall",
  },
  "What does 'Lumos' do?": {
    explanation: "Lumos produces a beam of light from the wand tip, functioning like a torch. It is one of the earliest spells introduced in the series and is commonly used when exploring dark areas.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magic_in_Harry_Potter#Lumos",
  },
  "Which spell disarms an opponent?": {
    explanation: "Expelliarmus (the Disarming Charm) forces the target to release whatever they are holding. It became Harry's signature spell and the one he used to finally defeat Voldemort in their last duel.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magic_in_Harry_Potter#Expelliarmus",
  },
  "What is the charm to summon objects?": {
    explanation: "Accio is the Summoning Charm that calls an object to the caster. Harry uses it to summon his Firebolt broomstick during the first Triwizard task. It can summon objects over great distances.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magic_in_Harry_Potter#Accio",
  },
  "Who is the Potions teacher when Harry first arrives at Hogwarts?": {
    explanation: "Severus Snape is Potions master when Harry begins at Hogwarts in Year 1. Despite wanting the DADA position, Snape excels at Potions and is a talented brewer — he invented spells like Sectumsempra.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Severus_Snape",
  },
  "What spell creates a Patronus?": {
    explanation: "Expecto Patronum conjures a Patronus — a positive, protective force shaped like the caster's spirit animal. It repels Dementors and Lethifolds. Harry's Patronus is a stag, mirroring his father James's Animagus form.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magic_in_Harry_Potter#Expecto_Patronum",
  },
  "Which class teaches students to fight magical creatures?": {
    explanation: "Care of Magical Creatures is an elective taught by Rubeus Hagrid (and later Professor Grubbly-Plank). Students learn to handle creatures like Hippogriffs, Flobberworms, and Blast-Ended Skrewts.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Hogwarts#Subjects",
  },
  "What plant strangles intruders in Herbology?": {
    explanation: "Devil's Snare is a dark, tangling plant that constricts anything it touches. The more the victim struggles, the tighter it grips. It can be repelled by fire or sunlight — Hermione uses Bluebell Flames to free the trio.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magical_plants_in_Harry_Potter#Devil%27s_Snare",
  },
  "What does 'Wingardium Leviosa' do?": {
    explanation: "Wingardium Leviosa is the Levitation Charm that makes objects float. It is one of the first spells Charms students learn. Hermione famously corrects Ron's pronunciation ('Levi-O-sa, not Levio-SA') in their first lesson.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magic_in_Harry_Potter#Wingardium_Leviosa",
  },

  // ── HARRY POTTER: DARK ARTS & VOLDEMORT (Difficulty 4 extra) ─────────────
  "What is Voldemort's real name?": {
    explanation: "Tom Marvolo Riddle is Voldemort's birth name — an anagram of 'I am Lord Voldemort'. He was born of a Muggle father (Tom Riddle Sr.) and a witch mother (Merope Gaunt, a descendant of Salazar Slytherin).",
    readMoreUrl: "https://en.wikipedia.org/wiki/Lord_Voldemort",
  },
  "How many Horcruxes did Voldemort create?": {
    explanation: "Voldemort intended to create six Horcruxes to split his soul into seven parts (6 Horcruxes + his body). He unknowingly created a seventh when his curse rebounded onto baby Harry, making Harry an accidental Horcrux.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magical_objects_in_Harry_Potter#Horcruxes",
  },
  "Which Horcrux was destroyed by Dumbledore?": {
    explanation: "Dumbledore destroyed Marvolo Gaunt's ring (which contained the Resurrection Stone) using Godric Gryffindor's sword. The cursed ring fatally wounded his hand, accelerating his death — planned with Snape.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Albus_Dumbledore",
  },
  "What creature was Nagini before becoming a Horcrux?": {
    explanation: "Nagini was a Maledictus — a woman (revealed in Fantastic Beasts) cursed with a blood curse that eventually transformed her permanently into a snake. Voldemort made her a Horcrux after murdering Bertha Jorkins.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Nagini_(Harry_Potter)",
  },
  "What spell kills instantly?": {
    explanation: "Avada Kedavra (the Killing Curse) is one of the three Unforgivable Curses, producing a flash of green light and causing instant death. It has no counter-curse; the only known person to survive it is Harry Potter (due to Lily's sacrifice).",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magic_in_Harry_Potter#Unforgivable_Curses",
  },
  "Who was the Half-Blood Prince?": {
    explanation: "Severus Snape called himself the Half-Blood Prince because his mother was a pureblood witch named Eileen Prince. He wrote this title inside his annotated copy of Advanced Potion-Making, which Harry finds in sixth year.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Severus_Snape",
  },
  "Which Death Eater betrayed the Potters?": {
    explanation: "Peter Pettigrew (Wormtail) was the Secret-Keeper for the Potters under the Fidelius Charm and willingly revealed their location to Voldemort. He then framed Sirius Black, faked his own death, and hid as a rat for 12 years.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Peter_Pettigrew",
  },
  "What is the name of Voldemort's wand wood?": {
    explanation: "Voldemort's wand is made of yew, a wood associated with death and immortality in wizarding lore — fitting for someone obsessed with conquering death. The wand is 13½ inches long with a phoenix feather core.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Lord_Voldemort",
  },
  "Which living being is revealed to be a Horcrux?": {
    explanation: "Harry Potter is revealed to be an unintentional Horcrux in Deathly Hallows. When Voldemort's Killing Curse rebounded in Godric's Hollow, a soul fragment latched onto infant Harry. Harry must 'die' to destroy this Horcrux.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Magical_objects_in_Harry_Potter#Horcruxes",
  },
  "What was the name of Voldemort's snake?": {
    explanation: "Nagini is Voldemort's giant serpent and one of his Horcruxes. He can speak to her via Parseltongue and later uses her venom to sustain himself. Neville Longbottom ultimately kills her with Godric Gryffindor's sword.",
    readMoreUrl: "https://en.wikipedia.org/wiki/Nagini_(Harry_Potter)",
  },
};

async function main() {
  console.log("⚡ Adding physics explanations to existing questions...");
  let updated = 0;
  let skipped = 0;

  for (const [text, { explanation, readMoreUrl }] of Object.entries(EXPLANATIONS)) {
    const result = await prisma.question.updateMany({
      where: { text },
      data: { explanation, readMoreUrl },
    });
    if (result.count > 0) {
      updated += result.count;
    } else {
      console.warn(`  ⚠ No question found: "${text.slice(0, 60)}..."`);
      skipped++;
    }
  }

  console.log(`✅ Updated ${updated} questions (${skipped} not found)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
