define([
    'jquery',
    'knockout',
    'pager',
    'fullcalendar',
    'select2',
    'models/day',
    'models/meal',
    'models/ingredient',
    'models/daycollection',
    'models/mealcollection',
    'models/ingredientcollection'
], function ($, ko, pager, fullcalendar, select2, Day, Meal, Ingredient, DayCollection, MealCollection, IngredientCollection) {
    $(function () {
        function AppViewModel() {
            var self = this;
            
            self.calendar = ko.observable($('#calendar'));
            self.dayModal = ko.observable($('#addMealsToDay'));
            self.ingredientRepeater = ko.observable($(null));
            self.mealRepeater = ko.observable($(null));
            self.ingredientSelector = ko.observable($(null));
            
            self.day = ko.observable(new Day());
            self.meal = ko.observable(new Meal());
            self.ingredient = ko.observable(new Ingredient());
            self.dayCollection = ko.observable(new DayCollection());
            self.mealCollection = ko.observable(new MealCollection());
            self.ingredientCollection = ko.observable(new IngredientCollection());
            
            self.initialize = function() {
                self.calendar().fullCalendar({
                    selectable: true,
                    events: self.dayCollection().fetch,
                    dayClick: self.dayClick
                });
                self.day().meals().createMealSelector($('#inputDayMeals'));
            };

            self.dayClick = function(date, event, view) {
                self.day().id(date.format('YYYYMMDD'));
                self.day().date(date);
                self.day().fetch(function(fetched) {                    
                    self.dayModal().modal('show');
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
                self.meal().ingredients().initialize({});
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

            self.addMeal = function(e) {
                self.meal().create(function() {
                    self.refreshMeals();
                    e.reset();
                    self.meal().ingredients().initialize({});
                });
            };
            
            self.initIngredientRepeater = function() {
                self.ingredientRepeater($('#ingredientsRepeater'));
                self.ingredientRepeater().repeater({
                    staticHeight: false,
                    dataSource: self.ingredientCollection().repeaterSource
                });
            };

            self.initMealPage = function() {
                self.meal().ingredients().createIngredientSelector($('#inputMealIngredients'));
            };
            
            self.initMealsPage = function() {
                // Set up the repeater (list of all meals)
                self.mealRepeater($('#mealsRepeater'));
                self.mealRepeater().repeater({
                    staticHeight: false,
                    dataSource: self.mealCollection().repeaterSource
                });

                // Set up the ingredient selector on the new_meal form
                self.ingredientSelector($('#ingredientSelector'));
                self.meal().ingredients().createIngredientSelector(self.ingredientSelector());
            };
        }

        viewModel = new AppViewModel();
        viewModel.initialize();

        pager.extendWithPage(viewModel);
        ko.applyBindings(viewModel);
        pager.start();
    });
});
