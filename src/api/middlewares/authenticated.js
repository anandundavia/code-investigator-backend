const httpStatus = require('http-status');

module.exports = (req, res, next) => {
    if (req.user) {
        return next();
    }
    return res.status(httpStatus.UNAUTHORIZED).json({ message: 'UNAUTHORIZED' });
};
