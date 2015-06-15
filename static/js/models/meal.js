define(
    ['backbone', 'models/ingredientcollection'],
    function(Backbone, IngredientCollection) {
        var Meal = Backbone.Model.extend({
            defaults: {
                id: null,
                title: '',
                description: '',
                recipe: '',
                created_at: '',
                updated_at: '',
                ingredients: new IngredientCollection()
            },
            parse: function(response) {
                response.ingredients = new IngredientCollection(response.ingredients);
                return response;
            },
            
            initialize: function(data) {
                console.log("Initialized Meal");
                if (data) {
                    this.set('ingredients', new IngredientCollection(data.ingredients));
                }
            }
        });
        return Meal;
    }
);
