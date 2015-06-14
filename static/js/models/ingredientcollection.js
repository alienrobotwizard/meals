define(
    ['backbone', 'models/ingredient'],
    function(Backbone, Ingredient) {
        var IngredientCollection = Backbone.Collection.extend({
            model: Ingredient,
            url: '../api/v1/ingredient',
            parse: function(response) {                
                return response.hits;
            }
        });
        return IngredientCollection;
    }
);
