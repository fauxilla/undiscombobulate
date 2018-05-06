import Sequelize from 'sequelize'
import cuid from 'cuid'

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'db.sqlite',
  operatorsAliases: {},
  logging: () => {}
})

const Release = sequelize.define('release', {
  id: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: () => cuid(),
    unique: true,
    primaryKey: true
  },
  path: {
    type: Sequelize.STRING,
    unique: true
  },
  complete: {
    type: Sequelize.BOOLEAN
  },
  error: {
    type: Sequelize.BOOLEAN
  }
})
Release.sync()

const Log = sequelize.define('log', {
  releaseId: {
    type: Sequelize.STRING,
    references: {
      model: Release,
      key: 'id'
    }
  },
  level: {
    type: Sequelize.STRING
  },
  msg: {
    type: Sequelize.STRING
  },
  module: {
    type: Sequelize.STRING
  },
  meta: {
    type: Sequelize.STRING
  }
})
Log.sync()

export { Release, Log }
