define(
    ['backbone', 'models/mealcollection'],
    function(Backbone, MealCollection) {
        var Day = Backbone.Model.extend({
            defaults: {
                id: '',
                date: '',
                created_at: '',
                updated_at: '',
                meals: new MealCollection()
            },

            parse: function(response) {
                response.meals = new MealCollection(response.meals);
                return response;
            },
            
            initialize: function(data) {
                console.log("Initialized Day");
            }           
        });
        return Day;
    }
);
