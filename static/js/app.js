require(
    ['jquery', 'underscore', 'backbone', 'fullcalendar', 'models/daycollection'],
    function($, _, BackBone, fullcalendar, DayCollection) {
        $(function() {
            var MealPlannerRouter = BackBone.Router.extend({
                routes: {
                    'plan': 'viewMealPlan',
                    'meal/:id': 'viewMeal',
                    'ingredient/:id': 'viewIngredient',
                    'new_meal': 'newMeal',
                    'new_ingredients': 'newIngredients'
                },

                viewMealPlan: function() {
                    console.log("Main Meal Plan");
                },

                viewMeal: function(id) {
                    console.log("Viewing meal: "+id);
                },

                viewIngredient: function(id) {
                    console.log("Viewing ingredient: "+id);
                },

                newMeal: function() {
                    console.log("new meal");
                },

                newIngredients: function() {
                    console.log("new ingredients");
                }
                
            });

            var mealPlannerRouter = new MealPlannerRouter();
            Backbone.history.start();
            
            console.log("App started");
            var days = new DayCollection();
            
            $('#calendar').fullCalendar({
                selectable: true,
                select: function(start, end, jsEvent, view) {
                    console.log(start);
                    console.log(end);
                },
                events: function(start, end, timezone, callback) {
                    // callback on array of event objects
                    days.fetch({
                        data: $.param({
                            max_days_ago: 100,
                            limit: 100
                        }),
                        success: function(model) {
                            console.log(model.toEvents());
                            callback(model.toEvents());
                        }
                    });
                }
            });
        });
    }
);
