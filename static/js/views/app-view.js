define(
    ['jquery', 'backbone', 'fullcalendar'],
    function($, Backbone, fullcalendar) {
        var AppView = Backbone.View.extend({
            el: '#mealplan',

            initialize: function(days) {
                this.days = days;
                this.$calendar = this.$('#calendar');
                this.$calendar.fullCalendar({
                    selectable: true,
                    events: function(start, end, timezone, callback) {
                        days.mealEvents(start, end, callback);
                    }
                });
            }
            
        });
        return AppView;
    }
);
