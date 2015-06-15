require(
    ['jquery', 'underscore', 'backbone', 'models/daycollection', 'views/app-view'],
    function($, _, BackBone, DayCollection, AppView) {
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
            new AppView(days);
        });
    }
);
