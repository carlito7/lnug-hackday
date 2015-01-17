'use strict';
var util = require('util');
var events = require('events');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var async = require('async');
var prompt = require('prompt');

prompt.message = 'TESFastly'.white;

function TESFastly(){}
util.inherits(TESFastly, events.EventEmitter);
module.exports = TESFastly;

TESFastly.prototype.init = function() {
    var self = this;
    self.options = {};
    self.options.configPath = [self.findWorkspace(), 'config'].join('/');
    self.options.configFile = [self.options.configPath, 'config.json'].join('/');
    self.config = require('nconf');
    self.run();
};

TESFastly.prototype.run = function() {
    var self = this;

    self._init(function() {
        console.log('run');
    });
};

TESFastly.prototype._init = function(next) {
    var self = this;
     var loadConfig = function() {
        self.config.env()
            .file({
                file: self.options.configFile
            });
    };

    self._checkConfig(function(err, initialise) {
        if (err) return;

        loadConfig();

        if (initialise){
            self._initConfig(function(err) {
                if(err) return;
                next();
            });
        } else {
             next();
        }
    });
};

TESFastly.prototype._initConfig = function(next) {
    
    var self = this;
    prompt.start();

    prompt.get({
        properties: {
            key: {
                description: 'Enter your fastly key:'.white
            }
        }
    }, function(err, result) {
        self.config.set('key', result.key);
        console.log('\r');
        self.config.save(next);
    });  
};

TESFastly.prototype._checkConfig = function(next) {
    var self = this;

    var checkConfigPath = function(cb) {
        if(!self.exists(self.options.configPath)){
            mkdirp(self.options.configPath, cb);
        }else{
            cb();
        }
    };

    var checkConfigFile = function(cb) {
        if(!self.exists(self.options.configFile)){
            prompt.start();
            prompt.get({
                properties: {
                    confirm: {
                        description: 'Do you want to create a config file?'.white
                    }
                }
            }, function(err, result) {
                if(!result) return cb({
                    message: 'Did not confirm'
                });
                if(result.confirm === 'Y' || result.confirm === 'y'){
                    var content = '{\n    "key": ""\n}';
                    fs.writeFileSync(self.options.configFile, content);
                    cb(null, true);
                } else {
                    cb({
                        message: 'Did not confirm'
                    });
                }
            });
        } else {
            cb();   
        }
    };
    
    async.series([checkConfigPath, checkConfigFile], function(err, result) {
        next(err, result[1]);
    });
};

TESFastly.prototype.exists = function(path) {
    return fs.existsSync(path);
};

TESFastly.prototype.findWorkspace = function() {
    for (var p = path.resolve('.');; p = path.resolve(p, '..')) {
        if (this.exists(path.join(p, 'config', 'config.json'))) return p;
        if (p === '/') break;
    }
    return path.resolve('.');
};


