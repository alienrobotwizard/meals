import cherrypy

class DaysController(object):
    
    @cherrypy.tools.json_out()
    def list_days(self):
        return {'hits':[], 'total':0}

    @cherrypy.tools.json_out()
    def get_day(self, day_id):
        return {'day': 'day'}

    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def add_day(self):
        data = cherrypy.request.json
        return {'created': False, 'day': None}
        
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def update_day(self, day_id):
        data = cherrypy.request.json
        return {'updated': False, 'day': day_id}

    @cherrypy.tools.json_out()
    def delete_day(self, day_id):
        return {'deleted': False, 'day': day_id}

