import cherrypy

class IngredientsController(object):
    
    @cherrypy.tools.json_out()
    def list_ingredients(self):
        return {'hits':[], 'total':0}

    @cherrypy.tools.json_out()
    def get_ingredient(self, ingredient_id):
        return {'ingredient': 'ingredient'}

    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def add_ingredient(self):
        data = cherrypy.request.json
        return {'created': False, 'ingredient': None}
        
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def update_ingredient(self, ingredient_id):
        data = cherrypy.request.json
        return {'updated': False, 'ingredient': ingredient_id}

    @cherrypy.tools.json_out()
    def delete_ingredient(self, ingredient_id):
        return {'deleted': False, 'ingredient': ingredient_id}

