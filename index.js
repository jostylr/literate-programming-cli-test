/*global require, module, console*/

var fs = require('fs');
var read = fs.readFileSync;
var write = fs.writeFileSync;
var path = require('path');
var resolve = path.resolve;
var sep = path.sep;
var exec = require('child_process').exec;
var del = require('del');
var isUtf8 = require('is-utf8');
var tape = require('tape');
var mkdirp = require('mkdirp');

var deepEquals =  require('deep-equal');



module.exports = function (litpro, flag) {
    if ( (typeof litpro === "undefined") || (litpro === true) ) {
        litpro = 'node ../../node_modules/litpro/litpro.js';
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
    var checkdir = function (dir, matcher) {
        var ret = [];
        var count = 0;
        var expecteds = readdir( resolve("tests", dir, "canonical") );
        expecteds.forEach(function(rel){
            count += 1;
            try {
                var e = read(resolve("tests", dir, "canonical", rel));
                var a = read(resolve("tests", dir, rel));
                var check = matcher[rel] || equals;
                if (!(check(e, a))) {
                    if (isUtf8(e) && isUtf8(a) ) {
                        ret.push(rel + "\n~~~Expected\n" + e.toString() + "\n~~~Actual\n" + 
                            a.toString() + "\n---\n\n");
                    } else {
                        ret.push(rel);
                    }
                }
            } catch (err) {
                ret.push(["error with " + rel, err, err.stack]);
            }
        });
        return [count, ret];
    };
    var test = function (tape, dir, command, matcher) {
        command = command || '' ;
        matcher = matcher || {};
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
                if (!(flag &&  (flag.indexOf("hideConsole") !== -1) )) {
                    console.log(stdout);
                    console.log(stderr);
                }
                write(resolve("tests", dir, "out.test"), stdout );
                write(resolve("tests", dir, "err.test"), stderr);
                var results = checkdir(dir, matcher);
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
    var setup = function (name) {
        try {
            var input = read(resolve( "tests", name + ".md"), 
                {encoding:"utf8"} ).split("\n---");
    
            if (input.length === 0) {
                console.log("file empty" + name);
                return ;
            }
    
            //this creates all directories in path so top and can
            mkdirp.sync( resolve("tests", name, "canonical") );
    
            input.forEach( function (el) {
                var  path, ind = el.indexOf("\n");
                var fname = el.slice(1, ind).trim();
                if (el[0] === ":") {
                    path = resolve("tests", name, fname);
                } else if (el[0] === "=") {
                    path = resolve("tests", name, "canonical", fname);
                } else {
                    return;
                }
                mkdirp.sync( path.slice(0, path.lastIndexOf(sep) ) );
                write(path, el.slice(ind+1)); 
                
            });
    
        } catch (e) {
            console.log("setup failure:" + name, e, e.stack);
        }
    };

    var tests = function () {
        var i, n = arguments.length;
        var name;

        for (i = 0; i < n; i += 1) {
            name = arguments[i][0]; 
            if (name[0] === "*") {
                name = name.slice(1);
                setup(name);
            }
            test(tape, name, arguments[i][1], arguments[i][2]);               
        }

    };

    tests.json =  function (can, bui) {
            try {
                can = JSON.parse(can.toString());
                bui = JSON.parse(bui.toString());
                return deepEquals(can, bui);
            } catch (e) {
                console.log(e);
                return false;
            }
        };

    tests.split = function (optional) {
        var equals = optional || function (a, b) {
            return a === b;
        };
    
        return function (can , bui) {
            can = can.toString().split("\n").sort();
            bui = bui.toString().split("\n").sort();
            
            if ( can.length !== bui.length) {
                return false;
            }
    
            var i, n = can.length;
            for (i = 0; i < n; i +=1) {
                if ( !  equals(can[i], bui[i]) ) {
                    return false;
                } 
            }
    
            return true;
        };
    };

    return tests;

};
