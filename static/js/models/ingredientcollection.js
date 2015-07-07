define([
    'jquery',
    'knockout',
    'models/ingredient'
], function ($, ko, Ingredient) {
    function IngredientCollection() {
        var self = this;
        self.ingredients = ko.observableArray([]);

        self.initialize = function(data) {
            self.ingredients.removeAll();
            $.each(data.ingredients, function(ingredientData) {
                var ingredient = new Ingredient();
                ingredient.initialize(ingredientData);
                self.ingredients.push(ingredient);
            });
        };

        self.each = function(cb) {
            $.each(self.ingredients(), function(i, ingredient) {
                cb(ingredient);
            });
        };
    }
    
    return IngredientCollection;
});
