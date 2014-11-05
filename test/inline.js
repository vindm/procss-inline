var ASSERT = require('chai').assert;

describe('Procss-inline', function() {
    var FS = require('fs'),
        PATH = require('path'),
        PROCSS = require('procss'),
        ProcssInliner = PATH.resolve(__dirname, '..');

    var basePath = PATH.resolve(__dirname, 'inline');

    describe('base64', function() {
        [
            { name : 'should inline png images in css', file : 'png' },
            { name : 'should inline gif images in css', file : 'gif' },
            { name : 'should inline svg files in css', file : 'svg' }
        ]
            .forEach(function(test) {
                var inputFilePath = PATH.resolve(basePath, test.file + '.css'),
                    outputFilePath = PATH.resolve(basePath, test.file + '_out.css'),
                    expectedFileContent = FS.readFileSync(PATH.resolve(basePath, test.file + '_expected.css'), 'utf-8');

                it(test.name, function() {
                    after(function(done) {
                        require('child_process').exec('rm ' + outputFilePath, function() {
                            done();
                        });
                    });

                    return PROCSS
                        .api({
                            input : inputFilePath,
                            output : '?_out',
                            plugins : [ ProcssInliner ]
                        })
                        .then(function() {
                            ASSERT.equal(FS.readFileSync(outputFilePath, 'utf-8'), expectedFileContent);
                        });
                });
            });
    });

    describe('uri-enc', function() {
        var inputFilePath = PATH.resolve(basePath, 'svg-enc.css'),
            outputFilePath = PATH.resolve(basePath, 'svg-enc_out.css'),
            expectedFileContent = FS.readFileSync(PATH.resolve(basePath, 'svg-enc_expected.css'), 'utf-8');

        it('should inline and urlencode svg files in css', function() {
            after(function(done) {
                require('child_process').exec('rm ' + outputFilePath, function() {
                    done();
                });
            });

            return PROCSS
                .api({
                    input : inputFilePath,
                    output : '?_out',
                    plugins : [ ProcssInliner ]
                })
                .then(function() {
                    ASSERT.equal(FS.readFileSync(outputFilePath, 'utf-8'), expectedFileContent);
                });
        });
    });

    it('should not process file if it`s bigger then allowed by config', function() {
        var input = PATH.resolve(basePath, 'big.css'),
            outputFilePath = PATH.resolve(basePath, 'max_input_size.css'),
            expectedFileContent = FS.readFileSync(PATH.resolve(basePath, 'big_expected.css'), 'utf-8');

        after(function(done) {
            require('child_process').exec('rm ' + outputFilePath, function() {
                done();
            });
        });

        return PROCSS
            .api({
                input : input,
                output : 'max_input_size',
                plugins : [ {
                    plugin : ProcssInliner,
                    config : {
                        max_input_size : 4096,
                        max_based_size : 4096
                    }
                } ]
            })
            .then(function() {
                ASSERT.equal(FS.readFileSync(outputFilePath, 'utf-8'), expectedFileContent);
            });
    });

    it('should not use based data if it`s bigger then allowed by config', function() {
        var input = PATH.resolve(basePath, 'big.css'),
            outputFilePath = PATH.resolve(basePath, 'max_based_size.css'),
            expectedFileContent = FS.readFileSync(PATH.resolve(basePath, 'big_expected.css'), 'utf-8');

        after(function(done) {
            require('child_process').exec('rm ' + outputFilePath, function() {
                done();
            });
        });

        return PROCSS
            .api({
                input : input,
				output : 'max_based_size',
                plugins : [ {
                    plugin : ProcssInliner,
                    config : {
                        max_input_size : 4096,
                        max_based_size : 4096
                    }
                } ]
            })
            .then(function() {
                ASSERT.equal(FS.readFileSync(outputFilePath, 'utf-8'), expectedFileContent);
            });
    });

});
