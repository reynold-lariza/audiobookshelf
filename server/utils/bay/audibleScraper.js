const axios = require('axios').default
const cheerio = require('cheerio')
const Logger = require('../../Logger')

const CATEGORY_MAP = {
  'Arts & Entertainment': '18571910011',
  'Biographies & Memoirs': '18571951011',
  'Business & Careers': '18572029011',
  'Children\'s Audiobooks': '18572131011',
  'Computers & Technology': '18573211011',
  'Cybersecurity': '18573211011', // Map to computers & tech
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

    let url = `https://www.audible.com/adbl/long/search?node=${categoryId}&sort=popularity-rank&ipRedirectOverride=true`
    if (type === 'New Releases') {
      url = `https://www.audible.com/adbl/long/search?node=${categoryId}&sort=publication_date&ipRedirectOverride=true`
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
        const link = $(el).find('h3.bc-heading a').attr('href')
        
        if (title && author && link) {
          const sourceUrl = 'https://www.audible.com' + link
          const asinMatch = sourceUrl.match(/[B0][A-Z0-9]{9}/i)
          results.push({
            title,
            author,
            description,
            coverUrl,
            sourceUrl,
            asin: asinMatch ? asinMatch[0] : null,
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
    // Attempt search instead of direct URL to avoid 404s
    const url = `https://www.audible.com/search?keywords=${asin}&ipRedirectOverride=true`
    Logger.debug(`[AudibleScraper] Searching for book to scrape similar: ${asin}`)

    try {
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent }
      })
      const $ = cheerio.load(data)
      
      // Get the first product link
      const firstLink = $('.bc-list-item.productListItem').first().find('h3.bc-heading a').attr('href')
      if (!firstLink) {
        Logger.warn(`[AudibleScraper] Could not find product page for ASIN: ${asin}`)
        return []
      }

      const productUrl = 'https://www.audible.com' + firstLink + '&ipRedirectOverride=true'
      const { data: productData } = await axios.get(productUrl, {
        headers: { 'User-Agent': this.userAgent }
      })
      const $p = cheerio.load(productData)
      const results = []

      $p('[data-widget="recommendations"], .bc-carousel-slide').each((i, el) => {
        const title = $p(el).find('.bc-pub-block-title, h3').text().trim()
        const author = $p(el).find('.bc-pub-block-author, .authorLabel').text().replace('By:', '').trim()
        const coverUrl = $p(el).find('img').attr('src')
        const link = $p(el).find('a').attr('href')
        
        if (title && author && link) {
          const sourceUrl = link.startsWith('http') ? link : 'https://www.audible.com' + link
          const asinMatch = sourceUrl.match(/[B0][A-Z0-9]{9}/i)
          results.push({
            title,
            author,
            coverUrl,
            sourceUrl,
            asin: asinMatch ? asinMatch[0] : null,
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

  async search(query) {
    const url = `https://www.audible.com/search?keywords=${encodeURIComponent(query)}&ipRedirectOverride=true`
    Logger.debug(`[AudibleScraper] Live search: ${url}`)

    try {
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent }
      })
      const $ = cheerio.load(data)
      const results = []

      $('.bc-list-item.productListItem').each((i, el) => {
        if (i >= 10) return

        const title = $(el).find('h3.bc-heading a').text().trim()
        const author = $(el).find('.authorLabel').text().replace('By:', '').trim()
        const description = $(el).find('.descriptionLabel').text().trim()
        const coverUrl = $(el).find('img.bc-image-inset').attr('src')
        const link = $(el).find('h3.bc-heading a').attr('href')
        
        if (title && author && link) {
          const sourceUrl = 'https://www.audible.com' + link
          const asinMatch = sourceUrl.match(/[B0][A-Z0-9]{9}/i)
          results.push({
            title,
            author,
            description,
            coverUrl,
            sourceUrl,
            asin: asinMatch ? asinMatch[0] : null,
            category: 'Search Result',
            type: 'Search'
          })
        }
      })
      return results
    } catch (error) {
      Logger.error(`[AudibleScraper] Search error for ${query}:`, error.message)
      return []
    }
  }
}

module.exports = new AudibleScraper()
