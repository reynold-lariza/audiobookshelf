const axios = require('axios').default
const cheerio = require('cheerio')
const Logger = require('../../Logger')

const CATEGORY_MAP = {
  'Arts & Entertainment': '18571910011',
  'Biographies & Memoirs': '18571951011',
  'Business & Careers': '18572029011',
  'Children\'s Audiobooks': '18572131011',
  'Computers & Technology': '18573211011',
  'Education & Learning': '18573251011',
  'Health & Wellness': '18573331011',
  'History': '18573431011',
  'Literature & Fiction': '18573521011',
  'Mystery, Thriller & Suspense': '18574033011',
  'Philosophy': '18574487011',
  'Politics & Social Sciences': '18574513011',
  'Religion & Spirituality': '18574637011',
  'Romance': '18574737011',
  'Science & Engineering': '18574811011',
  'Science Fiction & Fantasy': '18580606011',
  'Self-Help': '18574426011',
  'Sports & Outdoors': '18574871011',
  'Teen & Young Adult': '18574917011',
  'Travel & Tourism': '18574983011'
}

class AudibleScraper {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }

  async scrapeCategory(categoryName, type = 'Best Sellers') {
    const categoryId = CATEGORY_MAP[categoryName]
    if (!categoryId) {
      Logger.error(`[AudibleScraper] Unknown category: ${categoryName}`)
      return []
    }

    let url = `https://www.audible.com/adbl/long/search?node=${categoryId}&sort=popularity-rank`
    if (type === 'New Releases') {
      url = `https://www.audible.com/adbl/long/search?node=${categoryId}&sort=publication_date`
    }

    Logger.debug(`[AudibleScraper] Scraping ${type} for ${categoryName}: ${url}`)

    try {
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent }
      })
      const $ = cheerio.load(data)
      const results = []

      $('.bc-list-item.productListItem').each((i, el) => {
        if (i >= 15) return // Limit to top 15

        const title = $(el).find('h3.bc-heading a').text().trim()
        const author = $(el).find('.authorLabel').text().replace('By:', '').trim()
        const description = $(el).find('.descriptionLabel').text().trim()
        const coverUrl = $(el).find('img.bc-image-inset').attr('src')
        const sourceUrl = 'https://www.audible.com' + $(el).find('h3.bc-heading a').attr('href')
        const asinMatch = sourceUrl.match(/\/pd\/([^/]+)\/([A-Z0-9]{10})/i)
        const asin = asinMatch ? asinMatch[2] : null

        if (title && author) {
          results.push({
            title,
            author,
            description,
            coverUrl,
            sourceUrl,
            asin,
            category: categoryName,
            type
          })
        }
      })

      return results
    } catch (error) {
      Logger.error(`[AudibleScraper] Error scraping ${categoryName}:`, error.message)
      return []
    }
  }

  async scrapeSimilar(asin) {
    const url = `https://www.audible.com/pd/${asin}`
    Logger.debug(`[AudibleScraper] Scraping similar books for ASIN: ${asin}`)

    try {
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent }
      })
      const $ = cheerio.load(data)
      const results = []

      // Look for "Listeners also enjoyed" section
      // Note: Selector might change based on Audible's A/B testing
      $('.bc-carousel-slide').each((i, el) => {
        const title = $(el).find('.bc-pub-block-title').text().trim()
        const author = $(el).find('.bc-pub-block-author').text().trim()
        const coverUrl = $(el).find('img').attr('src')
        const sourceUrl = $(el).find('a').attr('href') ? 'https://www.audible.com' + $(el).find('a').attr('href') : null
        
        if (title && author && sourceUrl) {
          const asinMatch = sourceUrl.match(/\/pd\/([^/]+)\/([A-Z0-9]{10})/i)
          results.push({
            title,
            author,
            coverUrl,
            sourceUrl,
            asin: asinMatch ? asinMatch[2] : null,
            type: 'Recommendation'
          })
        }
      })

      return results
    } catch (error) {
      Logger.error(`[AudibleScraper] Error scraping similar for ${asin}:`, error.message)
      return []
    }
  }
}

module.exports = new AudibleScraper()
