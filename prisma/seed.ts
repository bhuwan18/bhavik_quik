import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { QUIZLETS_DATA } from "../lib/quizlets-data";
import { PACKS_DATA } from "../lib/packs-data";
import { SELL_VALUES } from "../lib/utils";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SYSTEM_EMAIL = "system@bittsquiz.app";

const QUIZZES = [
  // ── FOOTBALL ──────────────────────────────────────────────────
  {
    title: "Football Basics",
    description: "Test your knowledge of the beautiful game.",
    category: "football",
    difficulty: 1,
    questions: [
      { text: "How many players are on a football team?", options: ["9", "10", "11", "12"], correctIndex: 2 },
      { text: "How long is a standard football match?", options: ["60 min", "80 min", "90 min", "120 min"], correctIndex: 2 },
      { text: "Which country invented football?", options: ["Brazil", "Germany", "England", "Spain"], correctIndex: 2 },
      { text: "What shape is a football?", options: ["Round", "Oval", "Square", "Diamond"], correctIndex: 0 },
      { text: "Where is the FIFA World Cup trophy kept between tournaments?", options: ["London", "New York", "Zurich", "Paris"], correctIndex: 2 },
    ],
  },
  {
    title: "World Cup History",
    description: "Questions about the history of the FIFA World Cup.",
    category: "football",
    difficulty: 2,
    questions: [
      { text: "Which country has won the most FIFA World Cups?", options: ["Germany", "Brazil", "Argentina", "Italy"], correctIndex: 1 },
      { text: "In which year was the first World Cup held?", options: ["1926", "1930", "1934", "1938"], correctIndex: 1 },
      { text: "Who scored the most goals in a single World Cup?", options: ["Ronaldo", "Messi", "Just Fontaine", "Pele"], correctIndex: 2 },
      { text: "Which country hosted the 2022 World Cup?", options: ["UAE", "Saudi Arabia", "Qatar", "Bahrain"], correctIndex: 2 },
      { text: "The 'Hand of God' goal was scored by whom?", options: ["Pele", "Zidane", "Maradona", "Beckham"], correctIndex: 2 },
    ],
  },
  {
    title: "Premier League Challenge",
    description: "All about the English Premier League.",
    category: "football",
    difficulty: 3,
    questions: [
      { text: "Which club has won the most Premier League titles?", options: ["Arsenal", "Chelsea", "Liverpool", "Manchester United"], correctIndex: 3 },
      { text: "Who is the all-time top scorer in the Premier League?", options: ["Thierry Henry", "Wayne Rooney", "Alan Shearer", "Frank Lampard"], correctIndex: 2 },
      { text: "In which year was the Premier League formed?", options: ["1988", "1990", "1992", "1995"], correctIndex: 2 },
      { text: "Which team was relegated in the first Premier League season (1992/93)?", options: ["Crystal Palace", "Oldham", "Nottingham Forest", "Swindon"], correctIndex: 3 },
      { text: "Who scored the fastest Premier League hat-trick?", options: ["Robbie Fowler", "Michael Owen", "Sadio Mane", "Harry Kane"], correctIndex: 0 },
    ],
  },
  {
    title: "Champions League Masters",
    description: "UEFA Champions League deep knowledge.",
    category: "football",
    difficulty: 4,
    questions: [
      { text: "Which player has won the most Champions League titles?", options: ["Messi", "Cristiano Ronaldo", "Xavi", "Marcelo"], correctIndex: 3 },
      { text: "What was the Champions League called before 1992?", options: ["Super Cup", "European Cup", "Euro League", "Continental Cup"], correctIndex: 1 },
      { text: "Who scored the winning goal in the 1999 Champions League final?", options: ["Sheringham", "Solskjaer", "Cole", "Yorke"], correctIndex: 1 },
      { text: "Which country has the most Champions League winning clubs?", options: ["Spain", "Italy", "England", "Germany"], correctIndex: 0 },
      { text: "How many times has Liverpool won the Champions League?", options: ["4", "5", "6", "7"], correctIndex: 2 },
    ],
  },
  {
    title: "Football Legends",
    description: "Expert questions about the greatest footballers ever.",
    category: "football",
    difficulty: 5,
    questions: [
      { text: "How many Ballon d'Or awards has Lionel Messi won (as of 2024)?", options: ["7", "8", "9", "10"], correctIndex: 1 },
      { text: "What year did Pele win his third World Cup?", options: ["1958", "1962", "1966", "1970"], correctIndex: 3 },
      { text: "Which club did Johan Cruyff famously refuse to join due to a sponsor conflict?", options: ["Bayern Munich", "Juventus", "Real Madrid", "PSG"], correctIndex: 2 },
      { text: "What is Zinedine Zidane's nickname?", options: ["Le Bleu", "Zizou", "The Maestro", "Le King"], correctIndex: 1 },
      { text: "Which team did Diego Maradona play for when banned from football in 1991?", options: ["Napoli", "Boca Juniors", "Barcelona", "Sevilla"], correctIndex: 0 },
    ],
  },

  // ── CRICKET ───────────────────────────────────────────────────
  {
    title: "Cricket for Beginners",
    description: "Start your cricket journey here.",
    category: "cricket",
    difficulty: 1,
    questions: [
      { text: "How many players are in a cricket team?", options: ["9", "10", "11", "12"], correctIndex: 2 },
      { text: "What do you call it when a batsman scores 100 runs?", options: ["Half-century", "Century", "Double", "Perfect"], correctIndex: 1 },
      { text: "How many balls are in one over?", options: ["4", "5", "6", "8"], correctIndex: 2 },
      { text: "What is the shape of a cricket bat?", options: ["Round", "Flat with a handle", "Square", "Oval"], correctIndex: 1 },
      { text: "Which country invented cricket?", options: ["India", "Australia", "England", "South Africa"], correctIndex: 2 },
    ],
  },
  {
    title: "International Cricket",
    description: "Test tubes of international cricket knowledge.",
    category: "cricket",
    difficulty: 2,
    questions: [
      { text: "Which country has won the most Cricket World Cups?", options: ["India", "Australia", "West Indies", "England"], correctIndex: 1 },
      { text: "Who scored the first ever ODI century?", options: ["Viv Richards", "Dennis Amiss", "Geoff Boycott", "Clive Lloyd"], correctIndex: 1 },
      { text: "In which year was the first Cricket World Cup held?", options: ["1970", "1975", "1979", "1983"], correctIndex: 1 },
      { text: "Which format lasts 5 days?", options: ["T20", "ODI", "Test", "T10"], correctIndex: 2 },
      { text: "What is a 'duck' in cricket?", options: ["Scoring 0 runs", "Hit wicket", "A boundary", "A wide ball"], correctIndex: 0 },
    ],
  },
  {
    title: "IPL Knowledge",
    description: "All about the Indian Premier League.",
    category: "cricket",
    difficulty: 3,
    questions: [
      { text: "Which team has won the most IPL titles?", options: ["Mumbai Indians", "Chennai Super Kings", "Kolkata Knight Riders", "Royal Challengers"], correctIndex: 0 },
      { text: "In which year did IPL start?", options: ["2006", "2007", "2008", "2009"], correctIndex: 2 },
      { text: "Who has hit the most sixes in IPL history?", options: ["Gayle", "Dhoni", "Kohli", "de Villiers"], correctIndex: 0 },
      { text: "What is the maximum overs in an IPL match per side?", options: ["15", "20", "25", "50"], correctIndex: 1 },
      { text: "Which ground is known as the 'Home of Cricket' in India?", options: ["Eden Gardens", "Wankhede", "Lords", "Chinnaswamy"], correctIndex: 0 },
    ],
  },
  {
    title: "Cricket Records",
    description: "Hardest cricket record questions.",
    category: "cricket",
    difficulty: 4,
    questions: [
      { text: "Who holds the record for the highest Test innings score?", options: ["Don Bradman", "Brian Lara", "Sachin Tendulkar", "Len Hutton"], correctIndex: 1 },
      { text: "What is Brian Lara's record Test score?", options: ["375", "400", "410", "501"], correctIndex: 1 },
      { text: "Who was the first to score 10,000 ODI runs?", options: ["Lara", "Ponting", "Tendulkar", "Inzamam"], correctIndex: 2 },
      { text: "Which bowler has taken the most Test wickets ever?", options: ["Shane Warne", "Muttiah Muralitharan", "James Anderson", "Anil Kumble"], correctIndex: 1 },
      { text: "How many Test hundreds did Don Bradman score?", options: ["25", "29", "32", "36"], correctIndex: 1 },
    ],
  },
  {
    title: "Cricket Legends Expert",
    description: "For cricket scholars only.",
    category: "cricket",
    difficulty: 5,
    questions: [
      { text: "What is Don Bradman's Test batting average?", options: ["95.14", "98.34", "99.94", "101.20"], correctIndex: 2 },
      { text: "Which bowler took a hat-trick in the 2019 World Cup final?", options: ["Boult", "Starc", "Bumrah", "Archer"], correctIndex: 0 },
      { text: "In which year did India win their first Cricket World Cup?", options: ["1979", "1983", "1987", "1992"], correctIndex: 1 },
      { text: "Who was the first cricketer to be inducted into the ICC Hall of Fame?", options: ["Sunil Gavaskar", "Richie Benaud", "Garfield Sobers", "Don Bradman"], correctIndex: 2 },
      { text: "What is the fastest recorded delivery in cricket history (km/h)?", options: ["156.4", "158.0", "161.3", "163.0"], correctIndex: 2 },
    ],
  },

  // ── HARRY POTTER ──────────────────────────────────────────────
  {
    title: "Welcome to Hogwarts",
    description: "Basic questions for every Potterhead.",
    category: "harry-potter",
    difficulty: 1,
    questions: [
      { text: "What school does Harry Potter attend?", options: ["Durmstrang", "Beauxbatons", "Hogwarts", "Ilvermorny"], correctIndex: 2 },
      { text: "What is Harry's owl called?", options: ["Crookshanks", "Hedwig", "Errol", "Pigwidgeon"], correctIndex: 1 },
      { text: "What house is Harry Potter sorted into?", options: ["Slytherin", "Hufflepuff", "Ravenclaw", "Gryffindor"], correctIndex: 3 },
      { text: "Who is Harry Potter's best friend?", options: ["Neville", "Seamus", "Ron Weasley", "Dean Thomas"], correctIndex: 2 },
      { text: "What is the spell for disarming someone?", options: ["Lumos", "Alohomora", "Expelliarmus", "Stupefy"], correctIndex: 2 },
    ],
  },
  {
    title: "Spells and Potions",
    description: "Can you pass your O.W.L.s?",
    category: "harry-potter",
    difficulty: 2,
    questions: [
      { text: "What does the spell 'Lumos' do?", options: ["Open locks", "Create light", "Levitate objects", "Summon objects"], correctIndex: 1 },
      { text: "What potion makes you look like someone else?", options: ["Felix Felicis", "Veritaserum", "Polyjuice Potion", "Amortentia"], correctIndex: 2 },
      { text: "What plant is used to cure Petrification?", options: ["Devil's Snare", "Gillyweed", "Mandrake", "Wolfsbane"], correctIndex: 2 },
      { text: "What does Alohomora do?", options: ["Unlocks doors", "Creates fire", "Heals wounds", "Breaks shields"], correctIndex: 0 },
      { text: "Who teaches Potions in the first few books?", options: ["Slughorn", "Snape", "McGonagall", "Lupin"], correctIndex: 1 },
    ],
  },
  {
    title: "Characters of Hogwarts",
    description: "Who's who in the wizarding world.",
    category: "harry-potter",
    difficulty: 3,
    questions: [
      { text: "What is Hermione Granger's Patronus?", options: ["Cat", "Otter", "Hare", "Swan"], correctIndex: 1 },
      { text: "Who is the Half-Blood Prince?", options: ["Dumbledore", "Voldemort", "Snape", "Draco"], correctIndex: 2 },
      { text: "What is the name of Neville's toad?", options: ["Trevor", "Crookshanks", "Scabbers", "Arnold"], correctIndex: 0 },
      { text: "Which Weasley is the oldest?", options: ["Fred", "George", "Bill", "Charlie"], correctIndex: 2 },
      { text: "What subject does Sybill Trelawney teach?", options: ["Divination", "History of Magic", "Astronomy", "Arithmancy"], correctIndex: 0 },
    ],
  },
  {
    title: "Deathly Hallows",
    description: "The final chapters of the story.",
    category: "harry-potter",
    difficulty: 4,
    questions: [
      { text: "What are the three Deathly Hallows?", options: ["Wand, Ring, Cloak", "Wand, Stone, Cloak", "Stone, Ring, Wand", "Cloak, Ring, Sword"], correctIndex: 1 },
      { text: "Who originally owned the Elder Wand before Dumbledore?", options: ["Grindelwald", "Voldemort", "Antioch Peverell", "Flamel"], correctIndex: 2 },
      { text: "How does Harry survive Voldemort's killing curse as a baby?", options: ["Magic shield", "His mother's sacrificial love", "The Elder Wand failed", "He was a Horcrux"], correctIndex: 1 },
      { text: "What is the final Horcrux Voldemort unknowingly created?", options: ["Nagini", "Harry himself", "Dumbledore's ring", "The diary"], correctIndex: 1 },
      { text: "Which spell does Harry use to defeat Voldemort in the final battle?", options: ["Avada Kedavra", "Stupefy", "Expelliarmus", "Reducto"], correctIndex: 2 },
    ],
  },
  {
    title: "Potter Expert",
    description: "Only true wizards can pass this.",
    category: "harry-potter",
    difficulty: 5,
    questions: [
      { text: "What is the incantation for the Imperius Curse?", options: ["Crucio", "Avada Kedavra", "Imperio", "Morsmordre"], correctIndex: 2 },
      { text: "What dragon did Harry face in the Triwizard Tournament?", options: ["Common Welsh Green", "Hebridean Black", "Hungarian Horntail", "Swedish Short-Snout"], correctIndex: 2 },
      { text: "What is the name of the Marauder who was secretly a Death Eater?", options: ["Remus Lupin", "Sirius Black", "Peter Pettigrew", "James Potter"], correctIndex: 2 },
      { text: "Which Hogwarts ghost was once the Fat Friar?", options: ["Hufflepuff ghost", "Slytherin ghost", "Ravenclaw ghost", "Gryffindor ghost"], correctIndex: 0 },
      { text: "What is the core of Voldemort's wand?", options: ["Phoenix feather", "Dragon heartstring", "Unicorn hair", "Basilisk fang"], correctIndex: 0 },
    ],
  },

  // ── TECHNOLOGY ────────────────────────────────────────────────
  {
    title: "Tech Basics",
    description: "Digital literacy fundamentals.",
    category: "technology",
    difficulty: 1,
    questions: [
      { text: "What does CPU stand for?", options: ["Computer Processing Unit", "Central Processing Unit", "Core Processing Unit", "Control Processing Unit"], correctIndex: 1 },
      { text: "What does 'WWW' stand for?", options: ["Wide Web World", "World Wide Web", "Web World Wide", "World Web Wide"], correctIndex: 1 },
      { text: "Which company made the iPhone?", options: ["Samsung", "Google", "Apple", "Microsoft"], correctIndex: 2 },
      { text: "What is the most popular programming language for web browsers?", options: ["Python", "Java", "JavaScript", "C++"], correctIndex: 2 },
      { text: "How many bits are in one byte?", options: ["4", "6", "8", "16"], correctIndex: 2 },
    ],
  },
  {
    title: "Internet & Networks",
    description: "How the internet really works.",
    category: "technology",
    difficulty: 2,
    questions: [
      { text: "What does HTTP stand for?", options: ["HyperText Transfer Protocol", "HyperText Text Protocol", "High Transfer Text Protocol", "Host Transfer Protocol"], correctIndex: 0 },
      { text: "What is an IP address?", options: ["A website name", "A unique network identifier", "A type of cable", "A computer brand"], correctIndex: 1 },
      { text: "What does DNS stand for?", options: ["Digital Name System", "Domain Name System", "Data Node System", "Device Network Service"], correctIndex: 1 },
      { text: "What port does HTTPS use by default?", options: ["80", "443", "8080", "21"], correctIndex: 1 },
      { text: "What is a firewall?", options: ["A physical wall", "A network security system", "A type of antivirus", "A modem"], correctIndex: 1 },
    ],
  },
  {
    title: "Programming Concepts",
    description: "Core software development knowledge.",
    category: "technology",
    difficulty: 3,
    questions: [
      { text: "What is a 'null' value?", options: ["Zero", "An error", "The absence of a value", "An empty string"], correctIndex: 2 },
      { text: "What does OOP stand for?", options: ["Object Oriented Programming", "Object Operational Programming", "Open Oriented Programming", "Objective Order Protocol"], correctIndex: 0 },
      { text: "What is a 'function' in programming?", options: ["A variable", "A reusable block of code", "A loop", "A comment"], correctIndex: 1 },
      { text: "What does 'API' stand for?", options: ["Application Programming Interface", "Applied Program Integration", "Automated Process Interface", "Advanced Protocol Index"], correctIndex: 0 },
      { text: "Which data structure uses LIFO order?", options: ["Queue", "Heap", "Stack", "Tree"], correctIndex: 2 },
    ],
  },
  {
    title: "Databases & Cloud",
    description: "Modern data infrastructure knowledge.",
    category: "technology",
    difficulty: 4,
    questions: [
      { text: "What does SQL stand for?", options: ["Simple Query Language", "Structured Query Language", "Standard Queue Logic", "Server Query Layer"], correctIndex: 1 },
      { text: "What is a NoSQL database?", options: ["A relational database", "A non-relational database", "SQL without joins", "A graph DB only"], correctIndex: 1 },
      { text: "What does AWS stand for?", options: ["Advanced Web Services", "Amazon Web Services", "Automated Web System", "Applied Web Server"], correctIndex: 1 },
      { text: "What is 'containerisation' in computing?", options: ["Backup storage", "Network routing", "OS-level virtualization", "Hard drive formatting"], correctIndex: 2 },
      { text: "What is a CDN?", options: ["Central Data Network", "Content Delivery Network", "Cloud Data Node", "Core Distribution Node"], correctIndex: 1 },
    ],
  },
  {
    title: "AI & Cybersecurity",
    description: "Cutting edge tech for experts.",
    category: "technology",
    difficulty: 5,
    questions: [
      { text: "What does LLM stand for in AI?", options: ["Low Level Module", "Large Language Model", "Linear Logic Machine", "Layered Learning Mechanism"], correctIndex: 1 },
      { text: "What is a zero-day vulnerability?", options: ["A bug with no impact", "An unpatched exploit unknown to the vendor", "A failed update", "A network timeout"], correctIndex: 1 },
      { text: "What type of ML trains on unlabelled data?", options: ["Supervised", "Reinforcement", "Unsupervised", "Transfer"], correctIndex: 2 },
      { text: "What does 'HTTPS' protect against compared to HTTP?", options: ["Faster loading", "Man-in-the-middle attacks via encryption", "Ad blocking", "Caching"], correctIndex: 1 },
      { text: "What is a 'transformer' in AI context?", options: ["A power converter", "A neural network architecture using self-attention", "A data pipeline", "A GPU instruction"], correctIndex: 1 },
    ],
  },

  // ── AVENGERS ──────────────────────────────────────────────────
  {
    title: "Earth's Mightiest Heroes",
    description: "Start your Marvel journey.",
    category: "avengers",
    difficulty: 1,
    questions: [
      { text: "What is Tony Stark's hero name?", options: ["Thor", "Iron Man", "Captain America", "Hulk"], correctIndex: 1 },
      { text: "What colour is the Hulk?", options: ["Blue", "Red", "Green", "Grey"], correctIndex: 2 },
      { text: "Who can lift Thor's hammer?", options: ["Anyone strong enough", "Only Asgardians", "Only those deemed worthy", "Only gods"], correctIndex: 2 },
      { text: "What is the name of Thor's hammer?", options: ["Jarnbjorn", "Gungnir", "Mjolnir", "Stormbreaker"], correctIndex: 2 },
      { text: "Where is Black Widow from?", options: ["USA", "UK", "Russia", "Germany"], correctIndex: 2 },
    ],
  },
  {
    title: "Infinity Stones",
    description: "The power of all six stones.",
    category: "avengers",
    difficulty: 2,
    questions: [
      { text: "How many Infinity Stones are there?", options: ["4", "5", "6", "7"], correctIndex: 2 },
      { text: "What does the Time Stone do?", options: ["Reads minds", "Controls time", "Gives reality-warping power", "Grants limitless power"], correctIndex: 1 },
      { text: "Where was the Soul Stone hidden?", options: ["Asgard", "Wakanda", "Vormir", "Knowhere"], correctIndex: 2 },
      { text: "Who originally had the Mind Stone?", options: ["Iron Man", "Loki", "Thanos", "Vision"], correctIndex: 1 },
      { text: "What colour is the Time Stone?", options: ["Blue", "Purple", "Green", "Red"], correctIndex: 2 },
    ],
  },
  {
    title: "MCU Timeline",
    description: "Key events from across the MCU.",
    category: "avengers",
    difficulty: 3,
    questions: [
      { text: "Which film came first in the MCU?", options: ["Captain America", "Thor", "Iron Man", "The Incredible Hulk"], correctIndex: 2 },
      { text: "What is the name of the alien race Thanos commands?", options: ["Kree", "Skrulls", "Chitauri", "Outriders"], correctIndex: 2 },
      { text: "Where does the Battle of Wakanda take place?", options: ["New York", "Wakanda", "Asgard", "Titan"], correctIndex: 1 },
      { text: "Who snaps the stones to bring everyone back in Endgame?", options: ["Tony Stark", "Bruce Banner", "Thor", "Captain Marvel"], correctIndex: 1 },
      { text: "What year does the first Avengers movie take place?", options: ["2010", "2011", "2012", "2013"], correctIndex: 2 },
    ],
  },
  {
    title: "Villain Deep Dive",
    description: "The best heroes have the best villains.",
    category: "avengers",
    difficulty: 4,
    questions: [
      { text: "What is Thanos's homeworld?", options: ["Titan", "Asgard", "Knowhere", "Xandar"], correctIndex: 0 },
      { text: "Who created Ultron?", options: ["S.H.I.E.L.D.", "Tony Stark", "Bruce Banner", "Tony and Bruce together"], correctIndex: 3 },
      { text: "What is Loki the god of?", options: ["War", "Thunder", "Mischief", "Magic"], correctIndex: 2 },
      { text: "What is the name of the Black Order member who is the biggest?", options: ["Corvus Glaive", "Proxima Midnight", "Ebony Maw", "Cull Obsidian"], correctIndex: 3 },
      { text: "Which villain uses the Mandarin name in Iron Man 3?", options: ["Justin Hammer", "Aldrich Killian", "Ivan Vanko", "Obadiah Stane"], correctIndex: 1 },
    ],
  },
  {
    title: "Marvel Expert",
    description: "Only true Marvel scholars will pass.",
    category: "avengers",
    difficulty: 5,
    questions: [
      { text: "What is Tony Stark's AI assistant called in the original Iron Man?", options: ["Vision", "FRIDAY", "JARVIS", "HOMER"], correctIndex: 2 },
      { text: "What is the real name of the Ancient One?", options: ["Ching-Mae", "Yao", "Her name is never revealed", "Tal-Mei"], correctIndex: 2 },
      { text: "In what language does Thor communicate with Groot?", options: ["He can't", "Asgardian", "He learned Groot's language at school", "They use translation devices"], correctIndex: 2 },
      { text: "What is the name of the quantum realm vehicle in Endgame?", options: ["The Pym Machine", "Time Tunnel", "Quantum Van", "Scott's Van"], correctIndex: 2 },
      { text: "Which stone was Thanos unable to get in the main timeline of Infinity War?", options: ["Soul Stone", "Power Stone", "None — he got them all", "Mind Stone"], correctIndex: 2 },
    ],
  },

  // ── ARTISTS ───────────────────────────────────────────────────
  {
    title: "Art Basics",
    description: "Foundational art knowledge for all.",
    category: "artists",
    difficulty: 1,
    questions: [
      { text: "Who painted the Mona Lisa?", options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Botticelli"], correctIndex: 2 },
      { text: "What are the three primary colours?", options: ["Red, Blue, Yellow", "Red, Green, Blue", "Yellow, Green, Blue", "Orange, Purple, Green"], correctIndex: 0 },
      { text: "Who painted the Sistine Chapel ceiling?", options: ["Leonardo", "Raphael", "Michelangelo", "Caravaggio"], correctIndex: 2 },
      { text: "What is a 'canvas'?", options: ["A type of paint", "A surface for painting", "A type of brush", "A painting style"], correctIndex: 1 },
      { text: "Van Gogh famously cut off which body part?", options: ["Finger", "Nose", "Ear", "Thumb"], correctIndex: 2 },
    ],
  },
  {
    title: "Impressionism",
    description: "The art movement that changed everything.",
    category: "artists",
    difficulty: 2,
    questions: [
      { text: "Who painted 'Water Lilies'?", options: ["Renoir", "Degas", "Monet", "Manet"], correctIndex: 2 },
      { text: "Where did Impressionism originate?", options: ["Spain", "France", "Italy", "Netherlands"], correctIndex: 1 },
      { text: "Which artist is known for his ballet dancer paintings?", options: ["Monet", "Renoir", "Degas", "Pissarro"], correctIndex: 2 },
      { text: "What gave Impressionism its name?", options: ["A painting by Monet", "A critic's insult", "A gallery name", "A manifesto"], correctIndex: 1 },
      { text: "Who painted 'A Sunday on La Grande Jatte'?", options: ["Monet", "Renoir", "Seurat", "Sisley"], correctIndex: 2 },
    ],
  },
  {
    title: "Modern Art Masters",
    description: "From Picasso to Warhol.",
    category: "artists",
    difficulty: 3,
    questions: [
      { text: "Who founded Cubism?", options: ["Dalí", "Picasso", "Matisse", "Léger"], correctIndex: 1 },
      { text: "What is Andy Warhol famous for printing?", options: ["Money", "Campbell's Soup Cans", "Comic books", "Cars"], correctIndex: 1 },
      { text: "Which artist created the melting clocks painting?", options: ["Magritte", "Ernst", "Dalí", "Miró"], correctIndex: 2 },
      { text: "What movement did Frida Kahlo belong to?", options: ["Impressionism", "Cubism", "Surrealism", "Abstract Expressionism"], correctIndex: 2 },
      { text: "Which artist is known for his drip painting technique?", options: ["de Kooning", "Rothko", "Pollock", "Kline"], correctIndex: 2 },
    ],
  },
  {
    title: "Art History Scholar",
    description: "Deep dive into centuries of art.",
    category: "artists",
    difficulty: 4,
    questions: [
      { text: "What is 'chiaroscuro' in art?", options: ["A sculpture technique", "The use of light and dark contrast", "A colour theory", "A fresco method"], correctIndex: 1 },
      { text: "Who painted The School of Athens?", options: ["Da Vinci", "Michelangelo", "Raphael", "Botticelli"], correctIndex: 2 },
      { text: "What is the technique of applying thick paint called?", options: ["Glazing", "Impasto", "Sfumato", "Grisaille"], correctIndex: 1 },
      { text: "Which artist inspired the term 'Pointillism'?", options: ["Monet", "Seurat", "Signac", "Renoir"], correctIndex: 1 },
      { text: "What is the Uffizi?", options: ["A sculpture", "An art gallery in Florence", "A painting technique", "A Roman mosaic"], correctIndex: 1 },
    ],
  },
  {
    title: "Art Expert Challenge",
    description: "For the most dedicated art lovers.",
    category: "artists",
    difficulty: 5,
    questions: [
      { text: "What technique did da Vinci use to create soft transitions in skin tones?", options: ["Impasto", "Sfumato", "Chiaroscuro", "Grisaille"], correctIndex: 1 },
      { text: "Who painted 'The Birth of Venus'?", options: ["Raphael", "da Vinci", "Botticelli", "Titian"], correctIndex: 2 },
      { text: "What does 'Baroque' mean?", options: ["Bright", "Irregular pearl or odd-shaped", "Gold", "Dramatic"], correctIndex: 1 },
      { text: "In which city is the Rijksmuseum?", options: ["Brussels", "The Hague", "Amsterdam", "Rotterdam"], correctIndex: 2 },
      { text: "Which Rembrandt painting shows a group of militia men?", options: ["The Jewish Bride", "The Anatomy Lesson", "The Night Watch", "Self-Portrait"], correctIndex: 2 },
    ],
  },

  // ── MUSICIANS ─────────────────────────────────────────────────
  {
    title: "Music Basics",
    description: "Everyone knows these — do you?",
    category: "musicians",
    difficulty: 1,
    questions: [
      { text: "Who is known as the 'King of Pop'?", options: ["Elvis Presley", "Michael Jackson", "Prince", "Justin Timberlake"], correctIndex: 1 },
      { text: "What instrument does a pianist play?", options: ["Guitar", "Piano", "Violin", "Trumpet"], correctIndex: 1 },
      { text: "How many strings does a standard guitar have?", options: ["4", "5", "6", "7"], correctIndex: 2 },
      { text: "Which band sang 'Bohemian Rhapsody'?", options: ["Led Zeppelin", "The Beatles", "Queen", "Pink Floyd"], correctIndex: 2 },
      { text: "What does a conductor do?", options: ["Plays the drums", "Writes music", "Leads an orchestra", "Tunes instruments"], correctIndex: 2 },
    ],
  },
  {
    title: "Rock & Pop Icons",
    description: "The biggest names in music history.",
    category: "musicians",
    difficulty: 2,
    questions: [
      { text: "Which band had members John, Paul, George, and Ringo?", options: ["The Rolling Stones", "The Who", "The Beatles", "Led Zeppelin"], correctIndex: 2 },
      { text: "What is Elvis Presley's nickname?", options: ["The Duke", "The King", "The Rocker", "The Legend"], correctIndex: 1 },
      { text: "Who sang 'Like a Prayer'?", options: ["Whitney Houston", "Madonna", "Mariah Carey", "Janet Jackson"], correctIndex: 1 },
      { text: "Which artist released the album 'Thriller'?", options: ["Prince", "David Bowie", "Michael Jackson", "Stevie Wonder"], correctIndex: 2 },
      { text: "Who is 'Slim Shady'?", options: ["Jay-Z", "Eminem", "Kanye West", "50 Cent"], correctIndex: 1 },
    ],
  },
  {
    title: "Musical Theory",
    description: "The science and structure of music.",
    category: "musicians",
    difficulty: 3,
    questions: [
      { text: "How many notes are in an octave?", options: ["6", "7", "8", "12"], correctIndex: 2 },
      { text: "What does 'tempo' refer to?", options: ["Volume", "Pitch", "Speed of music", "Key signature"], correctIndex: 2 },
      { text: "What is the time signature 4/4 known as?", options: ["Waltz time", "Common time", "Cut time", "March time"], correctIndex: 1 },
      { text: "What does 'forte' mean in music?", options: ["Soft", "Slow", "Loud", "Fast"], correctIndex: 2 },
      { text: "How many keys does a standard piano have?", options: ["76", "85", "88", "92"], correctIndex: 2 },
    ],
  },
  {
    title: "Music Legends Deep Dive",
    description: "Harder questions about legendary musicians.",
    category: "musicians",
    difficulty: 4,
    questions: [
      { text: "Which guitar did Jimi Hendrix famously set on fire at Monterey?", options: ["Les Paul", "Fender Stratocaster", "Gibson SG", "Telecaster"], correctIndex: 1 },
      { text: "Which composer was deaf when he wrote his 9th Symphony?", options: ["Mozart", "Bach", "Beethoven", "Schubert"], correctIndex: 2 },
      { text: "What is the name of David Bowie's alien alter ego?", options: ["Major Tom", "Ziggy Stardust", "The Thin White Duke", "Aladdin Sane"], correctIndex: 1 },
      { text: "How many Grammys has Beyoncé won (as of 2024)?", options: ["28", "32", "34", "38"], correctIndex: 0 },
      { text: "What was the first No.1 single in the UK charts (1952)?", options: ["Be My Baby", "Here in My Heart", "Rock Around the Clock", "Crying"], correctIndex: 1 },
    ],
  },
  {
    title: "Music Mastermind",
    description: "Only music obsessives will ace this.",
    category: "musicians",
    difficulty: 5,
    questions: [
      { text: "What is the time signature of Dave Brubeck's 'Take Five'?", options: ["3/4", "4/4", "5/4", "7/8"], correctIndex: 2 },
      { text: "Which composer wrote 'The Four Seasons'?", options: ["Bach", "Handel", "Vivaldi", "Telemann"], correctIndex: 2 },
      { text: "What key is Beethoven's 5th Symphony in?", options: ["D minor", "G minor", "C minor", "A minor"], correctIndex: 2 },
      { text: "Who invented the synthesizer?", options: ["Robert Moog", "Alan Turing", "Thomas Edison", "Les Paul"], correctIndex: 0 },
      { text: "Which artist holds the record for most weeks at No.1 on the Billboard Hot 100?", options: ["Taylor Swift", "Mariah Carey", "Lil Nas X", "Ed Sheeran"], correctIndex: 2 },
    ],
  },

  // ── MATH ──────────────────────────────────────────────────────
  {
    title: "Number Fundamentals",
    description: "The basics of mathematics.",
    category: "math",
    difficulty: 1,
    questions: [
      { text: "What is 7 × 8?", options: ["54", "56", "58", "64"], correctIndex: 1 },
      { text: "What is the square root of 144?", options: ["10", "11", "12", "14"], correctIndex: 2 },
      { text: "What is 15% of 200?", options: ["25", "30", "35", "40"], correctIndex: 1 },
      { text: "What is the value of Pi to 2 decimal places?", options: ["3.12", "3.14", "3.16", "3.18"], correctIndex: 1 },
      { text: "What is 2 to the power of 10?", options: ["512", "1000", "1024", "2048"], correctIndex: 2 },
    ],
  },
  {
    title: "Algebra Intro",
    description: "Solve for x and beyond.",
    category: "math",
    difficulty: 2,
    questions: [
      { text: "If x + 5 = 12, what is x?", options: ["5", "6", "7", "8"], correctIndex: 2 },
      { text: "What is 3x if x = 4?", options: ["7", "10", "12", "14"], correctIndex: 2 },
      { text: "Simplify: 2(x + 3) = ?", options: ["2x + 3", "2x + 6", "x + 6", "2x + 5"], correctIndex: 1 },
      { text: "What is the slope in y = 2x + 1?", options: ["1", "2", "3", "0"], correctIndex: 1 },
      { text: "Solve: 4x = 20", options: ["4", "5", "6", "7"], correctIndex: 1 },
    ],
  },
  {
    title: "Geometry & Shapes",
    description: "Angles, areas, and more.",
    category: "math",
    difficulty: 3,
    questions: [
      { text: "What is the area of a circle with radius 5?", options: ["25π", "50π", "10π", "5π"], correctIndex: 0 },
      { text: "How many degrees in a triangle?", options: ["90", "180", "270", "360"], correctIndex: 1 },
      { text: "What is Pythagoras' theorem?", options: ["a+b=c", "a²+b²=c²", "a×b=c", "a²=b+c"], correctIndex: 1 },
      { text: "How many sides does a hexagon have?", options: ["5", "6", "7", "8"], correctIndex: 1 },
      { text: "What is the volume formula for a cylinder?", options: ["πr²", "πr²h", "2πrh", "πd²h"], correctIndex: 1 },
    ],
  },
  {
    title: "Calculus & Statistics",
    description: "Advanced mathematical thinking.",
    category: "math",
    difficulty: 4,
    questions: [
      { text: "What is the derivative of x²?", options: ["x", "2x", "x²", "2"], correctIndex: 1 },
      { text: "What is the integral of 2x?", options: ["2", "x²", "x² + C", "2x² + C"], correctIndex: 2 },
      { text: "What does 'mean' mean in statistics?", options: ["Most common value", "Middle value", "Average", "Range"], correctIndex: 2 },
      { text: "What is the formula for standard deviation based on?", options: ["Mean only", "Variance", "Mode", "Range"], correctIndex: 1 },
      { text: "What is the limit of (1/x) as x approaches infinity?", options: ["1", "0", "∞", "Undefined"], correctIndex: 1 },
    ],
  },
  {
    title: "Math Olympiad",
    description: "The hardest math questions for experts.",
    category: "math",
    difficulty: 5,
    questions: [
      { text: "What is Euler's identity?", options: ["e^iπ = 1", "e^iπ + 1 = 0", "e^π = 0", "e^i = -1"], correctIndex: 1 },
      { text: "What is the Riemann Hypothesis about?", options: ["Prime numbers and complex zeros of the zeta function", "Infinite series convergence", "Differential equations", "Topology"], correctIndex: 0 },
      { text: "How many primes are there less than 100?", options: ["20", "23", "25", "28"], correctIndex: 2 },
      { text: "What is the Fibonacci sequence rule?", options: ["Each term is double the previous", "Each term is the sum of the two before it", "Each term alternates +/−", "Each term is prime"], correctIndex: 1 },
      { text: "What is P vs NP?", options: ["A question about whether fast verification implies fast solving", "A theory about quantum computing", "A proof about infinity", "A calculus theorem"], correctIndex: 0 },
    ],
  },

  // ── SCIENCE ───────────────────────────────────────────────────
  {
    title: "Science Starter",
    description: "The basics every scientist should know.",
    category: "science",
    difficulty: 1,
    questions: [
      { text: "What gas do plants absorb?", options: ["Oxygen", "Hydrogen", "Carbon Dioxide", "Nitrogen"], correctIndex: 2 },
      { text: "What is H₂O?", options: ["Salt", "Water", "Acid", "Hydrogen gas"], correctIndex: 1 },
      { text: "What is the closest star to Earth?", options: ["Sirius", "Betelgeuse", "Proxima Centauri", "The Sun"], correctIndex: 3 },
      { text: "What is the process by which plants make food?", options: ["Respiration", "Photosynthesis", "Transpiration", "Fermentation"], correctIndex: 1 },
      { text: "How many chromosomes does a human cell have?", options: ["23", "44", "46", "48"], correctIndex: 2 },
    ],
  },
  {
    title: "Chemistry Foundations",
    description: "Elements, bonds, and reactions.",
    category: "science",
    difficulty: 2,
    questions: [
      { text: "What is the symbol for Gold?", options: ["Go", "Gd", "Ag", "Au"], correctIndex: 3 },
      { text: "How many elements are in the periodic table (as of 2024)?", options: ["110", "114", "118", "122"], correctIndex: 2 },
      { text: "What is the pH of pure water?", options: ["6", "7", "8", "9"], correctIndex: 1 },
      { text: "What type of bond shares electrons?", options: ["Ionic", "Covalent", "Metallic", "Hydrogen"], correctIndex: 1 },
      { text: "What is the atomic number of Carbon?", options: ["4", "6", "8", "12"], correctIndex: 1 },
    ],
  },
  {
    title: "Biology & Cells",
    description: "Life at the microscopic level.",
    category: "science",
    difficulty: 3,
    questions: [
      { text: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Vacuole"], correctIndex: 2 },
      { text: "What does DNA stand for?", options: ["Deoxyribonucleic Acid", "Deoxynucleo Acid", "Direct Nucleic Acid", "Deoxyribose Amino Acid"], correctIndex: 0 },
      { text: "Which blood type is the universal donor?", options: ["A", "B", "AB", "O"], correctIndex: 3 },
      { text: "What is osmosis?", options: ["Movement of water through a membrane", "Movement of solutes", "Protein synthesis", "Cell division"], correctIndex: 0 },
      { text: "What is meiosis?", options: ["Cell duplication", "Protein folding", "Cell division producing gametes", "Energy production"], correctIndex: 2 },
    ],
  },
  {
    title: "Science Deep Dive",
    description: "Advanced concepts across sciences.",
    category: "science",
    difficulty: 4,
    questions: [
      { text: "What is the speed of light (approx)?", options: ["200,000 km/s", "300,000 km/s", "400,000 km/s", "500,000 km/s"], correctIndex: 1 },
      { text: "What is a catalyst?", options: ["A product of a reaction", "A substance that speeds up a reaction without being consumed", "A type of element", "An inhibitor"], correctIndex: 1 },
      { text: "What is the Krebs cycle?", options: ["DNA replication", "Cellular respiration cycle", "Photosynthesis stage", "Protein synthesis"], correctIndex: 1 },
      { text: "What particle carries no electric charge?", options: ["Proton", "Electron", "Neutron", "Positron"], correctIndex: 2 },
      { text: "What does CRISPR do?", options: ["Sequences DNA", "Edits genes", "Replicates RNA", "Synthesizes proteins"], correctIndex: 1 },
    ],
  },
  {
    title: "Science Expert",
    description: "Frontier science — only for the best.",
    category: "science",
    difficulty: 5,
    questions: [
      { text: "What is the Higgs boson?", options: ["A type of dark matter", "A particle that gives mass to other particles", "A quantum state", "An anti-particle"], correctIndex: 1 },
      { text: "What is quantum entanglement?", options: ["Particle fusion", "When particles are linked regardless of distance", "Electron bonding", "Magnetic coupling"], correctIndex: 1 },
      { text: "What is the half-life of Carbon-14?", options: ["1,420 years", "5,730 years", "10,000 years", "14,000 years"], correctIndex: 1 },
      { text: "What is a quark?", options: ["A type of atom", "A fundamental particle in protons/neutrons", "A photon variant", "An electron type"], correctIndex: 1 },
      { text: "What is the name of the enzyme that unzips DNA?", options: ["Polymerase", "Ligase", "Helicase", "Topoisomerase"], correctIndex: 2 },
    ],
  },

  // ── FOOTBALL EXTRA ────────────────────────────────────────────
  {
    title: "Football Transfers & Records",
    description: "Mega-money moves and unbeatable records.",
    category: "football",
    difficulty: 3,
    questions: [
      { text: "Who was the most expensive football transfer of all time (as of 2024)?", options: ["Neymar", "Kylian Mbappe", "Antoine Griezmann", "Joao Felix"], correctIndex: 0 },
      { text: "Which club sold Neymar to PSG for €222m?", options: ["Real Madrid", "Barcelona", "Santos", "Fluminense"], correctIndex: 1 },
      { text: "Who won the Ballon d'Or in 2023?", options: ["Erling Haaland", "Kylian Mbappe", "Lionel Messi", "Vinicius Jr"], correctIndex: 2 },
      { text: "Which player holds the record for most international goals (as of 2024)?", options: ["Cristiano Ronaldo", "Lionel Messi", "Ali Daei", "Pele"], correctIndex: 0 },
      { text: "Which club has appeared in the most Champions League finals?", options: ["Barcelona", "Bayern Munich", "AC Milan", "Real Madrid"], correctIndex: 3 },
      { text: "Who holds the Premier League record for goals in a single season?", options: ["Wayne Rooney", "Harry Kane", "Mo Salah", "Alan Shearer"], correctIndex: 2 },
      { text: "Which country won Euro 2020 (played in 2021)?", options: ["England", "France", "Italy", "Spain"], correctIndex: 2 },
      { text: "Who is the all-time top scorer in Champions League history?", options: ["Messi", "Ronaldo", "Raul", "Benzema"], correctIndex: 1 },
      { text: "How many times has Ronaldo won the Champions League?", options: ["3", "4", "5", "6"], correctIndex: 2 },
      { text: "Which manager has won the most Premier League titles?", options: ["Pep Guardiola", "Jose Mourinho", "Arsene Wenger", "Alex Ferguson"], correctIndex: 3 },
    ],
  },
  {
    title: "Euro Cup Special",
    description: "All about the UEFA European Championship.",
    category: "football",
    difficulty: 4,
    questions: [
      { text: "Which country has won the most European Championships?", options: ["Germany", "Spain", "France", "Italy"], correctIndex: 1 },
      { text: "In which year was the first European Championship held?", options: ["1956", "1960", "1964", "1968"], correctIndex: 1 },
      { text: "Who scored the winning goal in the Euro 2016 final?", options: ["Cristiano Ronaldo", "Eder", "Renato Sanches", "Nani"], correctIndex: 1 },
      { text: "Which country hosted Euro 2016?", options: ["Germany", "Spain", "France", "Poland"], correctIndex: 2 },
      { text: "How often is the European Championship held?", options: ["Every 2 years", "Every 3 years", "Every 4 years", "Every 5 years"], correctIndex: 2 },
      { text: "Which player holds the record for most goals in European Championship history (as of 2024)?", options: ["Michel Platini", "Cristiano Ronaldo", "Alan Shearer", "Jurgen Klinsmann"], correctIndex: 1 },
      { text: "Which country beat England in the Euro 2020 final?", options: ["Spain", "France", "Italy", "Germany"], correctIndex: 2 },
      { text: "Who was the Golden Boot winner at Euro 2020?", options: ["Romelu Lukaku", "Patrik Schick", "Cristiano Ronaldo", "Emil Forsberg"], correctIndex: 2 },
      { text: "Denmark won the European Championship in which year despite qualifying as a last-minute replacement?", options: ["1988", "1992", "1996", "2000"], correctIndex: 1 },
      { text: "Which British nation has never qualified for the European Championship?", options: ["Scotland", "Wales", "Northern Ireland", "Republic of Ireland"], correctIndex: 2 },
    ],
  },

  // ── CRICKET EXTRA ─────────────────────────────────────────────
  {
    title: "IPL Knowledge",
    description: "All about the Indian Premier League.",
    category: "cricket",
    difficulty: 2,
    questions: [
      { text: "In which year was the IPL founded?", options: ["2006", "2007", "2008", "2009"], correctIndex: 2 },
      { text: "Which team has won the most IPL titles (as of 2024)?", options: ["Mumbai Indians", "Chennai Super Kings", "Kolkata Knight Riders", "Royal Challengers Bangalore"], correctIndex: 0 },
      { text: "Who is the all-time leading run-scorer in IPL history?", options: ["Rohit Sharma", "Virat Kohli", "Suresh Raina", "David Warner"], correctIndex: 1 },
      { text: "Who is the all-time leading wicket-taker in IPL history?", options: ["Lasith Malinga", "Amit Mishra", "Dwayne Bravo", "Yuzvendra Chahal"], correctIndex: 2 },
      { text: "How many overs are in each IPL innings?", options: ["15", "20", "25", "50"], correctIndex: 1 },
      { text: "Which IPL team is based in Bangalore?", options: ["Sunrisers Hyderabad", "Royal Challengers Bangalore", "Delhi Capitals", "Punjab Kings"], correctIndex: 1 },
      { text: "Who won the inaugural IPL in 2008?", options: ["Mumbai Indians", "Chennai Super Kings", "Rajasthan Royals", "Kolkata Knight Riders"], correctIndex: 2 },
      { text: "Which player hit the most sixes in a single IPL season?", options: ["AB de Villiers", "Chris Gayle", "Rohit Sharma", "MS Dhoni"], correctIndex: 1 },
      { text: "What is the maximum score ever recorded in an IPL innings?", options: ["235", "243", "263", "277"], correctIndex: 2 },
      { text: "Which IPL team's jersey is yellow?", options: ["Mumbai Indians", "Rajasthan Royals", "Chennai Super Kings", "Lucknow Super Giants"], correctIndex: 2 },
    ],
  },
  {
    title: "Cricket Records & Stats",
    description: "Incredible numbers and record-breaking performances.",
    category: "cricket",
    difficulty: 4,
    questions: [
      { text: "Who holds the record for the highest individual Test score?", options: ["Don Bradman", "Brian Lara", "Garfield Sobers", "Sachin Tendulkar"], correctIndex: 1 },
      { text: "What was Brian Lara's record Test score?", options: ["375", "400", "411", "425"], correctIndex: 1 },
      { text: "Who has scored the most runs in Test cricket history?", options: ["Ricky Ponting", "Brian Lara", "Sachin Tendulkar", "Kumar Sangakkara"], correctIndex: 2 },
      { text: "Who took the most wickets in Test cricket?", options: ["Shane Warne", "Muttiah Muralitharan", "Anil Kumble", "Glenn McGrath"], correctIndex: 1 },
      { text: "Which country has won the most Cricket World Cups?", options: ["India", "Australia", "West Indies", "England"], correctIndex: 1 },
      { text: "What is a 'duck' in cricket?", options: ["A wide delivery", "A score of zero", "A no-ball", "Hitting the boundary"], correctIndex: 1 },
      { text: "How many runs is a six worth?", options: ["4", "5", "6", "7"], correctIndex: 2 },
      { text: "Who was known as 'The Don'?", options: ["Shane Warne", "Don Bradman", "Donald Faulkner", "Dennis Lillee"], correctIndex: 1 },
      { text: "What was Don Bradman's batting average in Tests?", options: ["82.43", "89.98", "95.14", "99.94"], correctIndex: 3 },
      { text: "Which team won the 2023 Cricket World Cup?", options: ["Australia", "India", "South Africa", "England"], correctIndex: 0 },
    ],
  },

  // ── HARRY POTTER EXTRA ─────────────────────────────────────────
  {
    title: "Hogwarts Classes & Spells",
    description: "From Charms to Defense Against the Dark Arts.",
    category: "harry-potter",
    difficulty: 2,
    questions: [
      { text: "What spell unlocks doors?", options: ["Expelliarmus", "Alohomora", "Lumos", "Accio"], correctIndex: 1 },
      { text: "Who teaches Transfiguration at Hogwarts?", options: ["Snape", "Dumbledore", "McGonagall", "Flitwick"], correctIndex: 2 },
      { text: "What does 'Lumos' do?", options: ["Unlocks doors", "Creates light", "Levitates objects", "Disarms opponents"], correctIndex: 1 },
      { text: "Which spell disarms an opponent?", options: ["Stupefy", "Reducto", "Expelliarmus", "Petrificus Totalus"], correctIndex: 2 },
      { text: "What is the charm to summon objects?", options: ["Reparo", "Accio", "Wingardium Leviosa", "Alohomora"], correctIndex: 1 },
      { text: "Who is the Potions teacher when Harry first arrives at Hogwarts?", options: ["Slughorn", "Snape", "Quirrell", "Umbridge"], correctIndex: 1 },
      { text: "What spell creates a Patronus?", options: ["Expecto Patronum", "Expelliarmus", "Riddikulus", "Lumos"], correctIndex: 0 },
      { text: "Which class teaches students to fight magical creatures?", options: ["Charms", "Care of Magical Creatures", "Herbology", "Divination"], correctIndex: 1 },
      { text: "What plant strangles intruders in Herbology?", options: ["Mandrake", "Devil's Snare", "Whomping Willow", "Venomous Tentacula"], correctIndex: 1 },
      { text: "What does 'Wingardium Leviosa' do?", options: ["Repels dementors", "Levitates objects", "Unlocks doors", "Creates fire"], correctIndex: 1 },
    ],
  },
  {
    title: "Dark Arts & Voldemort",
    description: "The shadow side of the wizarding world.",
    category: "harry-potter",
    difficulty: 4,
    questions: [
      { text: "What is Voldemort's real name?", options: ["Tom Marvolo Riddle", "Tom Edward Riddle", "Thomas Marvolo Riddle", "Tom Morfin Gaunt"], correctIndex: 0 },
      { text: "How many Horcruxes did Voldemort create?", options: ["5", "6", "7", "8"], correctIndex: 2 },
      { text: "Which Horcrux was destroyed by Dumbledore?", options: ["Nagini", "The Diary", "The Ring", "The Cup"], correctIndex: 2 },
      { text: "What creature was Nagini before becoming a Horcrux?", options: ["A basilisk", "A common snake", "She was always a Horcrux", "A Maledictus"], correctIndex: 3 },
      { text: "What spell kills instantly?", options: ["Crucio", "Avada Kedavra", "Imperio", "Sectumsempra"], correctIndex: 1 },
      { text: "Who was the Half-Blood Prince?", options: ["Dumbledore", "Voldemort", "Snape", "Lupin"], correctIndex: 2 },
      { text: "Which Death Eater betrayed the Potters?", options: ["Lucius Malfoy", "Peter Pettigrew", "Bellatrix Lestrange", "Barty Crouch Jr"], correctIndex: 1 },
      { text: "What is the name of Voldemort's wand wood?", options: ["Holly", "Elder", "Yew", "Ash"], correctIndex: 2 },
      { text: "Which living being is revealed to be a Horcrux?", options: ["Nagini", "Harry himself", "The Sorting Hat", "Fawkes"], correctIndex: 1 },
      { text: "What was the name of Voldemort's snake?", options: ["Norbert", "Nag", "Nagini", "Serpentine"], correctIndex: 2 },
    ],
  },

  // ── TECHNOLOGY EXTRA ───────────────────────────────────────────
  {
    title: "Internet & Networking",
    description: "How the web works under the hood.",
    category: "technology",
    difficulty: 2,
    questions: [
      { text: "What does HTTP stand for?", options: ["HyperText Transfer Protocol", "High Transfer Text Program", "Hyperlink Tool Transfer Protocol", "HyperText Tunnel Protocol"], correctIndex: 0 },
      { text: "What does DNS stand for?", options: ["Domain Name System", "Data Network Service", "Distributed Network Server", "Domain Network Service"], correctIndex: 0 },
      { text: "What is an IP address?", options: ["A website's password", "A unique numerical label for a device on a network", "An internet service provider code", "A type of programming language"], correctIndex: 1 },
      { text: "What does SSL/TLS do?", options: ["Speeds up websites", "Encrypts data in transit", "Blocks advertisements", "Compresses files"], correctIndex: 1 },
      { text: "What is the purpose of a firewall?", options: ["To cool down servers", "To block unauthorized network access", "To increase bandwidth", "To store backups"], correctIndex: 1 },
      { text: "What does TCP stand for?", options: ["Transfer Control Protocol", "Transmission Control Protocol", "Text Communication Protocol", "Total Connection Protocol"], correctIndex: 1 },
      { text: "What is the standard port for HTTPS?", options: ["80", "443", "8080", "22"], correctIndex: 1 },
      { text: "What is latency in networking?", options: ["Data transfer speed", "The delay before data transfer begins", "Packet loss percentage", "Bandwidth capacity"], correctIndex: 1 },
      { text: "What is a VPN used for?", options: ["Speeding up internet", "Creating a private encrypted tunnel over the internet", "Blocking websites", "Managing DNS"], correctIndex: 1 },
      { text: "What is the loopback IP address?", options: ["192.168.0.1", "0.0.0.0", "127.0.0.1", "255.255.255.0"], correctIndex: 2 },
    ],
  },
  {
    title: "AI & Machine Learning",
    description: "The technology shaping the future.",
    category: "technology",
    difficulty: 4,
    questions: [
      { text: "What does GPT stand for?", options: ["Generative Pre-trained Transformer", "General Purpose Technology", "Graph Processing Tensor", "Generative Programming Tool"], correctIndex: 0 },
      { text: "What is supervised learning?", options: ["Training with labelled data", "Training without labels", "Reinforcement-based training", "Training with unlabelled clusters"], correctIndex: 0 },
      { text: "What is a neural network inspired by?", options: ["Computer circuits", "The human brain", "Biological DNA", "Quantum physics"], correctIndex: 1 },
      { text: "What does 'overfitting' mean in ML?", options: ["Model is too simple", "Model performs well on training but poorly on new data", "Model has too many layers", "Model trains too slowly"], correctIndex: 1 },
      { text: "What is backpropagation?", options: ["Reversing model predictions", "Algorithm to update weights by propagating error backwards", "A data preprocessing step", "Undoing gradient descent"], correctIndex: 1 },
      { text: "What is a Large Language Model (LLM)?", options: ["A database for language processing", "A deep learning model trained on vast text to generate language", "A compiler for programming languages", "A type of search engine"], correctIndex: 1 },
      { text: "What is the 'Turing Test'?", options: ["A speed benchmark for computers", "A test of whether a machine can exhibit intelligent behaviour indistinguishable from a human", "A programming language evaluation", "A security protocol"], correctIndex: 1 },
      { text: "What does CNN stand for in deep learning?", options: ["Convolutional Neural Network", "Connected Node Network", "Cyclic Neural Node", "Computational Node Network"], correctIndex: 0 },
      { text: "Which company created ChatGPT?", options: ["Google", "Meta", "OpenAI", "Microsoft"], correctIndex: 2 },
      { text: "What is 'gradient descent'?", options: ["A method to increase model accuracy", "An optimization algorithm to minimize a loss function", "A feature selection technique", "A neural network architecture"], correctIndex: 1 },
    ],
  },

  // ── AVENGERS EXTRA ─────────────────────────────────────────────
  {
    title: "MCU Origins",
    description: "How Earth's mightiest heroes came to be.",
    category: "avengers",
    difficulty: 2,
    questions: [
      { text: "What was the first MCU film?", options: ["Thor", "Captain America", "Iron Man", "The Hulk"], correctIndex: 2 },
      { text: "What element did Tony Stark create for his arc reactor?", options: ["Vibranium", "Palladium", "A new unnamed element", "Adamantium"], correctIndex: 2 },
      { text: "Where does Steve Rogers grow up?", options: ["New York", "Brooklyn", "Queens", "Manhattan"], correctIndex: 1 },
      { text: "Who created Thor's hammer Mjolnir?", options: ["Odin", "The Dwarves of Nidavellir", "Thor himself", "Loki"], correctIndex: 1 },
      { text: "What is Bruce Banner's alter ego?", options: ["Iron Man", "The Hulk", "The Thing", "Goliath"], correctIndex: 1 },
      { text: "What accident gave Bruce Banner his powers?", options: ["Cosmic ray exposure", "Gamma radiation", "Super soldier serum", "Spider venom"], correctIndex: 1 },
      { text: "What is the name of Tony Stark's AI assistant?", options: ["JARVIS", "FRIDAY", "EDITH", "HOMER"], correctIndex: 0 },
      { text: "On which continent is Wakanda located in the MCU?", options: ["Asia", "South America", "Africa", "It is in a dimension"], correctIndex: 2 },
      { text: "What is Black Widow's real name?", options: ["Wanda Romanoff", "Natasha Romanoff", "Yelena Belova", "Natalia Stark"], correctIndex: 1 },
      { text: "Which Infinity Stone is located in Vision's forehead?", options: ["Space Stone", "Reality Stone", "Mind Stone", "Soul Stone"], correctIndex: 2 },
    ],
  },
  {
    title: "Infinity Stones & Thanos",
    description: "The greatest threat the Avengers ever faced.",
    category: "avengers",
    difficulty: 4,
    questions: [
      { text: "What is the name of Thanos's home world?", options: ["Asgard", "Titan", "Xandar", "Sakaar"], correctIndex: 1 },
      { text: "Which stone is located on Vormir?", options: ["Power Stone", "Time Stone", "Soul Stone", "Reality Stone"], correctIndex: 2 },
      { text: "What sacrifice is required to get the Soul Stone?", options: ["Wealth", "Power", "A soul for a soul", "Time"], correctIndex: 2 },
      { text: "Who does Thanos sacrifice to get the Soul Stone?", options: ["Nebula", "Gamora", "Wanda", "His army"], correctIndex: 1 },
      { text: "What are the six Infinity Stones?", options: ["Mind, Space, Soul, Time, Reality, Power", "Mind, Space, Soul, Energy, Reality, Death", "Mind, Space, Soul, Time, Reality, Life", "Mind, Space, Soul, Time, Matter, Power"], correctIndex: 0 },
      { text: "Who wielded the gauntlet to reverse the Snap in Endgame?", options: ["Iron Man", "Thor", "Hulk", "Captain America"], correctIndex: 2 },
      { text: "What is the Time Stone also called?", options: ["Eye of Agamotto", "Eye of Vishanti", "Eye of Marduk", "Tesseract"], correctIndex: 0 },
      { text: "Which character says 'I am inevitable'?", options: ["Loki", "Thanos", "Ultron", "Ronan"], correctIndex: 1 },
      { text: "In which year (in-universe) does Avengers: Endgame's time travel begin?", options: ["2010", "2012", "2014", "2018"], correctIndex: 1 },
      { text: "What does Tony Stark say before his final snap?", options: ["'I love you 3000'", "'Avengers, assemble'", "'I am Iron Man'", "'We are Groot'"], correctIndex: 2 },
    ],
  },

  // ── ARTISTS EXTRA ──────────────────────────────────────────────
  {
    title: "Modern Art",
    description: "From Picasso to Banksy.",
    category: "artists",
    difficulty: 2,
    questions: [
      { text: "Who painted 'Guernica'?", options: ["Dali", "Picasso", "Miro", "Matisse"], correctIndex: 1 },
      { text: "What art movement is Picasso associated with?", options: ["Surrealism", "Impressionism", "Cubism", "Expressionism"], correctIndex: 2 },
      { text: "Who is the anonymous street artist known for political works?", options: ["Damien Hirst", "Banksy", "Jean-Michel Basquiat", "Keith Haring"], correctIndex: 1 },
      { text: "What is Andy Warhol's most famous subject matter?", options: ["Landscapes", "Campbell's soup cans and celebrities", "Abstract shapes", "Animals"], correctIndex: 1 },
      { text: "What art movement did Salvador Dali belong to?", options: ["Cubism", "Surrealism", "Impressionism", "Abstract Expressionism"], correctIndex: 1 },
      { text: "Which painting by Edvard Munch shows a figure screaming?", options: ["The Persistence of Memory", "Nighthawks", "The Scream", "Water Lilies"], correctIndex: 2 },
      { text: "Jackson Pollock is associated with which art style?", options: ["Pop Art", "Action Painting / Abstract Expressionism", "Minimalism", "Cubism"], correctIndex: 1 },
      { text: "Where is the Guggenheim Museum located?", options: ["Paris", "Berlin", "New York", "Rome"], correctIndex: 2 },
      { text: "Who created the Campbell's Soup Cans artwork?", options: ["Roy Lichtenstein", "Andy Warhol", "Jasper Johns", "Robert Rauschenberg"], correctIndex: 1 },
      { text: "What was Frida Kahlo's nationality?", options: ["Spanish", "Argentine", "Mexican", "Colombian"], correctIndex: 2 },
    ],
  },
  {
    title: "Art Movements",
    description: "The big ideas that changed art history.",
    category: "artists",
    difficulty: 4,
    questions: [
      { text: "Which movement rejected traditional art and celebrated absurdity?", options: ["Futurism", "Dadaism", "Cubism", "Surrealism"], correctIndex: 1 },
      { text: "In what year did the Impressionist movement begin (first exhibition)?", options: ["1864", "1870", "1874", "1880"], correctIndex: 2 },
      { text: "Which artist is considered the father of modern art?", options: ["Monet", "Cézanne", "Van Gogh", "Degas"], correctIndex: 1 },
      { text: "What is 'Trompe-l'oeil'?", options: ["A style of sculpture", "A technique that creates optical illusion of 3D", "A type of fresco", "A minimalist style"], correctIndex: 1 },
      { text: "The Pre-Raphaelites wanted to return to art before which painter?", options: ["Michelangelo", "Raphael", "Leonardo", "Titian"], correctIndex: 1 },
      { text: "Which movement valued pure form and primary colours (Mondrian's style)?", options: ["De Stijl", "Fauvism", "Constructivism", "Suprematism"], correctIndex: 0 },
      { text: "What country did the Bauhaus school originate from?", options: ["France", "Italy", "Germany", "Russia"], correctIndex: 2 },
      { text: "Fauvism is named after the French word for what?", options: ["Wild beasts", "Bright colours", "Abstract forms", "Free brushwork"], correctIndex: 0 },
      { text: "Which artist created the concept of 'readymades' (everyday objects as art)?", options: ["Picasso", "Marcel Duchamp", "Man Ray", "Francis Picabia"], correctIndex: 1 },
      { text: "The Aesthetic Movement's motto was?", options: ["Art for the people", "Art for art's sake", "Art imitates life", "Art as protest"], correctIndex: 1 },
    ],
  },

  // ── MUSICIANS EXTRA ─────────────────────────────────────────────
  {
    title: "Indian Music",
    description: "Bollywood, classical, and beyond.",
    category: "musicians",
    difficulty: 2,
    questions: [
      { text: "Who composed the music for the film 'Sholay'?", options: ["A.R. Rahman", "R.D. Burman", "S.D. Burman", "Laxmikant-Pyarelal"], correctIndex: 1 },
      { text: "Which Indian musician won an Academy Award for 'Jai Ho'?", options: ["Ustad Zakir Hussain", "A.R. Rahman", "Shankar-Ehsaan-Loy", "Vishal-Shekhar"], correctIndex: 1 },
      { text: "What is a 'raga' in Indian classical music?", options: ["A type of drum", "A melodic framework", "A rhythmic cycle", "A type of instrument"], correctIndex: 1 },
      { text: "Who is known as the 'Maestro' of Indian classical music (sitar)?", options: ["Ustad Zakir Hussain", "Ravi Shankar", "Bismillah Khan", "Hariprasad Chaurasia"], correctIndex: 1 },
      { text: "Which percussion instrument is central to Indian classical music?", options: ["Dhol", "Tabla", "Dholak", "Mridangam"], correctIndex: 1 },
      { text: "What is a 'taal' in Indian music?", options: ["A melodic phrase", "A rhythmic cycle", "A type of stringed instrument", "A musical scale"], correctIndex: 1 },
      { text: "Lata Mangeshkar was famous for being what?", options: ["A sitar player", "A playback singer", "A music composer", "A tabla maestro"], correctIndex: 1 },
      { text: "Which Indian film industry is the largest by output?", options: ["Bollywood", "Tollywood", "Kollywood", "Sandalwood"], correctIndex: 0 },
      { text: "What instrument does Ustad Zakir Hussain play?", options: ["Sitar", "Flute", "Tabla", "Sarod"], correctIndex: 2 },
      { text: "Which city is considered the home of Carnatic music?", options: ["Mumbai", "Delhi", "Chennai", "Kolkata"], correctIndex: 2 },
    ],
  },
  {
    title: "Grammy Records",
    description: "The world's biggest music awards.",
    category: "musicians",
    difficulty: 4,
    questions: [
      { text: "Who has won the most Grammys of all time (as of 2024)?", options: ["Stevie Wonder", "Beyonce", "Georg Solti", "Paul McCartney"], correctIndex: 1 },
      { text: "In which year were the first Grammy Awards held?", options: ["1955", "1959", "1963", "1967"], correctIndex: 1 },
      { text: "What does GRAMMY stand for?", options: ["Gramophone Award for Music and Media Years", "Grammy Recording Award Membership", "Gramophone Award", "Grand Recording Award for Melody and Music Years"], correctIndex: 2 },
      { text: "Which album won Album of the Year in 2024?", options: ["Midnights", "Folklore", "SOS", "Midnights (3am Edition)"], correctIndex: 0 },
      { text: "Who was the first rapper to win a Grammy Album of the Year?", options: ["Jay-Z", "Kanye West", "Outkast", "Kendrick Lamar"], correctIndex: 3 },
      { text: "How many major Grammy categories make up the 'Big Four'?", options: ["3", "4", "5", "6"], correctIndex: 1 },
      { text: "Which artist famously interrupted Taylor Swift's speech at the VMAs (not Grammys but music history)?", options: ["Jay-Z", "Kanye West", "Drake", "Lil Wayne"], correctIndex: 1 },
      { text: "Adele won 6 Grammys in one night in which year?", options: ["2009", "2012", "2013", "2017"], correctIndex: 1 },
      { text: "Which classical conductor holds the record for most Grammys won?", options: ["Herbert von Karajan", "Leonard Bernstein", "Georg Solti", "Claudio Abbado"], correctIndex: 2 },
      { text: "Who won Best New Artist at the 2020 Grammys?", options: ["Olivia Rodrigo", "Billie Eilish", "Lizzo", "H.E.R."], correctIndex: 1 },
    ],
  },

  // ── MATH EXTRA ─────────────────────────────────────────────────
  {
    title: "Number Theory",
    description: "Properties of numbers and their relationships.",
    category: "math",
    difficulty: 3,
    questions: [
      { text: "What is a prime number?", options: ["Divisible by 2", "Has no divisors other than 1 and itself", "Is always odd", "Is always greater than 10"], correctIndex: 1 },
      { text: "What is the largest prime number less than 20?", options: ["17", "18", "19", "16"], correctIndex: 2 },
      { text: "What is the GCD of 24 and 36?", options: ["6", "8", "12", "18"], correctIndex: 2 },
      { text: "What is the LCM of 4 and 6?", options: ["8", "12", "16", "24"], correctIndex: 1 },
      { text: "Is 1 a prime number?", options: ["Yes", "No", "Sometimes", "Depends on context"], correctIndex: 1 },
      { text: "What is the sum of first 10 natural numbers?", options: ["45", "50", "55", "60"], correctIndex: 2 },
      { text: "What is 0! (zero factorial)?", options: ["0", "1", "Undefined", "Infinity"], correctIndex: 1 },
      { text: "What is the next prime after 11?", options: ["12", "13", "14", "15"], correctIndex: 1 },
      { text: "What type of number is √2?", options: ["Rational", "Integer", "Irrational", "Complex"], correctIndex: 2 },
      { text: "What is Goldbach's conjecture?", options: ["Every even number > 2 is the sum of two primes", "Every odd number is prime", "Every prime is odd", "There are infinitely many twin primes"], correctIndex: 0 },
    ],
  },
  {
    title: "Probability & Combinatorics",
    description: "Counting, chance, and combinations.",
    category: "math",
    difficulty: 4,
    questions: [
      { text: "What is the probability of rolling a 6 on a fair die?", options: ["1/3", "1/4", "1/6", "1/8"], correctIndex: 2 },
      { text: "How many ways can you arrange 3 items?", options: ["3", "6", "9", "12"], correctIndex: 1 },
      { text: "What is 5! (5 factorial)?", options: ["60", "100", "120", "240"], correctIndex: 2 },
      { text: "What is C(5,2) (5 choose 2)?", options: ["5", "8", "10", "20"], correctIndex: 2 },
      { text: "If P(A) = 0.4 and P(B) = 0.3 and they're independent, what is P(A and B)?", options: ["0.7", "0.12", "0.1", "0.04"], correctIndex: 1 },
      { text: "What is the probability of getting heads twice in a row?", options: ["1/2", "1/4", "1/3", "1/8"], correctIndex: 1 },
      { text: "How many different 2-card hands exist from a 52-card deck?", options: ["1326", "1024", "2652", "676"], correctIndex: 0 },
      { text: "What does 'mutually exclusive' mean in probability?", options: ["Events that always happen together", "Events that cannot happen at the same time", "Events with equal probability", "Events that are independent"], correctIndex: 1 },
      { text: "What is the expected value of a fair 6-sided die?", options: ["3", "3.5", "4", "3.25"], correctIndex: 1 },
      { text: "Bayes' Theorem relates which probabilities?", options: ["Posterior and prior probabilities", "Marginal and joint probabilities", "Independent events only", "Normal distributions"], correctIndex: 0 },
    ],
  },

  // ── SCIENCE EXTRA ──────────────────────────────────────────────
  {
    title: "Astronomy & Space",
    description: "Exploring the cosmos.",
    category: "science",
    difficulty: 3,
    questions: [
      { text: "How many planets are in our solar system?", options: ["7", "8", "9", "10"], correctIndex: 1 },
      { text: "What is the largest planet in our solar system?", options: ["Saturn", "Neptune", "Uranus", "Jupiter"], correctIndex: 3 },
      { text: "What is a light-year?", options: ["The speed of light", "The distance light travels in one year", "A unit of time", "The brightness of a star"], correctIndex: 1 },
      { text: "What type of star is our Sun?", options: ["Red giant", "White dwarf", "Yellow dwarf", "Blue supergiant"], correctIndex: 2 },
      { text: "What is the name of the galaxy we live in?", options: ["Andromeda", "Triangulum", "The Milky Way", "Centaurus A"], correctIndex: 2 },
      { text: "Who was the first human to walk on the Moon?", options: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "Alan Shepard"], correctIndex: 1 },
      { text: "In which year did humans first land on the Moon?", options: ["1965", "1967", "1969", "1971"], correctIndex: 2 },
      { text: "What is a black hole?", options: ["A star that exploded", "A region of space where gravity is so strong nothing can escape", "A dark nebula", "An empty void between galaxies"], correctIndex: 1 },
      { text: "What is the name of Mars's largest volcano?", options: ["Olympus Mons", "Vesuvius", "Mauna Kea", "Valles Marineris"], correctIndex: 0 },
      { text: "How long does light from the Sun take to reach Earth?", options: ["1 second", "8 minutes", "1 hour", "1 day"], correctIndex: 1 },
    ],
  },
  {
    title: "Human Body",
    description: "The most complex machine you'll ever know.",
    category: "science",
    difficulty: 2,
    questions: [
      { text: "How many bones are in the adult human body?", options: ["196", "206", "216", "226"], correctIndex: 1 },
      { text: "What is the largest organ in the human body?", options: ["Liver", "Heart", "Lungs", "Skin"], correctIndex: 3 },
      { text: "Which organ pumps blood through the body?", options: ["Liver", "Lungs", "Heart", "Brain"], correctIndex: 2 },
      { text: "What is the normal human body temperature (Celsius)?", options: ["35°C", "36°C", "37°C", "38°C"], correctIndex: 2 },
      { text: "How many chambers does the human heart have?", options: ["2", "3", "4", "5"], correctIndex: 2 },
      { text: "What is the hardest substance in the human body?", options: ["Bone", "Cartilage", "Tooth enamel", "Keratin"], correctIndex: 2 },
      { text: "Which blood cells fight infection?", options: ["Red blood cells", "Platelets", "White blood cells", "Plasma"], correctIndex: 2 },
      { text: "What percentage of the human body is water?", options: ["45%", "55%", "60%", "75%"], correctIndex: 2 },
      { text: "What is the largest muscle in the human body?", options: ["Biceps", "Quadriceps", "Gluteus Maximus", "Deltoid"], correctIndex: 2 },
      { text: "Which vitamin do we get primarily from sunlight?", options: ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"], correctIndex: 3 },
    ],
  },

  // ── PHYSICS ───────────────────────────────────────────────────
  {
    title: "Physics Intro",
    description: "The laws of the universe, simplified.",
    category: "physics",
    difficulty: 1,
    questions: [
      { text: "What is the unit of force?", options: ["Joule", "Watt", "Newton", "Pascal"], correctIndex: 2 },
      { text: "What does E=mc² mean?", options: ["Energy equals mass times speed", "Energy equals mass times speed of light squared", "Energy is constant", "Mass is energy"], correctIndex: 1 },
      { text: "What is gravity?", options: ["A magnetic force", "The force attracting objects with mass", "An electrical field", "A nuclear force"], correctIndex: 1 },
      { text: "What is the unit of electrical current?", options: ["Volt", "Ohm", "Ampere", "Watt"], correctIndex: 2 },
      { text: "What travels at the speed of light?", options: ["Sound", "Electricity", "Light/Electromagnetic waves", "Gravity waves"], correctIndex: 2 },
    ],
  },
  {
    title: "Classical Mechanics",
    description: "Newton's universe explained.",
    category: "physics",
    difficulty: 2,
    questions: [
      { text: "What is Newton's First Law?", options: ["F=ma", "Every action has a reaction", "Objects stay at rest/motion unless acted upon", "Gravity attracts mass"], correctIndex: 2 },
      { text: "What is momentum?", options: ["Force × time", "Mass × velocity", "Mass × acceleration", "Energy / time"], correctIndex: 1 },
      { text: "What is the unit of energy?", options: ["Newton", "Watt", "Joule", "Pascal"], correctIndex: 2 },
      { text: "What does friction do?", options: ["Speeds objects up", "Has no effect on motion", "Opposes motion", "Creates energy"], correctIndex: 2 },
      { text: "What is the formula for kinetic energy?", options: ["mgh", "½mv²", "Fd", "mv"], correctIndex: 1 },
    ],
  },
  {
    title: "Electromagnetism",
    description: "Light, fields, and electric charge.",
    category: "physics",
    difficulty: 3,
    questions: [
      { text: "What is Ohm's Law?", options: ["V=IR", "P=IV", "E=mc²", "F=qE"], correctIndex: 0 },
      { text: "What type of wave is light?", options: ["Mechanical", "Longitudinal", "Electromagnetic", "Seismic"], correctIndex: 2 },
      { text: "What particle carries electric charge in a wire?", options: ["Proton", "Neutron", "Electron", "Photon"], correctIndex: 2 },
      { text: "What is magnetic flux?", options: ["Current through a wire", "The product of magnetic field and area", "Resistance in a circuit", "Charge on a capacitor"], correctIndex: 1 },
      { text: "What is the frequency unit?", options: ["Watt", "Hertz", "Tesla", "Farad"], correctIndex: 1 },
    ],
  },
  {
    title: "Quantum Physics",
    description: "The weird and wonderful subatomic world.",
    category: "physics",
    difficulty: 4,
    questions: [
      { text: "What is Schrödinger's cat thought experiment about?", options: ["Quantum superposition", "Relativistic time", "Black holes", "Wave interference"], correctIndex: 0 },
      { text: "What principle says you can't know position and momentum exactly?", options: ["Pauli Exclusion", "Heisenberg Uncertainty", "Bohr's Complementarity", "De Broglie Duality"], correctIndex: 1 },
      { text: "What is a photon?", options: ["An electron at high energy", "A quantum of electromagnetic radiation", "A charged particle", "A type of quark"], correctIndex: 1 },
      { text: "What does the wave function describe?", options: ["The path of a particle", "Probability distribution of a particle's state", "The charge of a particle", "The mass of a quark"], correctIndex: 1 },
      { text: "What is quantum tunnelling?", options: ["Particle teleportation", "Passing through a classically forbidden energy barrier", "Magnetic field penetration", "Quantum computing operation"], correctIndex: 1 },
    ],
  },
  {
    title: "Relativity & Cosmology",
    description: "Einstein, black holes, and the cosmos.",
    category: "physics",
    difficulty: 5,
    questions: [
      { text: "What is time dilation?", options: ["Light bending near gravity", "Time passing slower at high speed/gravity", "Space expanding", "The Big Bang expansion"], correctIndex: 1 },
      { text: "What is the Schwarzschild radius?", options: ["The event horizon radius of a black hole", "The radius of a neutron star", "The distance light travels in a year", "The observable universe radius"], correctIndex: 0 },
      { text: "What does general relativity describe?", options: ["Quantum behaviour", "Gravity as curvature of spacetime", "Electric fields", "Nuclear forces"], correctIndex: 1 },
      { text: "What is Hawking radiation?", options: ["Radiation from supernovae", "Thermal radiation emitted by black holes", "Cosmic microwave background", "Gamma ray bursts"], correctIndex: 1 },
      { text: "What is the cosmological constant?", options: ["The rate of stellar formation", "Einstein's term for the energy density of empty space", "The Hubble constant", "The speed of universal expansion"], correctIndex: 1 },
    ],
  },

  // ── PHYSICS EXTRA ─────────────────────────────────────────────
  {
    title: "Thermodynamics",
    description: "Heat, energy, and the laws of the universe.",
    category: "physics",
    difficulty: 3,
    questions: [
      { text: "What is the First Law of Thermodynamics?", options: ["Energy cannot be created or destroyed", "Entropy always increases", "Heat flows from cold to hot", "Absolute zero is impossible to reach"], correctIndex: 0 },
      { text: "What is entropy a measure of?", options: ["Temperature", "Disorder or randomness", "Pressure", "Volume"], correctIndex: 1 },
      { text: "What is absolute zero in Celsius?", options: ["-100°C", "-200°C", "-273.15°C", "-300°C"], correctIndex: 2 },
      { text: "What does the Second Law of Thermodynamics state?", options: ["Energy is conserved", "Entropy of an isolated system never decreases", "Work equals heat", "Temperature equals pressure at equilibrium"], correctIndex: 1 },
      { text: "What is the unit of temperature in the SI system?", options: ["Celsius", "Fahrenheit", "Kelvin", "Rankine"], correctIndex: 2 },
      { text: "What process transfers heat without mass movement through direct contact?", options: ["Convection", "Radiation", "Conduction", "Diffusion"], correctIndex: 2 },
      { text: "What is the efficiency of a Carnot engine based on?", options: ["Material of the engine", "Temperatures of hot and cold reservoirs", "Speed of the engine", "Pressure of the gas"], correctIndex: 1 },
      { text: "What state of matter has the highest entropy?", options: ["Solid", "Liquid", "Gas", "Plasma"], correctIndex: 3 },
      { text: "What happens to gas pressure when volume is halved (constant temperature)?", options: ["Stays the same", "Doubles", "Halves", "Quadruples"], correctIndex: 1 },
      { text: "What is the zeroth law of thermodynamics about?", options: ["Heat death of the universe", "Thermal equilibrium and temperature", "Conservation of energy", "Absolute zero"], correctIndex: 1 },
    ],
  },
  {
    title: "Nuclear Physics",
    description: "The power at the heart of atoms.",
    category: "physics",
    difficulty: 4,
    questions: [
      { text: "What force holds the nucleus together?", options: ["Electromagnetic", "Gravitational", "Strong nuclear force", "Weak nuclear force"], correctIndex: 2 },
      { text: "What is nuclear fission?", options: ["Combining two nuclei", "Splitting a heavy nucleus into smaller ones", "Emitting alpha particles", "Absorbing neutrons"], correctIndex: 1 },
      { text: "What is nuclear fusion?", options: ["Splitting atoms", "Combining light nuclei to form a heavier one", "Neutron decay", "Radioactive emission"], correctIndex: 1 },
      { text: "What particle is emitted in alpha decay?", options: ["Electron", "Neutron", "Positron", "Helium-4 nucleus"], correctIndex: 3 },
      { text: "What is a chain reaction in nuclear physics?", options: ["Electrons cascading through a material", "Each fission event triggers more fission events", "Protons decaying sequentially", "A series of fusion events"], correctIndex: 1 },
      { text: "What does E=mc² tell us about nuclear reactions?", options: ["Mass and energy are unrelated", "A tiny mass converts to enormous energy", "Energy is always conserved as heat", "Speed of light limits reaction rate"], correctIndex: 1 },
      { text: "Which element is most commonly used in nuclear power plants?", options: ["Plutonium-239", "Thorium-232", "Uranium-235", "Radium-226"], correctIndex: 2 },
      { text: "What is radioactive half-life?", options: ["Time for all atoms to decay", "Time for half the atoms to decay", "Half the energy released during decay", "Time for radiation to halve in intensity"], correctIndex: 1 },
      { text: "Where did the world's first nuclear reactor go critical?", options: ["Oak Ridge", "Los Alamos", "Chicago", "Hanford"], correctIndex: 2 },
      { text: "What is antimatter?", options: ["Dark matter variant", "Matter with opposite quantum properties to normal matter", "Unstable heavy atoms", "Matter moving faster than light"], correctIndex: 1 },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Upsert system user
  const systemUser = await prisma.user.upsert({
    where: { email: SYSTEM_EMAIL },
    update: {},
    create: {
      email: SYSTEM_EMAIL,
      name: "BittsQuiz Team",
      image: null,
    },
  });
  console.log(`✅ System user: ${systemUser.id}`);

  // Seed packs
  for (const pack of PACKS_DATA) {
    await prisma.pack.upsert({
      where: { slug: pack.slug },
      update: pack,
      create: pack,
    });
  }
  console.log(`✅ ${PACKS_DATA.length} packs seeded`);

  // Seed quizlets
  for (const q of QUIZLETS_DATA) {
    await prisma.quizlet.upsert({
      where: { name: q.name },
      update: {
        ...q,
        sellValue: SELL_VALUES[q.rarity] ?? 10,
      },
      create: {
        ...q,
        sellValue: SELL_VALUES[q.rarity] ?? 10,
      },
    });
  }
  console.log(`✅ ${QUIZLETS_DATA.length} quizlets seeded`);

  // Seed quizzes
  let quizCount = 0;
  let questionCount = 0;
  for (const quiz of QUIZZES) {
    const existing = await prisma.quiz.findFirst({
      where: { title: quiz.title, isOfficial: true },
    });
    if (!existing) {
      const created = await prisma.quiz.create({
        data: {
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          difficulty: quiz.difficulty,
          isOfficial: true,
          authorId: systemUser.id,
          questions: {
            create: quiz.questions.map((q, i) => ({
              text: q.text,
              options: q.options,
              correctIndex: q.correctIndex,
              points: 1,
              order: i,
            })),
          },
        },
      });
      quizCount++;
      questionCount += quiz.questions.length;
      void created;
    }
  }
  console.log(`✅ ${quizCount} quizzes + ${questionCount} questions seeded`);
  console.log("🎉 Seeding complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
