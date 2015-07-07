define([
    'jquery',
    'knockout',
    'pager',
    'fullcalendar',
    'models/day',
    'models/daycollection'
], function ($, ko, pager, fullcalendar, Day, DayCollection) {
    $(function () {
        function AppViewModel() {
            var self = this;
            self.calendar = ko.observable($('#calendar'));
            
            self.day = ko.observable(new Day());
            self.dayCollection = ko.observable(new DayCollection());
            
            self.initialize = function() {
                self.calendar().fullCalendar({
                    selectable: true,
                    events: self.dayCollection().fetch
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
