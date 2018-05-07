import Sequelize from 'sequelize'
import cuid from 'cuid'

const {
  like
} = Sequelize.Op

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'db.sqlite',
  operatorsAliases: {}
  // logging: () => {}
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
  }
})

const Log = sequelize.define('log', {
  id: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: () => cuid(),
    unique: true,
    primaryKey: true
  },
  // releaseId: {
  //   type: Sequelize.STRING,
  //   references: {
  //     model: Release,
  //     key: 'id'
  //   }
  // },
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

Release.hasMany(Log)

Release.sync()
Log.sync()

async function getLog (release) {
  return await Release.findOne({
    where: {
      path: {[like]: `%${release}%`}
    },
    include: [{
      model: Log
      // where: { releaseId: Sequelize.col('release.id') }
    }]
  })
}

export { Release, Log, getLog }
