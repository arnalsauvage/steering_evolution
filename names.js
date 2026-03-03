/**
 * GENERATEUR DE NOMS ENGAGÉS 🎸✊
 * Par Django & Arnal
 */

const FIRST_NAMES = [
    "Bob", "Amy", "Léo", "Georges", "Renaud", "Stéphane", "Janis", "Joan", 
    "Jacques", "Juan", "Paco", "Mercedes", "Victor", "Patti", "Jimi", "Nina",
    "Manu", "Magyd", "Bernard", "Dominique", "Arthur", "Damien", "Cali", 
    "Christophe", "Barbara", "Juliette", "Boris", "Colette", "Edith", "Anne",
    "Orel", "Stromae", "Angèle", "Usul", "Clément", "Anne", "Hubert-Félix"
];

const LAST_NAMES = [
    "Dylan", "Winehouse", "Ferré", "Brassens", "Séchan", "Sanseverino", 
    "Joplin", "Baez", "Brel", "Ferrat", "Ibañez", "Smith",
    "Hendrix", "Simone", "Chao", "Cherfi", "Lavilliers", "Miossec", "Saez", 
    "Vian", "Piaf", "Gréco", "Sylvestre", "Thiefaine", "Higelin",  "Higelin",
    "Orwell", "Viktorovitch"
];

function generateEngagedName() {
    const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    return `${first} ${last}`;
}
