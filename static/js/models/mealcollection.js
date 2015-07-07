define([
    'jquery',
    'knockout',
    'models/meal'
], function ($, ko, Meal) {
    function MealCollection() {
        var self = this;
        self.meals = ko.observableArray([]);

        self.apiPath = ko.computed(function() {
            return '/api/v1/meal?limit=100';
        });
        
        self.initialize = function(data) {
            self.meals.removeAll();
            $.each(data.meals, function(i, mealData) {
                var meal = new Meal();
                meal.initialize(mealData);
                self.meals.push(meal);
            });
        };

        self.fetch = function(page) {
            $.getJSON(self.apiPath(), function (data) {                
                if (data) {
                    data.meals = data.hits;
                    self.initialize(data);
                }                
            });
        };
        
        self.each = function(cb) {
            $.each(self.meals(), function(i, meal) {
                cb(meal);
            });
        };
    }
    
    return MealCollection;
});
