define([
    'jquery',
    'knockout',
    'pager',
    'fullcalendar',
    'models/day',
    'models/daycollection',
    'models/mealcollection',
    'models/ingredientcollection'
], function ($, ko, pager, fullcalendar, Day, DayCollection, MealCollection, IngredientCollection) {
    $(function () {
        function AppViewModel() {
            var self = this;
            self.calendar = ko.observable($('#calendar'));
            
            self.day = ko.observable(new Day());
            self.dayCollection = ko.observable(new DayCollection());
            self.ingredientCollection = ko.observable(new IngredientCollection());
            self.mealCollection = ko.observable(new MealCollection());
            
            self.initialize = function() {
                self.calendar().fullCalendar({
                    selectable: true,
                    events: self.dayCollection().fetch
                });
            };

            self.refresh = function() {
                self.calendar().fullCalendar('refetchEvents');
            };
        }

        viewModel = new AppViewModel();
        viewModel.initialize();

        pager.extendWithPage(viewModel);
        ko.applyBindings(viewModel);
        pager.start();
    });
});
