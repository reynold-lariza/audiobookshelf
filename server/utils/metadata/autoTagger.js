const Logger = require('../../Logger')

// A comprehensive mapping of Categories -> Keywords for auto-tagging
const TAG_COLLECTIONS = {
  // === Non-Fiction ===
  "Cybersecurity": ["cybersecurity", "hacking", "internet exploits", "cyberwar", "infosec", "penetration testing", "phishing", "malware", "ransomware", "cryptography", "firewall", "data breach", "information security", "cybercrime", "hacker"],
  "Technology & Engineering": ["technology", "engineering", "computer science", "software", "programming", "coding", "algorithm", "data science", "internet", "machine learning", "hardware", "robotics", "artificial intelligence", "tech industry"],
  "Philosophy": ["philosophy", "ethics", "metaphysics", "epistemology", "existentialism", "stoicism", "socrates", "plato", "aristotle", "nietzsche", "kant", "utilitarianism", "nihilism", "phenomenology", "philosophical"],
  "Self-Help": ["self-help", "personal development", "habit", "productivity", "motivation", "self-improvement", "inspiration", "mindfulness", "success", "happiness", "procrastination", "goal setting", "life coach", "self-care"],
  "Health & Wellness": ["health", "wellness", "fitness", "nutrition", "mental health", "diet", "exercise", "meditation", "yoga", "weight loss", "sleep", "anxiety", "depression", "holistic", "vegan", "wellbeing"],
  "Biography & Memoir": ["biography", "memoir", "autobiography", "life story", "diary", "personal narrative", "true story"],
  "History": ["history", "world war", "civil war", "ancient history", "empire", "revolution", "historical event", "military history", "medieval history", "cold war", "roman empire", "american history", "european history"],
  "Science & Nature": ["science", "nature", "physics", "chemistry", "biology", "astronomy", "astrophysics", "evolution", "genetics", "environment", "climate change", "ecology", "zoology", "botany", "universe", "quantum", "cosmos"],
  "Psychology": ["psychology", "mind", "brain", "behavior", "cognitive", "psychoanalysis", "subconscious", "therapy", "psychiatry", "neuroscience", "personality", "psychological"],
  "Business & Economics": ["business", "economics", "finance", "investing", "management", "entrepreneurship", "startup", "leadership", "marketing", "sales", "wealth", "stock market", "capitalism", "corporate"],
  "True Crime": ["true crime", "serial killer", "murder investigation", "kidnapping", "unsolved", "heist", "criminal justice", "forensics", "cult", "true murder"],
  "Religion & Spirituality": ["religion", "spirituality", "christianity", "buddhism", "islam", "hinduism", "judaism", "theology", "faith", "belief", "god", "zen", "new age", "bible", "quran", "torah", "spiritual"],
  "Politics & Government": ["politics", "government", "political science", "democracy", "republican", "democrat", "conservative", "liberal", "communism", "socialism", "fascism", "policy", "election", "diplomacy"],

  // === Fiction ===
  "Science Fiction": ["sci-fi", "science fiction", "space opera", "alien", "future", "time travel", "cyberpunk", "spaceship", "extraterrestrial", "galaxy", "interstellar", "dystopian", "post-apocalyptic", "robot", "steampunk"],
  "Fantasy": ["fantasy", "magic", "dragon", "elves", "wizard", "sword and sorcery", "epic fantasy", "urban fantasy", "witch", "vampire", "werewolf", "mythology", "fairytale", "quest", "dark fantasy", "high fantasy"],
  "Mystery & Thriller": ["mystery", "thriller", "suspense", "detective", "murder mystery", "crime", "investigation", "whodunit", "spy", "espionage", "assassin", "conspiracy", "police procedural", "psychological thriller"],
  "Horror": ["horror", "scary", "terror", "ghost", "haunted", "supernatural", "monster", "zombie", "demon", "gore", "macabre", "lovecraftian", "paranormal", "spooky"],
  "Historical Fiction": ["historical fiction", "period piece", "ancient rome", "tudor", "victorian", "medieval", "renaissance"],
  "Romance": ["romance", "love story", "contemporary romance", "historical romance", "paranormal romance", "erotica", "romantic comedy", "rom-com", "billionaire romance", "enemies to lovers", "love triangle"]
}

/**
 * Analyzes metadata text and applies relevant tags from our collections.
 * 
 * @param {Object} metadata The library item metadata object
 * @returns {string[]} An array of tags matched by keywords
 */
function generateTagsFromMetadata(metadata) {
  const generatedTags = new Set()
  
  // Combine all searchable text fields into one massive lowercased string
  const searchableText = [
    metadata.title,
    metadata.subtitle,
    metadata.description,
    ...(metadata.genres || []),
    ...(metadata.tags || []) // Include existing tags so they can trigger macro-categories
  ].filter(Boolean).join(' ').toLowerCase()

  for (const [categoryTag, keywords] of Object.entries(TAG_COLLECTIONS)) {
    for (const keyword of keywords) {
      // Use regex to find exact word matches, preventing "alien" from matching "salient"
      const regex = new RegExp(`\\b${keyword}\\b`, 'i')
      if (regex.test(searchableText)) {
        generatedTags.add(categoryTag)
        break // Move to the next category once a keyword is successfully matched
      }
    }
  }

  return Array.from(generatedTags)
}

module.exports = {
  TAG_COLLECTIONS,
  generateTagsFromMetadata
}
