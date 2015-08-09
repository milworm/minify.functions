# minify.functions

Minifies/Obfuscates JS function names in your javascript files.

##before:
    function Application() {
        this.name = "Cool Application";
        this.initialize();

        // will be not converted.
        var someName = AnotherClass.getName();
        console.log(someName);
        // will be not converted.
        (new AnotherClass()).initialize();
    }

    Application.prototype = {

        /**
         * @private
         */
        initialize: function() {
            console.log(this.getName());
        },

        /**
         * @private
         */
        getName: function() {
            return this.name;
        },

        destroy: function() {
            this.isDestroyed = true;
        }
    }

    new Application();

##after:
    function Application() {
        this.name = 'Cool Application';
        this._f0();
        var someName = AnotherClass.getName();
        console.log(someName);
        new AnotherClass().initialize();
    }
    Application.prototype = {
        _f0: function () {
            console.log(this._f1());
        },
        _f1: function () {
            return this.name;
        },
        destroy: function () {
            this.isDestroyed = true;
        }
    };
    new Application();

## how to run:
    npm install
    node m.js

    $ node m.js 
    Line    6 - AnotherClass.getName couldn't be replaced because of unknown scope.
    Line    9 - new AnotherClass().initialize couldn't be replaced because of unknown scope.
    done