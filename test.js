var tests = require('./index.js')("");

tests( 
    ["copy", "cp simple.txt copy.txt" ],
    ["replace", "cp simple.txt copy.txt", {
        "copy.txt" : function (can, bui) {
            bui = bui.toString().replace("hi", "bye");
            return bui === can.toString();
        }
    }],
    ["json",  "", {   "stuff.json" : tests.json }],
    ["scrambled", "", { "scrambled.txt" : tests.split() }]
);
