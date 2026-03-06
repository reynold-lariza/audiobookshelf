const { DataTypes, Model } = require('sequelize')

class BayItem extends Model {
  constructor(values, options) {
    super(values, options)

    /** @type {UUIDV4} */
    this.id
    /** @type {string} */
    this.title
    /** @type {string} */
    this.author
    /** @type {string} */
    this.description
    /** @type {string} */
    this.coverUrl
    /** @type {string} */
    this.sourceUrl
    /** @type {string} */
    this.downloadUrl
    /** @type {string} */
    this.category
    /** @type {string} */
    this.type
    /** @type {string} */
    this.asin
    /** @type {Date} */
    this.lastScanned
  }

  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false
        },
        author: DataTypes.STRING,
        description: DataTypes.TEXT,
        coverUrl: DataTypes.STRING,
        sourceUrl: DataTypes.STRING,
        downloadUrl: DataTypes.STRING,
        category: DataTypes.STRING,
        type: DataTypes.STRING,
        asin: DataTypes.STRING,
        lastScanned: DataTypes.DATE
      },
      {
        sequelize,
        modelName: 'bayItem'
      }
    )
  }
}

module.exports = BayItem
