'use strict';
/* globals _: true */

var _ = require('lodash'),
    Logger = require('g33k-logger'),
    exec = require('child_process').execFile;

var speak = function(options) {
    var self = this;

    // Expose engine name
    self.name = 'default';

    // Set defaults
    self.opts = _.extend({
        playerList: [
            'mplayer',
            'afplay',
            'mpg123',
            'mpg321',
            'play'
        ],
        playerOptions: {
            'mplayer': {
                stdin: true,
                volume: '-v'
            },
            'afplay': {
                volume_multiplier: 0.01,
                args: ['-v', '%volume%', '%file%']
            }
        },
        loglevel: 0
    }, options);


    // Find a player if no one defined explicitely
    if (self.opts.player) {
        self.name = self.opts.player;

        if (self.opts.volume && self.opts.playerOptions[self.name] && self.opts.playerOptions[self.name].volume_multiplier)
            self.opts.volume = self.opts.volume * self.opts.playerOptions[self.name].volume_multiplier;
    }

    // Extends core with logger
    _.extend(self, Logger.builder('[tts-speak-'+self.name+']', self.opts.loglevel));

};

speak.prototype.exec = function(file, next) {
    var self = this;

    if (!self.opts.player) {
        return next('No suitable audio player could be found - exiting.');
    }

    var playerOptions = self.opts.playerOptions[self.opts.player] || {};
    var args = playerOptions.args || ['%file%'];
    args = args.slice(0); // copy array

    var vars = _.extend(self.opts, { file: file });
    for (var i in vars)
    {
        for (var k in args)
        {
            args[k] = args[k].replace(new RegExp('%' + i + '%', 'g'), vars[i]);
        }
    }

    self.proc = exec(self.opts.player, args, function(err) {
        if (_.isFunction(next)) next(err);
    });
    
};

speak.prototype.kill = function() {
    var self = this;
    if (self.proc && (self.proc.exitCode === null)) {
        self.trace('Kill audio player'); 
        self.proc.kill('SIGTERM');
    }
};

module.exports = speak;

