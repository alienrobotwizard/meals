import cherrypy

class MealsController(object):

    @cherrypy.tools.json_out()
    def list_meals(self):
        return {'hits':[], 'total':0}

    @cherrypy.tools.json_out()
    def get_meal(self, meal_id):
        return {'meal': 'meal'}

    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def add_meal(self):
        data = cherrypy.request.json
        return {'created': False, 'meal': None}
        
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def update_meal(self, meal_id):
        data = cherrypy.request.json
        return {'updated': False, 'meal': meal_id}

    @cherrypy.tools.json_out()
    def delete_meal(self, meal_id):
        return {'deleted': False, 'meal': meal_id}
