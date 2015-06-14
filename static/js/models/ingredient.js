define(
    ['backbone'],
    function(Backbone) {
        var Ingredient = Backbone.Model.extend({
            defaults: {
                id: null,
                name: '',
                description: '',
                created_at: '',
                updated_at: ''
            },

            initialize: function() {
                console.log("Initialized Ingredient");
            }
        });
        return Ingredient;
    }
);
