/*global require, module, console*/

var fs = require('fs');
var read = fs.readFileSync;
var write = fs.writeFileSync;
var path = require('path');
var resolve = path.resolve;
var exec = require('child_process').exec;
var del = require('del');
var isUtf8 = require('is-utf8');
var tape = require('tape');

module.exports = function (litpro) {
    if (typeof litpro === "undefined") {
        litpro = 'node ../../node_modules/literate-programming-cli/litpro.js';
    }

    
  


    var equals = function (a, b) {
        if (typeof a.equals === 'function') {
            return a.equals(b);
        }
        var i, n = a.length;
        if (n !== b.length) {
            return false;
        }
        
        for (i = 0; i < n; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        
        return true;
    };
    var readdir = function self (root, files, prefix) {
        prefix = prefix || '';
        files = files || [];
    
        var dir = path.join(root, prefix);
        if (!fs.existsSync(dir)) {
            return;
        }
        if (fs.statSync(dir).isDirectory()) {
            fs.readdirSync(dir).
            forEach(function (name) {
                self(root, files, path.join(prefix, name));
            });
        } else {
            files.push(prefix);
        }
    
        return files;
        };
    var checkdir = function (dir) {
        var ret = [];
        var count = 0;
        var expecteds = readdir( resolve("tests", dir, "canonical") );
        expecteds.forEach(function(rel){
            count += 1;
            var e = read(resolve("tests", dir, "canonical", rel));
            var a = read(resolve("tests", dir, rel));
            if (!(equals(e, a))) {
                if (isUtf8(e) && isUtf8(a) ) {
                    ret.push(rel + "\n~~~Expected\n" + e.toString() + "\n~~~Actual\n" + 
                        a.toString() + "\n---\n\n");
                } else {
                    ret.push(rel);
                }
            }
        });
        return [count, ret];
    };
    var test = function (tape, dir, command) {
        command = command || '' ;
        var reset;
    
        tape(dir, function (t) {
            t.plan(1);
    
            try {
                reset = read(resolve( "tests", dir, "reset.test"), 
                    {encoding:"utf8"} ).split("\n");
            } catch (e) {
                reset = ["build", "cache", "out.test", "err.test"];
            }
            reset = reset.filter( function (el) {
                    return el;
                }).map(function (el) {
                    return resolve("tests", dir, el);
                }
            );
            //console.log(reset);
            del.sync(reset);
            //console.log(readdir( resolve("tests", dir ) ));
    
            var cmd = "cd tests/"+ dir + "; " + litpro + " " + command;
    
    
            exec(cmd, function (err, stdout, stderr)  {
                if (err) {
                    console.log(err);
                }
                write(resolve("tests", dir, "out.test"), stdout );
                write(resolve("tests", dir, "err.test"), stderr);
                var results = checkdir(dir);
                var bad = results[1];
                var msg = "CHECKED: " + results[0];
                if (bad.length > 0) {
                    t.fail(msg + "\n" + "BAD: " + bad.length  );
                    console.log("not equal:\n" + bad.join("\n"));
                } else {
                    t.pass(msg);
                }
            });
        });
    
    };

    return function () {
        var i, n = arguments.length;

        for (i = 0; i < n; i += 1) {
            test(tape, arguments[i][0], arguments[i][1]);               
        }

    };

};
