const axios = require('axios').default
const cheerio = require('cheerio')
const Logger = require('../../Logger')

class AudiobooksScraper {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }

  async scrapeLatest() {
    const url = 'https://www.audiobooks.com/browse/book_category/1/fiction' // Just an example, real would iterate
    Logger.debug(`[AudiobooksScraper] Scraping latest releases: ${url}`)

    try {
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent }
      })
      const $ = cheerio.load(data)
      const results = []

      $('.book-box').each((i, el) => {
        if (i >= 15) return

        const title = $(el).find('.title').text().trim()
        const author = $(el).find('.author').text().trim()
        const coverUrl = $(el).find('img').attr('src')
        const sourceUrl = $(el).find('a').attr('href')

        if (title && author) {
          results.push({
            title,
            author,
            coverUrl,
            sourceUrl: sourceUrl.startsWith('http') ? sourceUrl : 'https://www.audiobooks.com' + sourceUrl,
            type: 'New Releases',
            category: 'Fiction'
          })
        }
      })

      return results
    } catch (error) {
      Logger.error(`[AudiobooksScraper] Error scraping audiobooks.com:`, error.message)
      return []
    }
  }
}

module.exports = new AudiobooksScraper()
