# literate-programming-cli-test 

This provides the testing framework for literate-programming command line
client and its plugsin. 

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
Typically, install literate-programming-cli as a deve dependency and then the
default will be correct. Otherwise, supply your command pathway. 

Other than that the default, this probably works to test any command-line
functionality that generates files and directories.

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

    
## LICENSE

[MIT-LICENSE](https://github.com/jostylr/literate-programming/blob/master/LICENSE-MIT)
