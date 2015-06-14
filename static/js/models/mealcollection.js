define(
    ['backbone', 'models/meal'],
    function(Backbone, Meal) {
        var MealCollection = Backbone.Collection.extend({
            model: Meal,
            url: '../api/v1/meal',
            parse: function(response) {                
                return response.hits;
            }
        });
        return MealCollection;
    }
);
