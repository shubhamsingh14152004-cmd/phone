const app = require('../fixmyphone-fullstack/backend/server');

module.exports = (req, res) => {
  return app(req, res);
};
