/**
 * Dependencies.
 */
var requireDirectory = require('require-directory');

module.exports = function(server) {
    // Bootstrap your controllers so you dont have to load them individually. This loads them all into the controller name space. https://github.com/troygoode/node-require-directory
    var controller = requireDirectory(module, '../controllers');

    // Array of routes for Hapi
    var routeTable = [{
        method: 'POST',
        path: '/email_robot',
        config: controller.email.robot
    }, {
        method: 'POST',
        path: '/growth_robot',
        config: controller.growth.robot
    }, {
        method: 'POST',
        path: '/welcome_email/{user*2}',
        config: controller.email.welcomeEmail
    }];
    return routeTable;
};