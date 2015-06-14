define(
    ['backbone'],
    function(Backbone) {
        var Meal = Backbone.Model.extend({
            defaults: {
                id: null,
                title: '',
                description: '',
                recipe: '',
                created_at: '',
                updated_at: '',
                ingredients: []
            },

            initialize: function() {
                console.log("Initialized Meal");
            }
        });
        return Meal;
    }
);
