import cherrypy
from datetime import datetime
from meals.model import Day

log = cherrypy.log

class DaysController(object):
    
    @cherrypy.tools.json_out()
    def list_days(self, max_days_ago=7, limit=100, offset=0, order='asc'):
        n = Day.count(cherrypy.request.db, max_days_ago=max_days_ago)
        results = Day.list(cherrypy.request.db, max_days_ago=max_days_ago,
                           limit=limit, offset=offset, order=order)
        return {'hits':[r.encode() for r in results], 'total':n}

    @cherrypy.tools.json_out()
    def get_day(self, day_id):
        day = Day.get(cherrypy.request.db, day_id)
        if not day:
            day = Day(id=day_id, date=datetime.strptime(day_id, '%Y%m%d'))            
        return day.encode()
        
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def update_day(self, day_id):
        data = cherrypy.request.json
        if 'day' in data:
            day = Day.update(cherrypy.request.db, day_id, data['day'])
            return {"updated": True, "day": day.encode()}
            
        cherrypy.response.status = 400
        return {"updated": False, 'error': 'malformed request, request body must include day data'}

    @cherrypy.tools.json_out()
    def delete_day(self, day_id):
        deleted = Day.delete(cherrypy.request.db, day_id)
        return {"deleted": deleted, "day":day_id}

