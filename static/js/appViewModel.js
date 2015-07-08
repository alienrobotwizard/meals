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
                // Set up the repeater (list of all meals)
                self.mealRepeater($('#mealsRepeater'));
                self.mealRepeater().repeater({
                    staticHeight: false,
                    dataSource: self.mealCollection().repeaterSource
                });

                // Set up the ingredient selector on the
                // new_meal form
                var ingredientSelectorArgs = {
                    ajax: {
                        url: '/api/v1/ingredient',
                        dataType: 'json',
                        delay: 250,
                        data: function(params) {
                            console.log(params);
                            return {
                                'name': params.term
                            };
                        },
                        processResults: function(data, pg) {
                            return {
                                results: $.map(data.hits, function(hit, i) {
                                    return {'text': hit.name, 'id': hit.id};
                                })
                            };
                        }
                    },
                    minimumInputLength: 0
                };
                self.ingredientSelector($('#ingredientSelector'));
                self.ingredientSelector().select2(ingredientSelectorArgs);
                self.ingredientSelector().on('select2:select', function(e) {
                    var ing = new Ingredient();
                    ing.id(e.params.data.id);
                    ing.fetch(function(fetched) {
                        fetched.quantity(1);
                        self.meal().ingredients().push(fetched);
                        self.ingredientSelector().val(null).trigger('change');
                    });
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
