import { PrismaClient } from "@prisma/client";
import { QUIZLETS_DATA } from "../lib/quizlets-data";
import { PACKS_DATA } from "../lib/packs-data";
import { SELL_VALUES } from "../lib/utils";

const prisma = new PrismaClient();

const SYSTEM_EMAIL = "system@quizlet2026.app";

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
];

async function main() {
  console.log("🌱 Seeding database...");

  // Upsert system user
  const systemUser = await prisma.user.upsert({
    where: { email: SYSTEM_EMAIL },
    update: {},
    create: {
      email: SYSTEM_EMAIL,
      name: "Quizlet 2026 Team",
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
