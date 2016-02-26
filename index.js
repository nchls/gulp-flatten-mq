'use strict';

var _ = require('lodash');
var through = require('through2');
var css = require('css');

module.exports = function flattenMQ() {
    return through.obj(function(file, encoding, callback) {
        var contents = String(file._contents.toString(encoding));
        var ast = css.parse(contents);
        var outputAst = {
            type: 'stylesheet',
            stylesheet: {
                rules: []
            }
        };
        var outputString;
        var mqRules = [];

        // Output all rules outside viewport media queries first
        _.forEach(ast.stylesheet.rules, function(rule) {
            if (rule.type === 'comment') {
                return;
            }
            if (isViewportMQRule(rule)) {
                mqRules.push(rule);
                return;
            }
            outputAst.stylesheet.rules.push(rule);
        });

        // Add a comment to indicate the start of rules extracted from media queries
        outputAst.stylesheet.rules.push({
            type: 'comment',
            comment: 'Start media query rules'
        });

        // Remove all max-width rules
        _.remove(mqRules, function(rule) {
            var parsedRule = parseMQRule(rule);
            for (var i = 0, l = parsedRule.length; i < l; i++) {
                if (parsedRule[i].property === 'max-width') {
                    return true;
                }
            }
        });

        // Sort min-width rules by ascending viewport size
        mqRules = _.sortBy(mqRules, function(rule) {
            var parsedRule = parseMQRule(rule);
            return _.find(parsedRule, {property: 'min-width'}).parsedValue;
        });

        // Extract rules from media queries and append to stylesheet
        _.forEach(mqRules, function(rule) {
            _.forEach(rule.rules, function(subRule) {
                if (subRule.type !== 'comment') {
                    outputAst.stylesheet.rules.push(subRule);
                }
            });
        });

        outputString = css.stringify(outputAst);

        file.contents = new Buffer(outputString);

        callback(null, file);
    });
};

/**
 * Takes a CSS rule and returns true if it is a min-width or max-width media query
 * @param  {Object}  rule Parsed CSS rule
 * @return {Boolean}
 */
var isViewportMQRule = function isViewportMQRule(rule) {
    if (rule.type !== 'media') {
        return false;
    }
    var parsedRule = parseMQRule(rule);
    for (var i = 0, l = parsedRule.length; i < l; i++) {
        if (['min-width', 'max-width'].indexOf(parsedRule[i].property) !== -1) {
            return true;
        }
    }
    return false;
};

/**
 * Takes a CSS media query rule and returns an array of parsed properties
 * @param  {Object} rule Parsed CSS rule
 * @return {Array}
 */
var parseMQRule = function parseMQRule(rule) {
    var medias = rule.media.split(' and ');
    medias = medias.map(function(media) {
        var keyVal = media.replace(/[\(\)\s]/g, '').split(':');
        return {
            property: keyVal[0],
            value: keyVal[1],
            parsedValue: parseInt(keyVal[1])
        }
    });
    return medias;
};
