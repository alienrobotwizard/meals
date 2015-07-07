define([
    'jquery',
    'knockout',
    'models/meal'
], function ($, ko, Meal) {
    function MealCollection() {
        var self = this;
        self.meals = ko.observableArray([]);

        self.initialize = function(data) {
            self.meals.removeAll();
            $.each(data.meals, function(i, mealData) {
                var meal = new Meal();
                meal.initialize(mealData);
                self.meals.push(meal);
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
