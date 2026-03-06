const axios = require('axios').default
const cheerio = require('cheerio')
const Logger = require('../../Logger')

class ABBScraper {
  constructor() {
    this.baseUrl = 'https://audiobookbay.lu'
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }

  async search(title, author) {
    const query = encodeURIComponent(`${title} ${author}`)
    const url = `${this.baseUrl}/?s=${query}`
    Logger.debug(`[ABBScraper] Searching for magnet link: ${url}`)

    try {
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent }
      })
      const $ = cheerio.load(data)
      let matchUrl = null

      // Look for first search result
      $('.post').each((i, el) => {
        if (matchUrl) return
        
        const resultTitle = $(el).find('.postTitle h2 a').text().toLowerCase()
        const resultAuthor = $(el).find('.postInfo').text().toLowerCase()
        
        // Simple heuristic: title must be in the result title
        if (resultTitle.includes(title.toLowerCase())) {
          matchUrl = $(el).find('.postTitle h2 a').attr('href')
        }
      })

      return matchUrl ? (matchUrl.startsWith('http') ? matchUrl : this.baseUrl + matchUrl) : null
    } catch (error) {
      Logger.error(`[ABBScraper] Error searching for ${title}:`, error.message)
      return null
    }
  }
}

module.exports = new ABBScraper()
