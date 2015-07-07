define([
    'jquery',
    'knockout',
    'models/ingredient'
], function ($, ko, Ingredient) {
    function IngredientCollection() {
        var self = this;
        self.ingredients = ko.observableArray([]);

        self.apiPath = ko.computed(function() {
            return '/api/v1/ingredient?limit=100';
        });
        
        self.initialize = function(data) {
            self.ingredients.removeAll();
            $.each(data.ingredients, function(i, ingredientData) {
                var ingredient = new Ingredient();
                ingredient.initialize(ingredientData);
                self.ingredients.push(ingredient);
            });
        };

        self.fetch = function(page) {
            $.getJSON(self.apiPath(), function (data) {                
                if (data) {
                    data.ingredients = data.hits;
                    self.initialize(data);
                }                
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
