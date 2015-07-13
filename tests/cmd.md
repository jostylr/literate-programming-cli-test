:lprc.js
if (args.file.length === 0) {
    args.file = ["project.md"];
}
require('litpro-jshint')(Folder, args);
---:project.md

Great

    some code

[dude.txt](# "save:")

---=build/dude.txt
some code

---=out.test
SAVED: ./build/dude.txt
DONE: ./build

---=err.test
