/**
 * @typedef MigrationContext
 * @property {import('sequelize').QueryInterface} queryInterface
 * @property {import('../Logger')} logger
 *
 * @typedef MigrationOptions
 * @property {MigrationContext} context
 */

const migrationVersion = '2.33.0'
const migrationName = `${migrationVersion}-create-bay-items-table`
const loggerPrefix = `[${migrationVersion} migration]`

/**
 * @param {MigrationOptions} options
 */
async function up({ context: { queryInterface, logger } }) {
  const table = 'bayItems'
  const { DataTypes } = queryInterface.sequelize.constructor

  logger.info(`${loggerPrefix} UPGRADE BEGIN: ${migrationName}`)

  const tableExists = await queryInterface.tableExists(table)
  if (tableExists) {
    logger.info(`${loggerPrefix} table "${table}" already exists`)
  } else {
    logger.info(`${loggerPrefix} creating table "${table}"`)
    await queryInterface.createTable(table, {
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
      lastScanned: DataTypes.DATE,
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    })
    logger.info(`${loggerPrefix} created table "${table}"`)
  }

  logger.info(`${loggerPrefix} UPGRADE END: ${migrationName}`)
}

/**
 * @param {MigrationOptions} options
 */
async function down({ context: { queryInterface, logger } }) {
  const table = 'bayItems'
  logger.info(`${loggerPrefix} DOWNGRADE BEGIN: ${migrationName}`)

  const tableExists = await queryInterface.tableExists(table)
  if (tableExists) {
    logger.info(`${loggerPrefix} dropping table "${table}"`)
    await queryInterface.dropTable(table)
    logger.info(`${loggerPrefix} dropped table "${table}"`)
  }

  logger.info(`${loggerPrefix} DOWNGRADE END: ${migrationName}`)
}

module.exports = { up, down }
