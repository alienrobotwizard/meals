define([
    'jquery',
    'knockout',
    'pager',
    'fullcalendar',
    'models/day',
    'models/meal',
    'models/ingredient',
    'models/daycollection',
    'models/mealcollection',
    'models/ingredientcollection'
], function ($, ko, pager, fullcalendar, Day, Meal, Ingredient, DayCollection, MealCollection, IngredientCollection) {
    $(function () {
        function AppViewModel() {
            var self = this;
            self.calendar = ko.observable($('#calendar'));
            self.ingredientRepeater = ko.observable($(null));
            self.mealRepeater = ko.observable($(null));
            
            self.day = ko.observable(new Day());
            self.meal = ko.observable(new Meal());
            self.ingredient = ko.observable(new Ingredient());
            self.dayCollection = ko.observable(new DayCollection());
            self.mealCollection = ko.observable(new MealCollection());
            self.ingredientCollection = ko.observable(new IngredientCollection());
            
            self.initialize = function() {
                self.calendar().fullCalendar({
                    selectable: true,
                    events: self.dayCollection().fetch
                });
            };

            self.refresh = function() {
                self.calendar().fullCalendar('refetchEvents');
            };

            self.refreshIngredients = function() {
                self.ingredientRepeater().repeater('render');
                self.ingredient().initialize({});
            };

            self.refreshMeals = function() {
                self.mealRepeater().repeater('render');
                self.meal().initialize({});
            };

            self.fetchIngredient = function(page) {
                self.ingredient().id(page.page.id());
                self.ingredient().fetch();                
            };

            self.fetchMeal = function(page) {
                self.meal().id(page.page.id());
                self.meal().fetch();                
            };
            
            self.addIngredient = function(e) {
                self.ingredient().create(function() {
                    self.refreshIngredients();
                    e.reset();
                });                
            };
            
            self.initIngredientRepeater = function() {
                self.ingredientRepeater($('#ingredientsRepeater'));
                self.ingredientRepeater().repeater({
                    staticHeight: false,
                    dataSource: self.ingredientCollection().repeaterSource
                });
            };

            self.initMealRepeater = function() {
                self.mealRepeater($('#mealsRepeater'));
                self.mealRepeater().repeater({
                    staticHeight: false,
                    dataSource: self.mealCollection().repeaterSource
                });
            };
        }

        viewModel = new AppViewModel();
        viewModel.initialize();

        pager.extendWithPage(viewModel);
        ko.applyBindings(viewModel);
        pager.start();
    });
});
