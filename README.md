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


## LICENSE

[MIT-LICENSE](https://github.com/jostylr/literate-programming/blob/master/LICENSE-MIT)
