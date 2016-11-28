/**
 * Constructor
 * @param {string} route Route to handle
 * @returns {Handler} new Handler instance
 */
var Handler = function (route) {
    // Handle redirects
    if (route.redirect) {
        return (req, res) => {
            res.redirect(route.redirect);
        };
    }

    var url = '/' + route.name + '.html';
    return function (req, res, next) {
        req.url = url;
        next();
    };
};

/**
 * Export a new instance
 * @param {string} route Route to handle
 * @returns {Handler} instance of Handler for route
 */
module.exports = function (route) {
    return new Handler(route);
};
