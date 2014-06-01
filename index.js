var FS = require('fs'),
    PATH = require('path'),
    EXTEND = require('extend'),
    COLORS = require('colors'),

    ORIGIN_TO_URL_PROPERTIES_MAP = {
        background : 'background-image'
    };

/**
 * @constructor
 * @param {Object} scope
 */
var ProcssInline = function(scope) {
    this.scope = scope;
};

/**
 * Procss plugin API
 * @type {Object}
 */
module.exports = (function() {
    var instance;

    return {

        /**
         * Will be called before start to process input files
         * @param {Object} scope
         */
        before : function(scope) {
            // creaate new instance, before start to process files
            instance = new ProcssInline(scope);
        },

        /**
         * Will be called before start to process each input file
         * @param {Object} scope
         * @param {Object} pluginConfig
         */
        beforeEach : function(scope, pluginConfig) {
            var config = EXTEND({}, ProcssInline._defaultConfig, pluginConfig),
                filePath = scope.file.config.input;

            if (typeof config.base_path === 'undefined' && filePath !== '-') {
                config.base_path = PATH.dirname(filePath);
            }

            // set plugin config for processing file
            instance.config = config;
        },

        /**
         * Will be called on each parsed command
         * @param {Object} scope
         */
        process : function(scope) {
            var command = scope.command,
                basedDeclaration;

            if (command.name !== 'inline') {
                return;
            }

            // make based
            basedDeclaration = instance._processDeclaration(scope.decl);
            if (basedDeclaration) {
                // add based declaration after original
                scope.rule.insertAfter(scope.decl, basedDeclaration);
            }
        }
    };
})();

/**
 * @static
 * @type {Object}
 */
ProcssInline._defaultConfig = {
    min_input_size : 0, // Minimum input file size allowed to be inlined
    max_input_size : 4096, // Maximum input file size allowed to be inlined
    min_inlined_size : 0, // Minimum inlined content size allowed
    max_inlined_size : 4096, // Maximum inlined content size allowed
    content_types : { // Content-types to use
        '.gif' : 'image/gif',
        '.jpg' : 'image/jpeg',
        '.png' : 'image/png',
        '.svg' : 'image/svg+xml',
        '.ttf' : 'application/x-font-ttf',
        '.woff' : 'application/x-font-woff'
    }
};

/**
 * Log inlining info
 * @static
 */
ProcssInline.log = (function() {
    function zeros(s, l) {
        s = String(s);
        while (s.length < l) {
            s = '0' + s;
        }
        return s;
    }

    function time() {
        var dt = new Date();

        return zeros(dt.getHours(), 2) + ':' +
                zeros(dt.getMinutes(), 2) + ':' +
                zeros(dt.getSeconds(), 2) + '.' +
                zeros(dt.getMilliseconds(), 3);
    }

    /**
     * @type {Function}
     * @param {String} state
     * @param {String} scope
     * @param {String} additional
     */
    return function(state, scope, additional) {
        console.log(
            COLORS.grey(
                time() + ' - ' +
                '[' + COLORS.magenta('Procss-Inline') + '] '+
                '[' + COLORS.green(state) + '] ' +
                COLORS.blue(PATH.relative('.', scope)) + ' ' +
                (additional || '')
            )
        );
    };
})();

/**
 * @private
 * @param {Object} decl Declartion with urls
 * @returns {Object} Declaration with inlined urls
 */
ProcssInline.prototype._processDeclaration = function(decl) {
    var urlRx = new RegExp(this.scope.parser.getUrlRe(), 'g'),
        value = decl.value,
        hasChanges = false,
        processedUrls = [],
        based = null,
        processedUrl,
        url;

    while ((url = urlRx.exec(value)) !== null) {
        if (url[0]) {
            processedUrl = this._processUrl(url[0]);
            hasChanges || (hasChanges = (processedUrl && processedUrl !== url[0]));
            processedUrls.push(processedUrl || url[0]);
        }
    }

    if (hasChanges && processedUrls.length > 0) {
        based = {
            prop : ORIGIN_TO_URL_PROPERTIES_MAP[decl.prop] || decl.prop,
            value : processedUrls.length === 1 ? processedUrls[0] : processedUrls.join(', ')
        };
    }

    return based;
};

/**
 * Prepare, check and inline url
 * @private
 * @param {String} url
 * @returns {String} Inlined url
 */
ProcssInline.prototype._processUrl = function(url) {
    var processedUrl = null;

    if (url.lastIndexOf('url(', 0) === 0) {
        url = url.replace(/^url\(\s*/, '').replace(/\s*\)$/, '');
    }

    if (url.charAt(0) === '\'' || url.charAt(0) === '"') {
        url = url.substr(1, url.length - 2);
    }

    if (this._isUrlProcessable(url)) {
        this.config.base_path &&
            (url = PATH.resolve(this.config.base_path, url));

        if (this._isFileProcessable(url)) {
            processedUrl = this._inline(url);
            if (processedUrl) {
                ProcssInline.log('Inline', url);
            }
        }
    }

    return processedUrl;
};

/**
 * Inline url with base64 or URI-encode
 * @private
 * @param {String} url
 * @returns {?String} Inlined url
 */
ProcssInline.prototype._inline = function(url) {
    var extname = PATH.extname(url),
        contentType = this.config.content_types[extname],
        isNeedEnc = extname === '.svg' && this.scope.command.params[0] === 'enc',
        based;

    try {
        based = FS.readFileSync(url, isNeedEnc ? 'utf8' : 'base64');
    } catch (e) {
        ProcssInline.log('Failed', url, e);
        return null;
    }

    if ( ! based) {
        console.warn('Inlining process failed: bad or empty file');
        return null;
    }

    if (based.length > this.config.max_inlined_size) {
        ProcssInline.log('Failed', url, 'based file is too big');
        return null;
    } else if (based.length < this.config.min_inlined_size) {
        ProcssInline.log('Failed', url, 'based file is too small');
        return null;
    }

    based = isNeedEnc ?
        ',' + encodeURIComponent(based) :
        ';base64,' + based;

    return [ 'url(data:', contentType, based, ')' ].join('');
};

/**
 * @private
 * @param {String} url
 * @returns {Boolean} Is url is valid for inlining
 */
ProcssInline.prototype._isUrlProcessable = function(url) {
    if ([ '#', '?', '/' ].indexOf(url.charAt(0)) !== -1 || /^\w+:/.test(url)) {
        ProcssInline.log('Failed', url, 'not allowed file path');

        return false;
    }

    if ( ! this.config.content_types.hasOwnProperty(PATH.extname(url))) {
        ProcssInline.log('Failed', url, 'not allowed file extension');

        return false;
    }

    return true;
};

/**
 * @private
 * @param {String} filePath
 * @returns {Boolean} Is file is valid for inlining
 */
ProcssInline.prototype._isFileProcessable = function(filePath) {
    var isAllowed = true,
        stats;

    try {
        stats = FS.statSync(filePath);
    } catch(e) {
        console.error('Inlining process failed: ', e);

        isAllowed = false;
    }

    if (
        this.config.min_input_size > stats.size ||
        this.config.max_input_size < stats.size
    ) {
        ProcssInline.log('Failed', filePath, 'file is too big');
    }

    return isAllowed;
};
