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