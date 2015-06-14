define(
    ['backbone'],
    function(Backbone) {
        var Day = Backbone.Model.extend({
            defaults: {
                id: '',
                date: '',
                created_at: '',
                updated_at: '',
                meals: []
            },

            initialize: function() {
                console.log("Initialized Day");
            }
        });
        return Day;
    }
);
