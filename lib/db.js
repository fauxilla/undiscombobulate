import Sequelize from 'sequelize'

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'db.sqlite',
  operatorsAliases: {}
})

const Release = sequelize.define('release', {
  path: {
    type: Sequelize.STRING,
    primaryKey: true,
    unique: true
  },
  complete: {
    type: Sequelize.BOOLEAN
  }
})
Release.sync()

export { Release }
