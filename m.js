var esprima = require("esprima"),
    estraverse = require("estraverse"),
    escodegen = require("escodegen"),
    waterfall = require("async-waterfall"),
    fs = require("fs"),
    sprintf = require("sprintf").sprintf;

/*
 * An implementation of Ruby's string.succ method.
 * By Devon Govett
 *
 * Returns the successor to str. The successor is calculated by incrementing characters starting 
 * from the rightmost alphanumeric (or the rightmost character if there are no alphanumerics) in the
 * string. Incrementing a digit always results in another digit, and incrementing a letter results in
 * another letter of the same case.
 *
 * If the increment generates a carry, the character to the left of it is incremented. This 
 * process repeats until there is no carry, adding an additional character if necessary.
 *
 * succ("abcd")      == "abce"
 * succ("THX1138")   == "THX1139"
 * succ("<<koala>>") == "<<koalb>>"
 * succ("1999zzz")   == "2000aaa"
 * succ("ZZZ9999")   == "AAAA0000"
 */
 
function succ(input) {
    var alphabet = 'abcdefghijklmnopqrstuvwxyz',
        length = alphabet.length,
        result = input,
        i = input.length;
        
    while(i >= 0) {
        var last = input.charAt(--i),
            next = '',
            carry = false;
        
        if (isNaN(last)) {
            index = alphabet.indexOf(last.toLowerCase());
            
            if (index === -1) {
                next = last;
                carry = true;
            }
            else {
                var isUpperCase = last === last.toUpperCase();
                next = alphabet.charAt((index + 1) % length);
                if (isUpperCase) {
                    next = next.toUpperCase();
                }
                
                carry = index + 1 >= length;
                if (carry && i === 0) {
                    var added = isUpperCase ? 'A' : 'a';
                    result = added + next + result.slice(1);
                    break;
                }
            }
        }
        else {
            next = +last + 1;
            if(next > 9) {
                next = 0;
                carry = true
            }
            
            if (carry && i === 0) {
                result = '1' + next + result.slice(1);
                break;
            }
        }
        
        result = result.slice(0, i) + next + result.slice(i + 1);
        if (!carry) {
            break;
        }
    }
    return result;
}

var Minifier = {
    init: function(content) {
        this.ast = esprima.parse(content, {
            attachComment: true,
            loc: true
        });
    },

    isFunctionNode: function(node) {
        return node.type == "Property" && node.value.type == "FunctionExpression";
    },

    minify: function() {
        this.methods = {};
        this.key = "_f0";

        var ast = this.getAst();

        // collect private methods
        estraverse.traverse(ast, {
            enter: this.collectMethods.bind(this)
        });

        // replace private methods
        estraverse.traverse(ast, {
            enter: this.replaceMethods.bind(this)
        });

        for(var method in this.methods)
            if(! this.methods[method].used)
                console.log("unused method: " + method);
    },

    isMinifiable: function(node) {
        if(! node.leadingComments)
            return false;

        var comments = node.leadingComments;

        for(var i=0, comment; comment=comments[i]; i++)
            if(/@private/.test(comment.value))
                return true;

        return false;
    },

    collectMethods: function(node, parent) {
        if(! this.isMinifiable(node))
            return ;

        this.methods[node.name] = {
            name: this.key,
            used: false,
            node: node
        }

        node.name = this.key;
        this.key = succ(this.key);
    },

    replaceMethods: function(node, parent) {
        if(node.type != "MemberExpression")
            return ;

        if(! this.methods[node.property.name])
            return ;

        var objectName = node.object.name,
            property = node.property.name;

        if(node.object.type == "ThisExpression")
            objectName = "this";

        if(["this", "_this", "me"].indexOf(objectName) == -1) {
            var message = sprintf("Line %4s - %s couldn't be replaced because of unknown scope.",
                node.loc.start.line,
                escodegen.generate(node)
            );

            console.log(message);

            return ;
        }

        this.methods[property].used = true;
        node.property.name = this.methods[property].name;
    },

    getAst: function() {
        return this.ast;
    }
}

waterfall([
    function(callback) {
        fs.readFile("examples/file1.js", "utf-8", function(err, content) {
            Minifier.init(content);
            Minifier.minify();

            callback();
        });
    },

    function(callback) {
        var data = escodegen.generate(Minifier.getAst());
        fs.writeFile("examples/file1.min.js", data, function(err) {
            callback();
        });
    },

    function(callback) {
        console.log("done");
        callback();
    } 
]);