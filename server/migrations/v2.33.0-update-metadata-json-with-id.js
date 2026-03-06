/**
 * @typedef MigrationContext
 * @property {import('sequelize').QueryInterface} queryInterface - a sequelize QueryInterface object.
 * @property {import('../Logger')} logger - a Logger object.
 *
 * @typedef MigrationOptions
 * @property {MigrationContext} context - an object containing the migration context.
 */

const migrationVersion = '2.33.0'
const migrationName = `${migrationVersion}-update-metadata-json-with-id`
const loggerPrefix = `[${migrationVersion} migration]`

/**
 * This upward migration was intended to resave all metadata files to include the ABS ID.
 * However, since it requires full model initialization, it is handled as a post-migration task.
 *
 * @param {MigrationOptions} options - an object containing the migration context.
 * @returns {Promise<void>} - A promise that resolves when the migration is complete.
 */
async function up({ context: { logger } }) {
  logger.info(`${loggerPrefix} UPGRADE BEGIN: ${migrationName}`)
  logger.info(`${loggerPrefix} Deferring metadata file updates to post-migration logic in Database.js`)
  logger.info(`${loggerPrefix} UPGRADE END: ${migrationName}`)
}

/**
 * @param {MigrationOptions} options - an object containing the migration context.
 * @returns {Promise<void>} - A promise that resolves when the migration is complete.
 */
async function down({ context: { logger } }) {
  logger.info(`${loggerPrefix} DOWNGRADE BEGIN: ${migrationName}`)
  logger.info(`${loggerPrefix} DOWNGRADE END: ${migrationName}`)
}

module.exports = { up, down }
