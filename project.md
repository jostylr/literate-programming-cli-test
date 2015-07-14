# [literate-programming-cli-test](# "version:0.5.1; Testing framework for literate-programming-cli")

 
* [index.js](#testing "save: | jshint") This runs the test for this module.
* [lprc.js](#lprc "save: |jshint ")  The lprc file. 
* [test.js](#test "save: |jshint") Testing the tester
* [README.md](#readme "save:| raw ## README, !--- | sub \n\ #, # |trim ") The standard README.
* [package.json](#npm-package "save: | jshint") The requisite package file for a npm project. 
* [TODO.md](#todo "save: | raw ## TODO, !--- ") A list of growing and shrinking items todo.
* [LICENSE](#license-mit "save:  ") The MIT license as I think that is the standard in the node community. 
* [.npmignore](#npmignore "save: ")
* [.gitignore](#gitignore "save: ")
* [.travis.yml](#travis "save: ")


##  Testing

We need an easy way to do testing of both this module and plugins. This is
super opinionated. Convention rather than configuration. 

Each test directory can have the following: 

* `out.txt`  This should the match the output from running the `litpro` command.
  If none present, the output is ignored.
* `err.txt`  Same as out, except it uses standard error
* canonical  This is the canonical example directory that should match the
  output. Each directory in canonical and files should match corresponding
  stuff in the top test directory. Normally, this should be build and cache.
  This will not catch extra outputs outside of the canonical directories,
  e.g., if the `litpro` generates file `bad.txt` in the top directory, but `bad.txt`
  is not in the canonical directory, then it will not be seen by this process.

So this little helper handles reading in all of the files and checking the
output. 


`mod.tests([directory, command options], [], ...)`

The test name is the directory name. The litpro command will run from the
named directory, cding to it first. It also assumes the litpro dev dependency
is located in the directory above in `node_modules/.bin/litpro` or as set in
the .cmd option of tests.

The idea is that each test can have its own directory under the `tests`
directory. The command to execute the literate programming is specified in the
test and can be whatever is being tested with the files arranged in whatever
fashion. But there is a special directory of `canonical` for which everything
in it should match the generated stuff in the top directory.

This will also set up those directories. If the name starts with `*` then it
will set it up, using the rest of the name for the test directory and for the
input for the setup as that name with a `.md` attached to it sitting in the
tests directory. 

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

        var equals = _":buffer equals";
        var readdir = _":recursive readdir";
        var checkdir = _":checking dir equality";
        var test = _":test";
        var setup = _":setup";

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

        tests.json = _":json";

        tests.split = _":split";

        return tests;

    };


[json]() 

This tests if the two files are JSON files and equal.

     function (can, bui) {
            try {
                can = JSON.parse(can.toString());
                bui = JSON.parse(bui.toString());
                return deepEquals(can, bui);
            } catch (e) {
                console.log(e);
                return false;
            }
        }

[split]()

This will split the given text into lines, check the same number of lines,
sort them, and then apply a matching function if provided for each line. The
default is equality of the lines.

This is constructor whose argument is the matcher. 

    function (optional) {
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
    }

[setup]() 

This sets up a test directory. It simply splits on lines with `---` at the
beginning of a line. The first line should not have the dashes. It can have a
colon or an equals, depending, or nothing if the initial text is not to be
saved. A colon after the dashes will be an input file, saved in the top
directory of the test file. If there is an equals sign, then that is an output
to be put in canonical.

We want to allow natural `---` so we do some work to allow that, getting rid
of any leading text that is not from a colon or equal split.  We created a
reversed order array simply to use the 0 entry as the current; the order does
not matter for file writing (well, unless one is writing the file twice, but
why do that? -- this goes with the first). 

    function (name) {
        try {
            var input = read(resolve( "tests", name + ".md"), 
                {encoding:"utf8"} ).split("\n---");

            if (input.length === 0) {
                console.log("file empty" + name);
                return ;
            }

            //this creates all directories in path so top and can
            mkdirp.sync( resolve("tests", name, "canonical") );


            var transform = [];
            var comment = true;
    

            input.forEach( function (el) {
                if ( (el[0] === ":") || (el[0] === "=") ) {
                    comment = false;
                    transform.unshift(el);
                } else if ( (el[0] === "#" ) || (comment) ) { // comment
                    comment = true;
                    return;
                } else {
                    transform[0] = transform[0] +  "\n---" + el;
                    return;
                }   
            });


            transform.forEach( function (el) {
                var  path, ind = el.indexOf("\n");
                var fname = el.slice(1, ind).trim();
                if (el[0] === ":") {
                    path = resolve("tests", name, fname);
                } else if (el[0] === "=") {
                    path = resolve("tests", name, "canonical", fname);
                } else { //shouldn't happen
                    console.error("error:bad entry in setting up", el);
                }
                mkdirp.sync( path.slice(0, path.lastIndexOf(sep) ) );
                write(path, el.slice(ind+1) ); 
            });

        } catch (e) {
            console.log("setup failure:" + name, e, e.stack);
        }
    }


[test]()

For each test, we execute the `litpro` command. We store the `stdout` and `stderr`
in out.test and err.test. There is also a reset.test file that will be used to
clean up the root directory before doing the test; the default are the build,
cache, out.test, and err.test. 

After reseting, the test executes the command. Then it checks the directories.

If `"hideConsole"` is passed in as second argument, then no console logs will
appear. This can be handy when testing logging messages. 

    function (tape, dir, command, matcher) {
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

    }
        



[checking dir equality]()

Inspired by [assert-dir-equal](https://github.com/ianstormtaylor/assert-dir-equal) 


    function (dir, matcher) {
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
    }
        

[recursive readdir]()

Based on [fs-recursive-readdir](https://github.com/fs-utils/fs-readdir-recursive)

This is synchronous which is fine for our purposes.


    function self (root, files, prefix) {
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
        }

[buffer equals]()

For v.10 and below we need to manually check the buffer equality. From
[node-buffer-equal](https://github.com/substack/node-buffer-equal)

    function (a, b) {
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
    }


## lprc


The `lprc` file. 

    /*global require, module */

    module.exports = function(Folder, args) {

        if (args.file.length === 0) {
            args.file = ["project.md"];
        }
        args.build = ".";
        args.src = ".";

        require('litpro-jshint')(Folder, args);

    };


## Test

A simple test file

    /*global require */
    
    var testhan = require('./index.js');

    var tests = testhan("", "hideConsole");

    tests( 
        ["copy", "cp simple.txt copy.txt" ],
        ["replace", "cp simple.txt copy.txt", {
            "copy.txt" : function (can, bui) {
                bui = bui.toString().replace("hi", "bye");
                return bui === can.toString();
            }
        }],
        ["json",  "", _":json"],
        ["scrambled", "", _":scrambled"]
    );

    var test = testhan();

    test(["*cmd"],
         ["*setup"]);
    
    test = testhan(true, "hideConsole");

    test(["*cmd"]);


[json]() 

Testing the json stuff

    {   "stuff.json" : tests.json }

[scrambled]()

    { "scrambled.txt" : tests.split() }


[off](# "block:")

## README


 # literate-programming-cli-test 

This provides the testing framework for literate-programming command line
client and its plugins. 

This should be a developer dependency in the package. You can use 
`npm install literate-programming-cli-test --save-dev` if you like. 

Then in the test script, you could do something like

    var tests = require('literate-programming-test')();

    tests( 
        ["folder1", "-b seen test.md" ],
        ["first",  "first.md second.md"],
        ["lprc", ""],
        ["encoding", "-e ucs2 ucs2.md -b ."]
    );

   
The require function returns a function that generates the tests function
using the command provided to execute the literate-programming command.
Typically, install [litpro](https://github.com/jostylr/litpro) as a dev
dependency and then the default will be correct. Otherwise, supply your
command pathway. 

Other than the default, this probably works to test any command-line
functionality that generates files and directories. You can pass in
an empty string to run different entirely different commands. 

There is a second option for the returned module function. If you pass in
`"hideConsole"`, then any console output is not shown. It is still written to
`out.test` and `err.test` where one can review it, but this option allows one
to eliminate seeing all the console stuff when it is irrelevant to one's
needs. Passing in `true` to the first argument preserves the default
command if you need to have the second argument by itself. 

The function `tests` expects a sequence of arrays where each entry specifies a
test whose name is the first entry in the array and that is also the name of
the directory under the folder `tests`. The second entry are the specific
arguments to run. If you are not testing the command line options themselves,
this can probably be left blank, particularly with a good `lprc.js` file. 

This function has a set of directories it wipes out by default, namely build,
cache, out.test, and err.test. To overwrite that behavior, put a reset.test
file in your directory listing per line the directories or files that need to
be wiped out to do a clean test. 

The tests are based on a `canonical` directory whose contents are used as the
template of what should be found. 


The directory structure is `tests/folder1/canonical` where folder is the test
folder. If `canonical/great.txt` exists, then the test will look for
`tests/folder1/great.txt` and see that it works. Only the files in canonical
are checked. Thus, this does not check for making extraneous files in the
directory. 

 ### Beyond Strict Equality

The above describes using this as run this command and compare the resulting
files using equality. 

Sometimes that's not good enough. Sometimes you have `JSON` that might get
stored differently, or lines in a different order. So the third argument for
an array line specifies an object that, per file name, will take in a function
that takes in the two text from the files and comes up with a true or false
value. The signature is `function (canonical, build)` so (expected, actual)
text setup. 

The function has some methods that help:  `split` will split the lines and
make sure that equal lines are present, though the ordering may be different.
This is actually a function that gets instantiated and one can pass in a line
comparator to make it different than equality. 

The other function is `json` which will parse both files as `JSON` and see if
they have deep equality. 

       
    var tests = require('./index.js')("", "hideConsole");

    tests( 
        ["copy", "cp simple.txt copy.txt" ],
        ["replace", "cp simple.txt copy.txt", {
            "copy.txt" : function (can, bui) {
                bui = bui.toString().replace("hi", "bye");
                return bui === can.toString();
            }
        }],
        ["json",  "", {   "stuff.json" : tests.json }],
        ["scrambled", "",  { "scrambled.txt" : tests.split() }]
    );

 ### Automated Setup

The design of this plugin has a lot of files to make a test. I don't like
that. So we can also have the plugin parse out a single file into multiple
files. 

To trigger this, use `*name` for the first argument in the test item's array.
Then it will look for `name.md` in the tests directory and create, if
necessary, the directory `tests/name` and populate it with the files found in
the `name.md` Files are separated by `---filename` for inputs (sitting in the
top `name` directory or `===filename` for those that should be in the
`canonical` directory. Subdirectories are fine, just use `/` for them.

    ["*cmd"]

And then in cmd.md

    :lprc.js
    if (args.file.length === 0) {
        args.file = ["project.md"];
    }
    args.build = ".";
    args.src = ".";

    require('litpro-jshint')(Folder, args);
    ---:project.md

    Great

        some code

    [dude.txt](# "save:")

    ---=dude.txt
    some code
    ---=out.test
    (whatever the output oughta be ... run it once and past it in if it looks
    good!)
    ---=err.test
    Maybe if testing error issues

So that could be a test specification and everything should be good to go. 

Note that if the leading text has no leading colon or equals, then the text is
ignored until the first `---:` or `---=`.  Also, `---#` will trigger a block
that is ignore.  Finally, a plain `---` with no `:=#` following it will be
appended to the previous block (ignored if the previous block is the leading
text being ignored). 

 ## LICENSE

[MIT-LICENSE](https://github.com/jostylr/literate-programming/blob/master/LICENSE-MIT)

!---


## TODO

Test the testing framework?

!---

[on](# "block:")

## NPM package

The requisite npm package file. 


    {
      "name": "_`g::docname`",
      "description": "_`g::tagline`",
      "version": "_`g::docversion`",
      "homepage": "https://github.com/_`g::gituser`/_`g::docname`",
      "author": {
        "name": "_`g::authorname`",
        "email": "_`g::authoremail`"
      },
      "repository": {
        "type": "git",
        "url": "git://github.com/_`g::gituser`/_`g::docname`.git"
      },
      "bugs": {
        "url": "https://github.com/_`g::gituser`/_`g::docname`/issues"
      },
      "license": "MIT",
      "main": "index.js",
      "engines": {
        "node": ">=0.10"
      },
      "dependencies":{
        _"g::npm dependencies"
      },
      "devDependencies" : {
        _"g::npm dev dependencies"
      },
      "scripts" : { 
        "test" : "node ./test.js"
      },
      "keywords": ["literate programming"]
    }


## gitignore

    node_modules/
    /old/
    /build/
    /cache/
    /out.test
    /err.test
    /.checksum
    tests/cmd/


## npmignore


    old
    build
    .checksum
    cache
    tests
    test.js
    travis.yml
    node_modules
    *.md


## Travis

A travis.yml file for continuous test integration!

    language: node_js
    node_js:
      - "0.10"
      - "0.12"
      - "iojs"



## LICENSE MIT


    The MIT License (MIT)
    Copyright (c) _"g::year" _"g::authorname"

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.





by [James Taylor](https://github.com/jostylr "npminfo: jostylr@gmail.com ; 
    deps: tape 4.0.0, del 1.2.0, is-utf8 0.2.0, deep-equal 1.0.0, 
          mkdirp 0.5.1;
    dev: litpro 0.9.2, litpro-jshint 0.2.1 ")

