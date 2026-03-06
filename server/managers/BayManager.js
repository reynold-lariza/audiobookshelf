const Logger = require('../Logger')
const Database = require('../Database')
const Sequelize = require('sequelize')
const axios = require('axios').default
const { levenshteinDistance } = require('../utils/index')
const audibleScraper = require('../utils/bay/audibleScraper')
const abbScraper = require('../utils/bay/abbScraper')
const audiobooksScraper = require('../utils/bay/audiobooksScraper')

class BayManager {
  constructor() {
    this.isScraping = false
  }

  /**
   * Get discovered items from the Bay table.
   * Cross-references with local library to check if items are already owned.
   * 
   * @param {string} libraryId 
   * @param {import('../models/User')} user 
   * @param {string} category 
   * @param {string} search 
   * @returns {Promise<Object>}
   */
  async getBayItems(libraryId, user, category = 'All', search = '') {
    // If search is provided, do a live search on Audible
    if (search) {
      Logger.info(`[BayManager] Performing live search for: "${search}"`)
      const searchResults = await audibleScraper.search(search)
      for (const item of searchResults) {
        await this.saveBayItem(item)
      }
    }

    const where = {}
    if (category !== 'All') {
      where.category = category
    }
    if (search) {
      where[Sequelize.Op.or] = [
        { title: { [Sequelize.Op.like]: `%${search}%` } },
        { author: { [Sequelize.Op.like]: `%${search}%` } }
      ]
    }

    const bayItems = await Database.bayItemModel.findAll({
      where,
      order: [['lastScanned', 'DESC']],
      limit: 100
    })

    // Get all library items in this library to check for ownership
    const libraryItems = await Database.libraryItemModel.findAll({
      where: { libraryId },
      include: [Database.bookModel]
    })

    const ownedTitles = libraryItems.map(li => li.media.title.toLowerCase())
    const ownedAsins = libraryItems.map(li => li.media.asin).filter(Boolean)

    const items = bayItems.map(bi => {
      const item = bi.toJSON()
      item.isOwned = (bi.asin && ownedAsins.includes(bi.asin)) || ownedTitles.includes(bi.title.toLowerCase())
      return item
    })

    return {
      items,
      categories: await this.getAvailableCategories(),
      message: this.isScraping ? 'Refreshing discovery hub...' : ''
    }
  }

  async getAvailableCategories() {
    const categories = await Database.bayItemModel.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('category')), 'category']],
      raw: true
    })
    const list = categories.map(c => c.category).filter(Boolean).sort()
    if (!list.includes('Recommendation')) list.unshift('Recommendation')
    return list
  }

  /**
   * Main refresh logic.
   * 1. Fetches recommendations based on last 5 listened books.
   * 2. Fetches Best Sellers and New Releases by category.
   */
  async refreshBay(user = null) {
    if (this.isScraping) return
    this.isScraping = true
    Logger.info(`[BayManager] Starting discovery hub refresh...`)

    try {
      if (user) {
        await this.generateRecommendations(user)
      }
      
      const categoriesToScan = [
        'Cybersecurity', 
        'Philosophy', 
        'Science Fiction & Fantasy', 
        'Self-Help', 
        'Business & Careers', 
        'History',
        'Computers & Technology',
        'Health & Wellness',
        'Mystery, Thriller & Suspense',
        'Science & Engineering'
      ]
      for (const category of categoriesToScan) {
        await this.scrapeAudibleCategory(category, 'Best Sellers')
        await this.scrapeAudibleCategory(category, 'New Releases')
      }

      const audiobooksItems = await audiobooksScraper.scrapeLatest()
      for (const item of audiobooksItems) {
        await this.saveBayItem(item)
      }

      Logger.info(`[BayManager] Discovery hub refresh complete.`)
    } catch (error) {
      Logger.error(`[BayManager] Error refreshing bay:`, error)
    } finally {
      this.isScraping = false
    }
  }

  async generateRecommendations(user) {
    Logger.info(`[BayManager] Generating recommendations for user "${user.username}"`)
    
    // Get last 5 listened books
    const recentProgress = await Database.mediaProgressModel.findAll({
      where: {
        userId: user.id,
        mediaItemType: 'book'
      },
      order: [['updatedAt', 'DESC']],
      limit: 5
    })

    for (const progress of recentProgress) {
      const book = await Database.bookModel.findByPk(progress.mediaItemId)
      if (book?.asin) {
        const similar = await audibleScraper.scrapeSimilar(book.asin)
        for (const item of similar) {
          item.category = 'Recommendation'
          await this.saveBayItem(item)
        }
      }
    }
  }

  async scrapeAudibleCategory(category, type) {
    const items = await audibleScraper.scrapeCategory(category, type)
    for (const item of items) {
      await this.saveBayItem(item)
    }
  }

  /**
   * Save or update an item in the Bay table.
   * Cross-references with Audiobookbay in the background.
   */
  async saveBayItem(itemData) {
    try {
      let bayItem = await Database.bayItemModel.findOne({
        where: { title: itemData.title, author: itemData.author }
      })

      if (!bayItem) {
        bayItem = await Database.bayItemModel.create({
          ...itemData,
          lastScanned: new Date()
        })
      } else {
        // Update existing item
        bayItem.lastScanned = new Date()
        await bayItem.save()
      }

      // Trigger cross-reference search in background if not already found
      if (!bayItem.downloadUrl) {
        this.backgroundSearchABB(bayItem)
      }
    } catch (error) {
      Logger.error(`[BayManager] Error saving bay item "${itemData.title}":`, error.message)
    }
  }

  async backgroundSearchABB(bayItem) {
    try {
      const downloadUrl = await abbScraper.search(bayItem.title, bayItem.author)
      if (downloadUrl) {
        bayItem.downloadUrl = downloadUrl
        await bayItem.save()
        Logger.debug(`[BayManager] Background ABB match found for "${bayItem.title}"`)
      }
    } catch (error) {
      Logger.error(`[BayManager] Background ABB search failed for "${bayItem.title}":`, error.message)
    }
  }
}

module.exports = new BayManager()
